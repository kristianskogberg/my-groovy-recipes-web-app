import { Contrast, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "retro" | "brownie" | "modern";

const themes = [
  { name: "retro", label: "Retro", Icon: Sun },
  { name: "brownie", label: "Brownie", Icon: Moon },
  { name: "modern", label: "Modern", Icon: Contrast },
] as const;

function getSavedTheme(): Theme {
  try {
    const saved = window.localStorage.getItem("theme");
    if (saved === "retro" || saved === "brownie" || saved === "modern") {
      return saved;
    }
  } catch {
    // The switcher still works if browser storage is unavailable.
  }
  return "retro";
}

/**
 * A component for changing the app's theme.
 * @returns A React component that renders the theme switcher.
 */
export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(getSavedTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        getComputedStyle(document.documentElement).backgroundColor,
      );
    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      // Keep the selected theme for this page.
    }
  }, [theme]);

  return (
    <div role="group" aria-label="Theme" className="flex items-center gap-1">
      {themes.map(({ name, label, Icon }) => (
        <button
          key={name}
          type="button"
          aria-label={`${label} theme`}
          aria-pressed={theme === name}
          title={`${label} theme`}
          onClick={() => setTheme(name)}
          className={`cursor-pointer rounded-md p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            theme === name
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-primary/20"
          }`}
        >
          <Icon size={18} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
