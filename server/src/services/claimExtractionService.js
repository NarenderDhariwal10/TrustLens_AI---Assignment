import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateContentWithRetry } from "../utils/geminiHelpers.js";

const EXTRACTION_PROMPT = `You are a senior fact-checking analyst. From the document text below, extract ONLY high-value factual claims that can be checked against public sources.

Include:
- statistics, percentages, dates tied to measurable facts
- financial figures, market sizes, revenue, valuations
- rankings, user counts, headcount when stated as fact
- geographic or macroeconomic numbers when quantitative

Exclude:
- opinions, hype, vague marketing, rhetorical questions
- definitions without numbers
- quoted opinions without factual assertions

Return STRICT JSON only (no markdown), shape:
{
  "claims": [
    {
      "claim": "verbatim or tightly paraphrased claim from the doc",
      "type": "statistic|percentage|financial|date|ranking|metric|other",
      "keywords": ["3-8 search keywords for web verification"]
    }
  ]
}

Cap at 25 claims — prioritize the strongest verifiable ones. If the document has no such claims, return {"claims":[]}.`;

function getModel() {
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
      temperature: 0.2,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });
}

function parseJsonLoose(raw) {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model returned non-JSON output");
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

/**
 * @param {string} documentText
 * @returns {Promise<Array<{ claim: string; type: string; keywords: string[] }>>}
 */
export async function extractClaims(documentText) {
  const model = getModel();
  const capped =
    documentText.length > 48000
      ? `${documentText.slice(0, 48000)}\n\n[truncated]`
      : documentText;

  const result = await generateContentWithRetry(model, [
    { text: EXTRACTION_PROMPT },
    { text: `\n---DOCUMENT---\n${capped}\n---END---` },
  ]);

  const text = result.response.text();
  const parsed = parseJsonLoose(text);
  const claims = Array.isArray(parsed.claims) ? parsed.claims : [];

  return claims
    .filter((c) => c && typeof c.claim === "string" && c.claim.trim().length > 0)
    .map((c) => ({
      claim: c.claim.trim(),
      type: typeof c.type === "string" ? c.type : "other",
      keywords: Array.isArray(c.keywords)
        ? c.keywords.map((k) => String(k).trim()).filter(Boolean)
        : [],
    }));
}
