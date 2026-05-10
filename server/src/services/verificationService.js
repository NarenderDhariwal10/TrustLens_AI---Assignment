import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchWeb } from "./webSearchService.js";
import { generateContentWithRetry } from "../utils/geminiHelpers.js";

const VERIFICATION_PROMPT = `You compare a factual CLAIM against LIVE WEB EVIDENCE (snippets + optional summary answer).

Rules:
- Prefer reputable domains (government, WHO, World Bank, Reuters, Statista, McKinsey, Gartner, major outlets, company investor relations).
- If evidence clearly supports the numeric/temporal essence of the claim, status is VERIFIED even if wording differs slightly (e.g. $1.8T vs $1.81T).
- If evidence shows materially different numbers/dates/facts, status is FALSE.
- If partially right but meaningfully off (wrong magnitude, wrong year range), status is INACCURATE.
- If evidence is too thin or contradictory without a clear winner, status is INSUFFICIENT_DATA.

Return STRICT JSON only:
{
  "status": "VERIFIED|INACCURATE|FALSE|INSUFFICIENT_DATA",
  "confidence": 0-100,
  "actualData": "one concise sentence of what reputable sources indicate",
  "reasoning": "short analyst-style rationale",
  "sourcePick": [
    { "title": "", "url": "" }
  ]
}

Use at most 4 entries in sourcePick — best matching sources from the evidence list.`;

function getVerifierModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw Object.assign(new Error("GEMINI_API_KEY is not configured"), {
      status: 503,
      code: "MISSING_GEMINI",
    });
  }
  const genAI = new GoogleGenerativeAI(key);
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });
}

function parseJsonLoose(raw) {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Verifier returned non-JSON");
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

function buildSearchQuery(claim, keywords) {
  const kws = (keywords || []).slice(0, 6).join(" ");
  const base = claim.length > 220 ? `${claim.slice(0, 220)}…` : claim;
  return [base, kws].filter(Boolean).join(" ");
}

/**
 * @param {{ claim: string; type: string; keywords: string[] }} item
 */
export async function verifyClaim(item) {
  const query = buildSearchQuery(item.claim, item.keywords);
  const web = await searchWeb(query);

  const evidenceLines = [];
  if (web.answer) {
    evidenceLines.push(`Summary answer: ${web.answer}`);
  }
  for (const r of web.results) {
    evidenceLines.push(
      `Source: ${r.title}\nURL: ${r.url}\nSnippet: ${r.content}`
    );
  }

  const evidenceBlock = evidenceLines.join("\n\n").slice(0, 14000);
  const model = getVerifierModel();
  const result = await generateContentWithRetry(model, [
    { text: VERIFICATION_PROMPT },
    {
      text: `\nCLAIM:\n${item.claim}\nTYPE:${item.type}\n\nEVIDENCE:\n${evidenceBlock}\n`,
    },
  ]);

  const parsed = parseJsonLoose(result.response.text());
  const status = normalizeStatus(parsed.status);
  const confidence = clampNumber(parsed.confidence, 0, 100);

  const picked = Array.isArray(parsed.sourcePick) ? parsed.sourcePick : [];
  const mergedSources = mergeSources(picked, web.results);

  return {
    claim: item.claim,
    type: item.type,
    keywords: item.keywords,
    status,
    confidence,
    actualData:
      typeof parsed.actualData === "string"
        ? parsed.actualData
        : "See linked sources.",
    reasoning:
      typeof parsed.reasoning === "string"
        ? parsed.reasoning
        : "Compared claim against recent web results.",
    sources: mergedSources,
  };
}

function normalizeStatus(s) {
  const u = String(s || "").toUpperCase();
  if (
    u === "VERIFIED" ||
    u === "INACCURATE" ||
    u === "FALSE" ||
    u === "INSUFFICIENT_DATA"
  ) {
    return u;
  }
  return "INSUFFICIENT_DATA";
}

function clampNumber(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return 55;
  return Math.min(max, Math.max(min, Math.round(x)));
}

function mergeSources(picked, results) {
  const out = [];
  const seen = new Set();

  for (const p of picked) {
    if (!p?.url) continue;
    if (seen.has(p.url)) continue;
    seen.add(p.url);
    out.push({
      title: p.title || hostname(p.url),
      url: p.url,
      snippet: "",
    });
    if (out.length >= 4) return out;
  }

  for (const r of results) {
    if (!r.url || seen.has(r.url)) continue;
    seen.add(r.url);
    out.push({
      title: r.title || hostname(r.url),
      url: r.url,
      snippet: r.content.slice(0, 280),
    });
    if (out.length >= 4) break;
  }

  return out;
}

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

/**
 * @param {Array<{ claim: string; type: string; keywords: string[] }>} claims
 * @param {(stage: string, index: number, total: number) => void} onProgress
 */
export async function verifyClaimsSequential(claims, onProgress) {
  const max = Number(process.env.MAX_CLAIMS_TO_VERIFY) || 18;
  const slice = claims.slice(0, max);
  const results = [];
  let i = 0;
  for (const c of slice) {
    onProgress?.("verifying_claim", i, slice.length);
    const r = await verifyClaim(c);
    results.push(r);
    i += 1;
  }
  onProgress?.("verifying_claim", slice.length, slice.length);
  return results;
}
