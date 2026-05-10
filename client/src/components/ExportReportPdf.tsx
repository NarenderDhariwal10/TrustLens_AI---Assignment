import { jsPDF } from "jspdf";
import type { VerifyResponse } from "../types";

export function ExportReportPdf({ data }: { data: VerifyResponse }) {
  function download() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("TruthLens AI — Verification Report", margin, y);
    y += 28;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(`File: ${data.filename}`, margin, y);
    y += 14;
    doc.text(`Generated: ${new Date(data.uploadedAt).toLocaleString()}`, margin, y);
    y += 22;

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Executive summary", margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    const summaryLines = doc.splitTextToSize(data.summary, 515);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 14 + 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Outcome metrics", margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.text(`Truth score: ${data.truthScore}%`, margin, y);
    y += 14;
    doc.text(`Claims checked: ${data.stats.total}`, margin, y);
    y += 14;
    doc.text(
      `Verified ${data.stats.verified} · Inaccurate ${data.stats.inaccurate} · False ${data.stats.false} · Insufficient ${data.stats.insufficient}`,
      margin,
      y
    );
    y += 22;

    if (data.majorIssues?.length) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Major issues", margin, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      for (const line of data.majorIssues) {
        const wrapped = doc.splitTextToSize(`• ${line}`, 515);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 14 + 6;
        if (y > 720) {
          doc.addPage();
          y = margin;
        }
      }
      y += 12;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Claim-level results", margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    for (const r of data.results) {
      if (y > 740) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${r.status}`, margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      const claimLines = doc.splitTextToSize(r.claim, 515);
      doc.text(claimLines, margin, y);
      y += claimLines.length * 13 + 6;

      const actualLines = doc.splitTextToSize(`Evidence: ${r.actualData}`, 515);
      doc.text(actualLines, margin, y);
      y += actualLines.length * 13 + 10;

      if (r.sources?.[0]?.url) {
        const primary = `${r.sources[0].title || "Source"} — ${r.sources[0].url}`;
        const srcLines = doc.splitTextToSize(primary, 515);
        doc.text(srcLines, margin, y);
        y += srcLines.length * 13 + 6;
      }
      y += 8;
    }

    doc.save(`truthlens-report-${Date.now()}.pdf`);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
    >
      Download PDF report
    </button>
  );
}
