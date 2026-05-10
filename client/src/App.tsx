import { Hero } from "./components/Hero";
import { VerifyWorkspace } from "./components/VerifyWorkspace";
import { ThemeToggle } from "./components/ThemeToggle";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  const { dark, setDark } = useTheme();
  function scrollToVerify() {
    const el = document.getElementById("verify");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-white text-zinc-950 dark:bg-black dark:text-zinc-50">
      <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/70 backdrop-blur-xl dark:border-zinc-800 dark:bg-black/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-xs font-bold text-white dark:bg-white dark:text-zinc-950">
              TL
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">TruthLens AI</div>
              <div className="text-xs text-zinc-500">Grounded PDF verification</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={scrollToVerify}
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 sm:inline dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Workspace
            </button>
            <ThemeToggle dark={dark} setDark={setDark} />
          </div>
        </div>
      </header>

      <main>
        <Hero onTry={scrollToVerify} />
        <VerifyWorkspace />
      </main>

      <footer className="border-t border-zinc-200 bg-white py-10 dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-6 md:flex-row md:items-center">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            TruthLens AI — verification aids decision-making; always review primary sources
            for regulated decisions.
          </div>
          <div className="text-xs text-zinc-500">
            Stack: React · Vite · Tailwind · Express · Gemini · Tavily
          </div>
        </div>
      </footer>
    </div>
  );
}
