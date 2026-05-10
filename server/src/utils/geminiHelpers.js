/**
 * Shared Gemini helpers: rate-limit retries + stable HTTP errors for Express.
 */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Parse retry delay from Google AI SDK error (RetryInfo or Retry-After style text).
 * @param {unknown} err
 * @returns {number} milliseconds, capped
 */
export function getGeminiRetryDelayMs(err) {
  const e = /** @type {any} */ (err);
  const details = Array.isArray(e?.errorDetails) ? e.errorDetails : [];
  for (const d of details) {
    if (d?.["@type"]?.includes("RetryInfo") && d.retryDelay) {
      const rd = String(d.retryDelay);
      const m = rd.match(/^(\d+(?:\.\d+)?)s$/);
      if (m) return Math.min(120_000, Math.max(500, Math.ceil(Number(m[1]) * 1000)));
    }
  }
  const msg = String(e?.message || "");
  const alt = msg.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (alt) {
    return Math.min(120_000, Math.max(500, Math.ceil(Number(alt[1]) * 1000)));
  }
  return null;
}

/**
 * @param {unknown} err
 */
export function normalizeGeminiError(err) {
  const e = /** @type {any} */ (err);
  const status = Number(e?.status ?? e?.statusCode ?? 0) || 0;
  const msg = String(e?.message || "Gemini request failed");

  if (status === 429) {
    return Object.assign(
      new Error(
        "Gemini API rate limit or daily quota reached. Wait 1–2 minutes and retry, " +
          "or set GEMINI_MODEL to another model (e.g. gemini-2.5-flash, gemini-1.5-flash). " +
          "See https://ai.google.dev/gemini-api/docs/rate-limits"
      ),
      { status: 429, code: "GEMINI_RATE_LIMIT", cause: err }
    );
  }

  if (status === 400 || status === 404) {
    return Object.assign(
      new Error(
        `Gemini model error (${status}). Check GEMINI_MODEL matches a model your API key can use.`
      ),
      { status: 502, code: "GEMINI_MODEL_ERROR", cause: err }
    );
  }

  if (status === 401 || status === 403) {
    return Object.assign(
      new Error("Gemini API rejected the key (check GEMINI_API_KEY)."),
      { status: 503, code: "GEMINI_AUTH", cause: err }
    );
  }

  return Object.assign(new Error(msg.slice(0, 400)), {
    status: status >= 400 && status < 600 ? status : 502,
    code: "GEMINI_ERROR",
    cause: err,
  });
}

/**
 * generateContent with exponential backoff on HTTP 429.
 * @param {import('@google/generative-ai').GenerativeModel} model
 * @param {string | import('@google/generative-ai').Part[] | import('@google/generative-ai').Content[]} content
 * @param {{ maxAttempts?: number }} [options]
 */
export async function generateContentWithRetry(model, content, options = {}) {
  const envMax = Number(process.env.GEMINI_MAX_RETRIES);
  const maxAttempts =
    options.maxAttempts ??
    (Number.isFinite(envMax) && envMax > 0 ? envMax : 5);
  let lastErr = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await model.generateContent(content);
    } catch (err) {
      lastErr = err;
      const st = /** @type {any} */ (err)?.status ?? /** @type {any} */ (err)?.statusCode;
      if (st === 429 && attempt < maxAttempts - 1) {
        const fromApi = getGeminiRetryDelayMs(err);
        const backoff = fromApi ?? Math.min(90_000, 2000 * 2 ** attempt);
        console.warn(
          `[Gemini] 429 Too Many Requests — retry ${attempt + 2}/${maxAttempts} in ${Math.round(backoff / 1000)}s`
        );
        await sleep(backoff);
        continue;
      }
      throw normalizeGeminiError(err);
    }
  }

  throw normalizeGeminiError(lastErr);
}
