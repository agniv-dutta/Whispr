/**
 * Whispr Design System – Warm Energy Color Tokens
 * These are the single source of truth for all brand colors.
 */
export const colors = {
  // ─── Brand ───
  primary: '#FF6B35',    // Coral-Orange – buttons, active states, sent bubbles
  secondary: '#004E89',  // Deep Navy – secondary CTA, ghost button borders
  tertiary: '#F7B801',   // Golden – highlights, badges, warnings

  // ─── Backgrounds ───
  bgLight: '#FAFBFC',
  bgDark: '#0F1419',
  surfaceLight: '#FFFFFF',
  surfaceDark: '#1F2937',

  // ─── Text ───
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textInvert: '#E5E7EB',

  // ─── Semantic ───
  success: '#10B981',  // Online indicators, read receipts
  error: '#EF4444',
  warning: '#FBBF24',

  // ─── Neutral Scale ───
  neutral50: '#FAFBFC',
  neutral100: '#F3F4F6',
  neutral200: '#E5E7EB',
  neutral400: '#9CA3AF',
  neutral600: '#6B7280',
  neutral800: '#1F2937',
  neutral900: '#111827',
} as const;

export type ColorKey = keyof typeof colors;
