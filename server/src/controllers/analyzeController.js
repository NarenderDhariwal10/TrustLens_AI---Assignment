import { extractTextFromPdf } from "../services/pdfService.js";
import { extractClaims } from "../services/claimExtractionService.js";
import { verifyClaimsSequential } from "../services/verificationService.js";
import { buildReport } from "../services/reportService.js";
import { VerificationJob } from "../models/VerificationJob.js";

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

export async function verifyPdf(req, res, next) {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "PDF file is required (field: file)" });
    }

    const filename = req.file.originalname || "document.pdf";

    const { text, pages } = await extractTextFromPdf(req.file.buffer);
    if (!text || text.length < 80) {
      return res.status(400).json({
        error:
          "Could not extract enough text from this PDF. Try a text-based PDF or OCR.",
        pages,
      });
    }

    const claims = await extractClaims(text);
    const max = Number(process.env.MAX_CLAIMS_TO_VERIFY) || 18;
    const limitedClaims = claims.slice(0, max);

    const verificationResults = await verifyClaimsSequential(limitedClaims);
    const report = await buildReport(verificationResults);

    const payload = {
      filename,
      uploadedAt: new Date().toISOString(),
      pages,
      textPreview: `${text.slice(0, 600)}${text.length > 600 ? "…" : ""}`,
      claimsExtracted: claims.length,
      claimsVerified: verificationResults.length,
      truthScore: report.truthScore,
      summary: report.summary,
      stats: report.stats,
      majorIssues: report.majorIssues,
      results: verificationResults,
    };

    if (process.env.MONGODB_URI) {
      try {
        await VerificationJob.create({
          filename,
          textLength: text.length,
          claims: verificationResults,
          truthScore: report.truthScore,
          summary: report.summary,
          stats: report.stats,
          majorIssues: report.majorIssues,
        });
      } catch (e) {
        console.warn("Mongo save skipped:", e.message);
      }
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
}

export async function listRecentJobs(_req, res, next) {
  try {
    if (!process.env.MONGODB_URI) {
      return res.json({ items: [], note: "Enable MONGODB_URI for history." });
    }
    const items = await VerificationJob.find()
      .sort({ uploadedAt: -1 })
      .limit(12)
      .select("filename uploadedAt truthScore stats")
      .lean();

    res.json({
      items: items.map((x) => ({
        id: x._id,
        filename: x.filename,
        uploadedAt: x.uploadedAt,
        truthScore: x.truthScore,
      })),
    });
  } catch (err) {
    next(err);
  }
}
