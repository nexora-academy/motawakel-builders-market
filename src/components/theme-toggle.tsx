import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "mutawakkil-theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // The toggle still works when browser storage is unavailable.
    }
    const enabled = saved === "dark";
    document.documentElement.classList.toggle("dark", enabled);
    setDark(enabled);

    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const enabled = event.newValue === "dark";
      document.documentElement.classList.toggle("dark", enabled);
      setDark(enabled);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Keep the selected theme active for this visit.
    }
  }

  const label = dark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الغامق";
  return (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={toggle}
      aria-label={label}
      aria-pressed={dark}
      title={label}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}