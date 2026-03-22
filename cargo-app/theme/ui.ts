import { Platform } from 'react-native';

// Apple-like dark UI tokens (clean, soft depth, consistent radii)
export const ui = {
  color: {
    bg0: '#05070D',
    bg1: '#070B14',
    surface: 'rgba(255,255,255,0.06)',
    surfaceStrong: 'rgba(255,255,255,0.10)',
    border: 'rgba(255,255,255,0.12)',
    borderStrong: 'rgba(255,255,255,0.18)',
    text: 'rgba(255,255,255,0.92)',
    textSecondary: 'rgba(255,255,255,0.64)',
    textTertiary: 'rgba(255,255,255,0.46)',
    accent: '#FF7A1A',
    accentSoft: 'rgba(255,122,26,0.18)',
    danger: '#FF453A',
    success: '#32D74B',
    warning: '#FFD60A',
  },
  radius: {
    s: 12,
    m: 16,
    l: 20,
    xl: 28,
    pill: 999,
  },
  space: {
    xs: 8,
    s: 12,
    m: 16,
    l: 20,
    xl: 28,
    xxl: 36,
  },
  type: {
    // Uses platform fonts; iOS will be SF Pro by default.
    title: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.3 },
    headline: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.2 },
    subhead: { fontSize: 14, fontWeight: '600' as const, letterSpacing: 0.2 },
    body: { fontSize: 14, fontWeight: '500' as const, letterSpacing: 0.1 },
    caption: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.2 },
    mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) as string },
  },
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
    },
    android: {
      elevation: 10,
    },
    default: {},
  }) as Record<string, any>,
} as const;

