export const Colors = {
  // Primary palette - warm pink/coral for baby app
  primary: '#FF85A1',
  primaryLight: '#FFB3C6',
  primaryDark: '#E8607A',

  // Secondary - soft lavender
  secondary: '#B5A4F5',
  secondaryLight: '#D4CCFF',

  // Accent - mint green
  accent: '#7DD8B8',
  accentLight: '#B5EDD6',

  // Warning - soft yellow
  warning: '#FFD166',
  warningLight: '#FFE9AA',

  // Neutrals
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8F4FF',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Record type colors
  feeding: '#FF85A1',
  sleep: '#B5A4F5',
  diaper: '#7DD8B8',
  bath: '#60C9F8',
  vaccine: '#FFD166',
  health: '#FF9A6C',

  // Status
  success: '#52D08A',
  error: '#FF6B6B',
  info: '#60C9F8',

  // Borders
  border: '#F0F0F0',
  borderMedium: '#E5E7EB',

  // Tab bar
  tabActive: '#FF85A1',
  tabInactive: '#C4C4C4',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#FF85A1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
};
