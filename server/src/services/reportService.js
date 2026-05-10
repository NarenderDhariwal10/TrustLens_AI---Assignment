import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateContentWithRetry } from "../utils/geminiHelpers.js";

function scoreFromResults(results) {
  const total = results.length;
  if (!total) return { truthScore: 0, stats: emptyStats() };

  let points = 0;
  const stats = {
    total,
    verified: 0,
    inaccurate: 0,
    false: 0,
    insufficient: 0,
  };

  for (const r of results) {
    switch (r.status) {
      case "VERIFIED":
        stats.verified += 1;
        points += 100;
        break;
      case "INACCURATE":
        stats.inaccurate += 1;
        points += 60;
        break;
      case "FALSE":
        stats.false += 1;
        points += 0;
        break;
      default:
        stats.insufficient += 1;
        points += 45;
        break;
    }
  }

  const truthScore = Math.round(points / total);
  return { truthScore, stats };
}

function emptyStats() {
  return {
    total: 0,
    verified: 0,
    inaccurate: 0,
    false: 0,
    insufficient: 0,
  };
}

function getModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const genAI = new GoogleGenerativeAI(key);
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  });
}

/**
 * @param {Array<object>} verificationResults
 * @returns {Promise<{ truthScore: number; stats: object; summary: string; majorIssues: string[] }>}
 */
export async function buildReport(verificationResults) {
  const { truthScore, stats } = scoreFromResults(verificationResults);

  const model = getModel();
  if (!model) {
    return {
      truthScore,
      stats,
      summary: "Configure GEMINI_API_KEY for AI-generated narrative summaries.",
      majorIssues: deriveMajorIssuesHeuristic(verificationResults),
    };
  }

  const compact = verificationResults.map((r) => ({
    claim: r.claim,
    status: r.status,
    confidence: r.confidence,
    actualData: r.actualData,
  }));

  const prompt = `You are producing an executive brief for a PDF fact-check run.

Given verification results (JSON), write:
1) A 3-4 sentence neutral summary.
2) 3-6 bullet "major issues" strings (short headlines). Empty array if none.

Return STRICT JSON:
{"summary":"...", "majorIssues":["..."]}

DATA:\n${JSON.stringify(compact).slice(0, 12000)}`;

  try {
    const out = await generateContentWithRetry(model, prompt, {
      maxAttempts: 3,
    });
    const text = out.response.text();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const parsed = JSON.parse(text.slice(start, end + 1));
    return {
      truthScore,
      stats,
      summary:
        typeof parsed.summary === "string"
          ? parsed.summary
          : `Truth score ${truthScore}% across ${stats.total} checked claims.`,
      majorIssues: Array.isArray(parsed.majorIssues)
        ? parsed.majorIssues.map(String).slice(0, 8)
        : deriveMajorIssuesHeuristic(verificationResults),
    };
  } catch {
    return {
      truthScore,
      stats,
      summary: `Truth score ${truthScore}% across ${stats.total} checked claims.`,
      majorIssues: deriveMajorIssuesHeuristic(verificationResults),
    };
  }
}

function deriveMajorIssuesHeuristic(results) {
  const issues = [];
  for (const r of results) {
    if (r.status === "FALSE") {
      issues.push(`False claim flagged: ${truncate(r.claim, 90)}`);
    } else if (r.status === "INACCURATE") {
      issues.push(`Inaccurate / drift: ${truncate(r.claim, 90)}`);
    }
    if (issues.length >= 6) break;
  }
  return issues;
}

function truncate(s, n) {
  const str = String(s || "");
  return str.length > n ? `${str.slice(0, n)}…` : str;
}
