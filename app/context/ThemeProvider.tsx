import React, { createContext, useMemo, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';

export type ColorSchemeName = 'light' | 'dark';

export type ThemeContextValue = {
  scheme: ColorSchemeName;
  setScheme?: (s: ColorSchemeName) => void;
  tokens: {
    colors: typeof Colors.light | typeof Colors.dark;
    fonts: typeof Fonts;
    radii: typeof Radii;
    shadows: typeof Shadows;
    spacing: string;
  };
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const system = (useColorScheme() ?? 'light') as ColorSchemeName;
  const [scheme, setScheme] = useState<ColorSchemeName>(system);

  const tokens = useMemo(() => ({
    colors: Colors[scheme],
    fonts: Fonts,
    radii: Radii,
    shadows: Shadows,
    spacing: Spacing,
  }), [scheme]);

  return (
    <ThemeContext.Provider value={{ scheme, setScheme, tokens }}>{children}</ThemeContext.Provider>
  );
};
