import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = (mounted ? resolvedTheme : theme) === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={handleToggle}
      className="
        h-10 w-10 rounded-full
        text-foreground hover:bg-accent hover:text-accent-foreground
        transition-all duration-300
        group
      "
    
    >
      {/* Sun / Moon with smooth animation and crossfade */}
      <Sun
        className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 group-hover:scale-110 dark:-rotate-90 dark:scale-0"
      />
      <Moon
        className="h-5 w-5 absolute rotate-90 scale-0 transition-all duration-300 group-hover:scale-110 dark:rotate-0 dark:scale-100"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default ThemeToggle;
