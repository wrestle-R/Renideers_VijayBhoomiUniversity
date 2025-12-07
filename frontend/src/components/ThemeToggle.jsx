import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "../context/ThemeContext";
import { cn } from "@/lib/utils";

export function ThemeToggle({ showLabel = false, className }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      onClick={toggleTheme}
      className={cn(showLabel && "w-full justify-start gap-3 px-3", className)}
    >
      <div className="relative w-5 h-5 flex-shrink-0">
        <Sun className="absolute h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </div>
      {showLabel && (
        <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
