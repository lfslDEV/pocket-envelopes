export const colors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2F5',

  textPrimary: '#1A1D23',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnDark: '#FFFFFF',

  brand: '#22C55E',      
  brandDark: '#16A34A',
  brandLight: '#DCFCE7',

  accent: '#3B82F6',       
  accentLight: '#EFF6FF',

  healthGood: '#22C55E',
  healthGoodBg: '#DCFCE7',
  healthWarn: '#F59E0B',
  healthWarnBg: '#FEF3C7',
  healthBad: '#EF4444',
  healthBadBg: '#FEE2E2',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray600: '#4B5563',
  gray800: '#1F2937',

  overlay: 'rgba(0, 0, 0, 0.45)',
};

export const typography = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 28,

  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 999,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
};

/**
 * Retorna as cores de saúde baseadas na relação saldo/orcamento.
 * @param {number} saldo
 * @param {number} orcamento
 * @returns {{ border: string, bg: string, text: string }}
 */
export function healthColor(saldo, orcamento) {
  if (orcamento == null || orcamento <= 0) {
    return { border: colors.gray200, bg: colors.surface, text: colors.textSecondary };
  }
  if (saldo <= 0) {
    return { border: colors.healthBad, bg: colors.healthBadBg, text: colors.healthBad };
  }
  if (saldo < orcamento * 0.2) {
    return { border: colors.healthWarn, bg: colors.healthWarnBg, text: colors.healthWarn };
  }
  return { border: colors.healthGood, bg: colors.healthGoodBg, text: colors.healthGood };
}
