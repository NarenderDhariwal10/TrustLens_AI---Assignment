import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { verifyPdf } from "../services/api";
import type { VerifyResponse } from "../types";
import { VerificationSteps } from "./VerificationSteps";
import { TruthMeter } from "./TruthMeter";
import { ClaimCard } from "./ClaimCard";
import { ExportReportPdf } from "./ExportReportPdf";

export function VerifyWorkspace() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VerifyResponse | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await verifyPdf(file);
      setData(res);
    } catch (e: unknown) {
      let msg = "Verification failed";
      if (axios.isAxiosError(e)) {
        const body = e.response?.data as { error?: string } | undefined;
        if (body?.error) {
          msg = body.error;
        } else if (
          e.code === "ERR_NETWORK" ||
          e.message === "Network Error" ||
          !e.response
        ) {
          msg =
            "Cannot reach the API. Start the backend (cd server → npm run dev). If the API is not on port 5000, set client/.env.development to VITE_DEV_API_TARGET=http://localhost:YOUR_PORT. For production builds, set VITE_API_URL to your deployed API URL.";
        } else {
          msg = e.message || msg;
        }
      } else if (e instanceof Error) {
        msg = e.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: loading,
  });

  const sortedResults = useMemo(() => {
    if (!data?.results) return [];
    const order: Record<string, number> = {
      FALSE: 0,
      INACCURATE: 1,
      INSUFFICIENT_DATA: 2,
      VERIFIED: 3,
    };
    return [...data.results].sort(
      (a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9)
    );
  }, [data]);

  return (
    <section
      id="verify"
      className="scroll-mt-24 border-b border-zinc-200/80 bg-zinc-50 dark:border-zinc-800 dark:bg-black"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-5">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                  Verification workspace
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Drag in an earnings deck, policy PDF, or research brief. We parse text,
                  isolate verifiable claims, then hit the live web for corroboration.
                </p>
              </div>

              <div
                {...getRootProps()}
                className={`relative cursor-pointer rounded-3xl border border-dashed border-zinc-300 bg-white/70 p-10 text-center shadow-sm backdrop-blur-md transition hover:border-emerald-500/40 hover:bg-white dark:border-zinc-700 dark:bg-zinc-950/40 dark:hover:border-emerald-500/35 ${
                  isDragActive ? "border-emerald-500/60 bg-emerald-500/5" : ""
                } ${loading ? "pointer-events-none opacity-60" : ""}`}
              >
                <input {...getInputProps()} />
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M12 16V7m0 0l-3.5 3M12 7l3.5 3M6 20h12"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {isDragActive ? "Drop to analyze…" : "Drop PDF here, or click to browse"}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Max 12MB · Text-based PDFs work best
                </p>
              </div>

              <VerificationSteps active={loading} />

              <AnimatePresence>
                {error ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-900 dark:text-rose-100"
                  >
                    {error}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="lg:col-span-7">
            {!data && !loading ? (
              <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Results render here: truth score, executive summary, per-claim verdicts,
                  confidence, and outbound citations. This pipeline is designed to reduce
                  hallucinations by forcing grounded retrieval before judgment.
                </p>
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex animate-pulse flex-col gap-4">
                  <div className="h-10 w-40 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
                  <div className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
                  <div className="h-40 rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
                </div>
              </div>
            ) : null}

            {data ? (
              <div className="space-y-8">
                <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Executive report
                      </p>
                      <h3 className="text-xl font-semibold text-zinc-950 dark:text-white">
                        {data.filename}
                      </h3>
                      <p className="max-w-xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {data.summary}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <StatPill
                          label="Claims extracted"
                          value={String(data.claimsExtracted)}
                        />
                        <StatPill
                          label="Claims verified"
                          value={String(data.claimsVerified)}
                        />
                        {typeof data.pages === "number" ? (
                          <StatPill label="Pages" value={String(data.pages)} />
                        ) : null}
                      </div>
                    </div>

                    <TruthMeter score={data.truthScore} />
                  </div>

                  <div className="mt-8 grid gap-3 border-t border-zinc-200 pt-8 dark:border-zinc-800 sm:grid-cols-4">
                    <MiniStat k="Verified" v={data.stats.verified} tone="emerald" />
                    <MiniStat k="Inaccurate" v={data.stats.inaccurate} tone="amber" />
                    <MiniStat k="False" v={data.stats.false} tone="rose" />
                    <MiniStat
                      k="Insufficient"
                      v={data.stats.insufficient}
                      tone="zinc"
                    />
                  </div>

                  {data.majorIssues?.length ? (
                    <div className="mt-8 rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-900/40">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Major issues
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-zinc-800 dark:text-zinc-200">
                        {data.majorIssues.map((m) => (
                          <li key={m} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-900 dark:bg-white" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="mt-8 flex flex-wrap gap-3">
                    <ExportReportPdf data={data} />
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Claim ledger
                      </p>
                      <h4 className="text-lg font-semibold text-zinc-950 dark:text-white">
                        Grounded verdicts
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Sorted by severity · citations open in a new tab
                    </p>
                  </div>

                  <div className="space-y-4">
                    {sortedResults.map((r, idx) => (
                      <ClaimCard key={`${r.claim}-${idx}`} item={r} index={idx} />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
      <span className="text-zinc-500">{label}</span>
      <span>{value}</span>
    </span>
  );
}

function MiniStat({
  k,
  v,
  tone,
}: {
  k: string;
  v: number;
  tone: "emerald" | "amber" | "rose" | "zinc";
}) {
  const toneCls =
    tone === "emerald"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "amber"
        ? "text-amber-800 dark:text-amber-200"
        : tone === "rose"
          ? "text-rose-800 dark:text-rose-200"
          : "text-zinc-800 dark:text-zinc-200";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{k}</div>
      <div className={`mt-2 text-3xl font-semibold tracking-tight ${toneCls}`}>{v}</div>
    </div>
  );
}
