import { motion } from "framer-motion";
import type { VerificationResultItem } from "../types";

function safeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}

function badge(status: VerificationResultItem["status"]) {
  switch (status) {
    case "VERIFIED":
      return {
        label: "Verified",
        emoji: "✓",
        ring: "ring-emerald-500/25",
        bg: "bg-emerald-500/10",
        text: "text-emerald-700 dark:text-emerald-300",
      };
    case "INACCURATE":
      return {
        label: "Inaccurate",
        emoji: "⚠",
        ring: "ring-amber-500/25",
        bg: "bg-amber-500/10",
        text: "text-amber-800 dark:text-amber-200",
      };
    case "FALSE":
      return {
        label: "False",
        emoji: "✕",
        ring: "ring-rose-500/25",
        bg: "bg-rose-500/10",
        text: "text-rose-800 dark:text-rose-200",
      };
    default:
      return {
        label: "Insufficient data",
        emoji: "…",
        ring: "ring-zinc-400/25",
        bg: "bg-zinc-500/10",
        text: "text-zinc-700 dark:text-zinc-300",
      };
  }
}

export function ClaimCard({
  item,
  index,
}: {
  item: VerificationResultItem;
  index: number;
}) {
  const b = badge(item.status);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.45) }}
      className={`rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm ring-1 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/40 ${b.ring}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Claim
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-900 dark:text-zinc-50">
            {item.claim}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${b.bg} ${b.text}`}
        >
          <span aria-hidden>{b.emoji}</span>
          {b.label}
        </span>
      </div>

      <div className="mt-4 grid gap-4 border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Evidence summary
          </p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
            {item.actualData}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-600 dark:text-zinc-400">
          <span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Confidence:
            </span>{" "}
            {item.confidence}%
          </span>
          <span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Category:
            </span>{" "}
            {item.type}
          </span>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Sources
          </p>
          <ul className="mt-2 space-y-2">
            {item.sources?.length ? (
              item.sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex flex-col gap-0.5 text-sm"
                  >
                    <span className="font-medium text-emerald-700 underline-offset-4 group-hover:underline dark:text-emerald-400">
                      {s.title || safeHost(s.url)}
                    </span>
                    <span className="break-all text-xs text-zinc-500">{s.url}</span>
                  </a>
                </li>
              ))
            ) : (
              <li className="text-sm text-zinc-500">No external URLs returned.</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-300">
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">
            Analyst note:
          </span>{" "}
          {item.reasoning}
        </div>
      </div>
    </motion.article>
  );
}
