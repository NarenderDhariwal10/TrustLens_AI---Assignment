import { motion } from "framer-motion";

export function Hero({ onTry }: { onTry: () => void }) {
  return (
    <section className="relative overflow-hidden border-b border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-[length:24px_24px] dark:bg-grid-fade-dark" />
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl dark:bg-emerald-500/10" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-zinc-400/10 blur-3xl dark:bg-zinc-500/10" />

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 md:pb-28 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/60 px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live web verification · structured outputs · audit-friendly
          </div>

          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-zinc-950 md:text-6xl dark:text-white">
            Upload PDFs.
            <span className="block bg-gradient-to-r from-zinc-900 via-zinc-700 to-emerald-700 bg-clip-text text-transparent dark:from-white dark:via-zinc-200 dark:to-emerald-400">
              Catch misinformation early.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 md:text-lg dark:text-zinc-300">
            TruthLens extracts measurable claims—figures, dates, rankings—and checks them
            against fresh web evidence with explicit sources. Built like a real AI SaaS,
            not a toy summarizer.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onTry}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-zinc-950 px-8 text-sm font-semibold text-white shadow-lg shadow-zinc-900/15 transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Upload PDF
            </button>
            <button
              type="button"
              onClick={onTry}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white/70 px-8 text-sm font-semibold text-zinc-900 backdrop-blur-md transition hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              Open workspace
            </button>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-3">
            {[
              {
                title: "Claim targeting",
                body: "LLM extracts statistics, metrics, and dates—skips fluff.",
              },
              {
                title: "Live verification",
                body: "Tavily-powered retrieval + cross-model adjudication.",
              },
              {
                title: "Exports & audit trail",
                body: "PDF reports with citations you can actually click.",
              },
            ].map((x) => (
              <div
                key={x.title}
                className="rounded-3xl border border-zinc-200/70 bg-white/55 p-5 text-left shadow-glass backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/35"
              >
                <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {x.title}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {x.body}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
