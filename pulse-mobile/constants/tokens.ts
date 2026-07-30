/**
 * Design tokens codifying the palette that was already de facto consistent
 * across every hand-rolled screen StyleSheet in this app. New screens should
 * import from here instead of hardcoding hex values; existing screens are
 * migrated over time as they're touched.
 */

export const colors = {
  ink: '#0f172a',
  plum: '#5b21b6',
  lime: '#84cc16',
  sun: '#facc15',
  coral: '#fb7185',
  aqua: '#22d3ee',
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
  },
  primary: {
    text: '#16a34a',
    light: '#86efac',
    lighter: '#dcfce7',
    tint: '#f0fdf4',
    dark: '#15803d',
    darker: '#166534',
  },
  secondary: {
    text: '#7c3aed',
    light: '#c4b5fd',
    lighter: '#ede9fe',
    tint: '#f5f3ff',
    dark: '#6d28d9',
    darker: '#5b21b6',
  },
  status: {
    done: { fg: '#166534', bg: '#dcfce7', dot: '#22c55e', solid: '#15803d' },
    pending: { fg: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
    missed: { fg: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
  },
  background: '#f7fee7',
  backgroundAlt: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  danger: {
    text: '#dc2626',
    bg: '#fee2e2',
  },
} as const;

export const gradients = {
  brand: ['#16a34a', '#84cc16', '#facc15'],
  night: ['#111827', '#312e81', '#166534'],
} as const;

export const radii = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 24,
  huge: 28,
  pill: 999,
} as const;

export const typography = {
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/**
 * Shared "pillowy" shadow presets: low opacity + wide radius reads as a soft
 * ambient glow instead of a hard drop shadow. `card` is the default for list
 * rows/panels, `hero` for the one primary card per screen that should feel
 * slightly more raised, `floating` for elements detached from the layout
 * (e.g. the tab-bar center button) where a more visible glow is intentional.
 */
export const shadows = {
  card: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
  hero: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 3,
  },
  playful: {
    shadowColor: colors.primary.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 4,
  },
  floating: (tint: string) => ({
    shadowColor: tint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 6,
  }),
} as const;
