import { ThemeProvider as NextThemeProvider } from "next-themes";
import { PropsWithChildren } from "react";

// Global theme provider using next-themes
// - attribute="class" applies `dark` class to html for Tailwind
// - defaultTheme="dark" keeps current dark-first design
// - enableSystem supports optional system auto mode
// - storage via localStorage is handled internally by next-themes
export function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <NextThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </NextThemeProvider>
  );
}

export default ThemeProvider;
