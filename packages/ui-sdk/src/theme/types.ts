/**
 * Theme and styling types
 */

/**
 * Color scheme configuration
 */
export interface ColorScheme {
  /** Primary brand color */
  primary?: string;
  /** Secondary/accent color */
  secondary?: string;
  /** Accent color */
  accent?: string;
  /** Background color */
  background?: string;
  /** Foreground/text color */
  foreground?: string;
  /** Muted/secondary text color */
  muted?: string;
  /** Border color */
  border?: string;
  /** Success state color */
  success?: string;
  /** Warning state color */
  warning?: string;
  /** Error state color */
  error?: string;
  /** Info state color */
  info?: string;
}

/**
 * Font configuration
 */
export interface FontScheme {
  /** Base font family */
  family?: string;
  /** Base font size */
  size?: string;
  /** Heading font family */
  headingFamily?: string;
  /** Monospace font family */
  monoFamily?: string;
}

/**
 * Complete theme configuration
 */
export interface ThemeConfig {
  colors?: ColorScheme;
  fonts?: FontScheme;
}

/**
 * Predefined theme presets
 */
export type ThemePreset = "classic" | "modern" | "minimal";
