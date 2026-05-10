import { motion } from "framer-motion";

export function TruthMeter({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-36 w-36">
        <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 128 128">
          <circle
            cx="64"
            cy="64"
            r={radius}
            strokeWidth="10"
            className="fill-none stroke-zinc-200 dark:stroke-zinc-800"
          />
          <motion.circle
            cx="64"
            cy="64"
            r={radius}
            strokeWidth="10"
            strokeLinecap="round"
            className="fill-none stroke-emerald-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            strokeDasharray={`${circumference} ${circumference}`}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {clamped}
              <span className="text-lg text-zinc-500">%</span>
            </div>
            <div className="text-xs font-medium text-zinc-500">Truth score</div>
          </div>
        </div>
      </div>
    </div>
  );
}
