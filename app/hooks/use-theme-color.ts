/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Platform } from 'react-native';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    // Prefer hex fallbacks for native platforms if available
    if (Platform.OS !== 'web') {
      const hexKey = `${String(colorName)}Hex`;
      const maybeHex = (Colors as any)[theme]?.[hexKey];
      if (maybeHex) return maybeHex;
    }

    return Colors[theme][colorName];
  }
}
