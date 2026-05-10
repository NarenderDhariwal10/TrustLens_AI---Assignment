import { useEffect, useState } from "react";

const KEY = "truthlens-theme";

export function useTheme() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(KEY);
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem(KEY, "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem(KEY, "light");
    }
  }, [dark]);

  return { dark, setDark };
}
