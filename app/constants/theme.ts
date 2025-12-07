/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// --- OKLCH to hex converter (small implementation)
function parseOklch(value: string) {
  const m = /oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\)/i.exec(value);
  if (!m) return null;
  const L = parseFloat(m[1]);
  const C = parseFloat(m[2]);
  const h = parseFloat(m[3]);
  return { L, C, h };
}

function oklchToHex(value: string) {
  try {
    const parsed = parseOklch(value);
    if (!parsed) return value;
    const { L, C, h } = parsed;
    const hr = (h * Math.PI) / 180;
    const a = C * Math.cos(hr);
    const b = C * Math.sin(hr);

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    let R = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let B = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

    const linToSrgb = (v: number) => {
      v = Math.max(0, v);
      if (v <= 0.0031308) return 12.92 * v;
      return 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    };

    R = linToSrgb(R);
    G = linToSrgb(G);
    B = linToSrgb(B);

    const toHex = (v: number) => {
      const n = Math.round(Math.max(0, Math.min(1, v)) * 255);
      return n.toString(16).padStart(2, '0');
    };

    return `#${toHex(R)}${toHex(G)}${toHex(B)}`;
  } catch (e) {
    return value;
  }
}

const tintColorLight = 'oklch(0.4254 0.1159 144.3078)';
const tintColorDark = 'oklch(0.5234 0.1347 144.1672)';

/**
 * The Colors object now mirrors the provided shadcn CSS variables but
 * adapted to this app's theme shape. Values are kept as the exact strings
 * (including `oklch(...)`) so they can be used downstream (web or CSS-in-JS).
 */
export const Colors = {
  light: {
    background: 'oklch(0.9970 0 0)',
    foreground: 'oklch(0.2178 0 0)',
    card: 'oklch(1.0000 0 0)',
    cardForeground: 'oklch(0.2178 0 0)',
    popover: 'oklch(1.0000 0 0)',
    popoverForeground: 'oklch(0.2178 0 0)',
    primary: 'oklch(0.4254 0.1159 144.3078)',
    primaryForeground: 'oklch(1.0000 0 0)',
    secondary: 'oklch(0.9067 0 0)',
    secondaryForeground: 'oklch(0.2178 0 0)',
    muted: 'oklch(0.9571 0.0210 147.6360)',
    mutedForeground: 'oklch(0.4254 0.1159 144.3078)',
    accent: 'oklch(0.9761 0 0)',
    accentForeground: 'oklch(0.2178 0 0)',
    destructive: 'oklch(0.6368 0.2078 25.3313)',
    destructiveForeground: 'oklch(1.0000 0 0)',
    border: 'oklch(0.9067 0 0)',
    input: 'oklch(1.0000 0 0)',
    ring: 'oklch(0.4254 0.1159 144.3078)',
    chart1: 'oklch(0.4254 0.1159 144.3078)',
    chart2: 'oklch(0.5234 0.1347 144.1672)',
    chart3: 'oklch(0.5752 0.1446 144.1813)',
    chart4: 'oklch(0.6731 0.1624 144.2083)',
    chart5: 'oklch(0.7185 0.1417 144.8887)',
    sidebar: 'oklch(0.9571 0.0210 147.6360)',
    sidebarForeground: 'oklch(0.4254 0.1159 144.3078)',
    sidebarPrimary: 'oklch(0.4254 0.1159 144.3078)',
    sidebarPrimaryForeground: 'oklch(1.0000 0 0)',
    sidebarAccent: 'oklch(0.8952 0.0504 146.0366)',
    sidebarAccentForeground: 'oklch(0.4254 0.1159 144.3078)',
    sidebarBorder: 'oklch(0.8292 0.0827 145.8169)',
    sidebarRing: 'oklch(0.4254 0.1159 144.3078)',
    // legacy keys used in the app (kept for compatibility)
    text: 'oklch(0.2178 0 0)',
    tint: tintColorLight,
    icon: 'oklch(0.687076 0 0)',
    tabIconDefault: 'oklch(0.687076 0 0)',
    tabIconSelected: tintColorLight,
  },
  dark: {
    background: 'oklch(0 0 0)',
    foreground: 'oklch(0.9067 0 0)',
    card: 'oklch(0.2178 0 0)',
    cardForeground: 'oklch(0.9067 0 0)',
    popover: 'oklch(0.2178 0 0)',
    popoverForeground: 'oklch(0.9067 0 0)',
    primary: 'oklch(0.5234 0.1347 144.1672)',
    primaryForeground: 'oklch(1.0000 0 0)',
    secondary: 'oklch(0.2931 0 0)',
    secondaryForeground: 'oklch(0.9067 0 0)',
    muted: 'oklch(0.2815 0.0231 168.0128)',
    mutedForeground: 'oklch(0.7660 0.1179 145.2950)',
    accent: 'oklch(0.2931 0 0)',
    accentForeground: 'oklch(0.9067 0 0)',
    destructive: 'oklch(0.6368 0.2078 25.3313)',
    destructiveForeground: 'oklch(1.0000 0 0)',
    border: 'oklch(0.3600 0 0)',
    input: 'oklch(0.2178 0 0)',
    ring: 'oklch(0.5234 0.1347 144.1672)',
    chart1: 'oklch(0.5234 0.1347 144.1672)',
    chart2: 'oklch(0.5752 0.1446 144.1813)',
    chart3: 'oklch(0.6731 0.1624 144.2083)',
    chart4: 'oklch(0.7185 0.1417 144.8887)',
    chart5: 'oklch(0.7660 0.1179 145.2950)',
    sidebar: 'oklch(0.2815 0.0231 168.0128)',
    sidebarForeground: 'oklch(0.7660 0.1179 145.2950)',
    sidebarPrimary: 'oklch(0.5234 0.1347 144.1672)',
    sidebarPrimaryForeground: 'oklch(1.0000 0 0)',
    sidebarAccent: 'oklch(0.3731 0.0382 161.1302)',
    sidebarAccentForeground: 'oklch(0.7660 0.1179 145.2950)',
    sidebarBorder: 'oklch(0.4145 0.0309 160.6235)',
    sidebarRing: 'oklch(0.5234 0.1347 144.1672)',
    // legacy keys
    text: 'oklch(0.9067 0 0)',
    tint: tintColorDark,
    icon: 'oklch(0.9 0 0)',
    tabIconDefault: 'oklch(0.9 0 0)',
    tabIconSelected: tintColorDark,
  },
};

// Attach hex fallbacks for native platforms (only when the value is an oklch color)
for (const scheme of Object.keys(Colors) as Array<'light' | 'dark'>) {
  const entries = Colors[scheme] as Record<string, string>;
  for (const key of Object.keys(entries)) {
    const val = entries[key];
    if (typeof val === 'string' && /oklch\(/i.test(val)) {
      try {
        entries[`${key}Hex`] = oklchToHex(val);
      } catch (e) {
        // ignore conversion errors and leave original value
      }
    }
  }
}

export const Fonts = Platform.select({
  ios: {
    sans: 'Outfit',
    serif: 'Lora',
    rounded: 'SF Pro Rounded',
    mono: 'Fira Code',
  },
  default: {
    sans: 'Outfit',
    serif: 'Lora',
    rounded: 'normal',
    mono: 'Fira Code',
  },
  web: {
    sans: "'Outfit', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    serif: "'Lora', Georgia, 'Times New Roman', serif",
    rounded: "'Outfit', 'SF Pro Rounded', sans-serif",
    mono: "'Fira Code', SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
});

export const Radii = {
  base: '0.25rem',
  sm: 'calc(0.25rem - 4px)',
  md: 'calc(0.25rem - 2px)',
  lg: '0.25rem',
  xl: 'calc(0.25rem + 4px)',
};

export const Shadows = {
  x: '0px',
  y: '2px',
  blur: '8px',
  spread: '0px',
  opacityLight: 0.05,
  opacityDark: 0.3,
  shadow2xs: '0px 2px 8px 0px hsl(0 0% 0% / 0.03)',
  shadowXs: '0px 2px 8px 0px hsl(0 0% 0% / 0.03)',
  shadowSm: '0px 2px 8px 0px hsl(0 0% 0% / 0.05), 0px 1px 2px -1px hsl(0 0% 0% / 0.05)',
  shadow: '0px 2px 8px 0px hsl(0 0% 0% / 0.05), 0px 1px 2px -1px hsl(0 0% 0% / 0.05)',
  shadowMd: '0px 2px 8px 0px hsl(0 0% 0% / 0.05), 0px 2px 4px -1px hsl(0 0% 0% / 0.05)',
  shadowLg: '0px 2px 8px 0px hsl(0 0% 0% / 0.05), 0px 4px 6px -1px hsl(0 0% 0% / 0.05)',
  shadowXl: '0px 2px 8px 0px hsl(0 0% 0% / 0.05), 0px 8px 10px -1px hsl(0 0% 0% / 0.05)',
  shadow2xl: '0px 2px 8px 0px hsl(0 0% 0% / 0.13)',
};

export const Spacing = '0.25rem';

export default {
  colors: Colors,
  fonts: Fonts,
  radii: Radii,
  shadows: Shadows,
  spacing: Spacing,
};
