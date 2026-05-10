import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const STEPS = [
  "Extracting high-signal claims from the document…",
  "Querying the live web for independent evidence…",
  "Cross-checking numbers, dates, and named metrics…",
  "Synthesizing a defensible verdict per claim…",
  "Building your executive report…",
];

export function VerificationSteps({ active }: { active: boolean }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!active) {
      setI(0);
      return;
    }
    const t = setInterval(() => {
      setI((n) => (n + 1) % STEPS.length);
    }, 2800);
    return () => clearInterval(t);
  }, [active]);

  return (
    <div className="min-h-[4.5rem]">
      <AnimatePresence mode="wait">
        {active ? (
          <motion.div
            key={STEPS[i]}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 dark:border-emerald-500/25 dark:bg-emerald-500/10"
          >
            <span className="mt-1 inline-flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
              {STEPS[i]}
            </p>
          </motion.div>
        ) : (
          <motion.p
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-zinc-500"
          >
            Drop a PDF to run the verification pipeline. We prioritize measurable
            claims—not opinions.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
