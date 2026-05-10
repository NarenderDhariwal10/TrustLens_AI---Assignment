/**
 * Tavily live web search — optimized for verification snippets + URLs.
 */

/**
 * @param {string} query
 * @returns {Promise<{ answer?: string; results: Array<{ title: string; url: string; content: string; score?: number }> }>}
 */
export async function searchWeb(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("TAVILY_API_KEY is not configured"), {
      status: 503,
      code: "MISSING_TAVILY",
    });
  }

  const body = {
    api_key: apiKey,
    query,
    search_depth: "advanced",
    include_answer: true,
    include_raw_content: false,
    max_results: 8,
  };

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw Object.assign(
      new Error(`Tavily error ${res.status}: ${errText.slice(0, 200)}`),
      { status: 502, code: "TAVILY_FAILED" }
    );
  }

  const data = await res.json();
  const results = (data.results || []).map((r) => ({
    title: r.title || "",
    url: r.url || "",
    content: (r.content || "").slice(0, 1200),
    score: typeof r.score === "number" ? r.score : undefined,
  }));

  return {
    answer: typeof data.answer === "string" ? data.answer : undefined,
    results,
  };
}
