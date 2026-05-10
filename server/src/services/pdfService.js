import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

/**
 * @param {Buffer} buffer
 * @returns {Promise<{ text: string; pages: number }>}
 */
export async function extractTextFromPdf(buffer) {
  const data = await pdfParse(buffer);
  const text = (data.text || "").replace(/\s+/g, " ").trim();
  return { text, pages: data.numpages || 0 };
}
