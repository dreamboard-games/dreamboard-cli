import type { ThemeConfig, ThemePreset } from "./types.js";
import { themePresets } from "./presets.js";

/**
 * Theme API for customizing visual appearance.
 * Applies CSS custom properties to the document root.
 */
export const theme = {
  /**
   * Apply a custom theme configuration.
   *
   * @param config - Theme configuration with colors and fonts
   *
   * @example
   * ```typescript
   * theme.setTheme({
   *   colors: {
   *     primary: '#0F172A',
   *     accent: '#F97316',
   *     background: '#FFFFFF'
   *   },
   *   fonts: {
   *     family: 'Inter, sans-serif',
   *     size: '16px'
   *   }
   * });
   * ```
   */
  setTheme(config: ThemeConfig): void {
    const root = document.documentElement;

    // Apply color scheme
    if (config.colors) {
      Object.entries(config.colors).forEach(([key, value]) => {
        if (value) {
          root.style.setProperty(`--color-${key}`, value);
        }
      });
    }

    // Apply font scheme
    if (config.fonts) {
      if (config.fonts.family) {
        root.style.setProperty("--font-family", config.fonts.family);
      }
      if (config.fonts.size) {
        root.style.setProperty("--font-size", config.fonts.size);
      }
      if (config.fonts.headingFamily) {
        root.style.setProperty("--font-heading", config.fonts.headingFamily);
      }
      if (config.fonts.monoFamily) {
        root.style.setProperty("--font-mono", config.fonts.monoFamily);
      }
    }
  },

  /**
   * Apply a predefined theme preset.
   *
   * @param preset - Name of the preset ('classic', 'modern', or 'minimal')
   *
   * @example
   * ```typescript
   * theme.applyPreset('modern');
   * ```
   */
  applyPreset(preset: ThemePreset): void {
    const config = themePresets[preset];
    if (!config) {
      // eslint-disable-next-line no-console
      console.warn(`Unknown theme preset: ${preset}`);
      return;
    }
    this.setTheme(config);
  },

  /**
   * Register a custom theme palette for later use.
   *
   * @param name - Unique name for this palette
   * @param config - Theme configuration
   *
   * @example
   * ```typescript
   * theme.registerPalette('dark-mode', {
   *   colors: {
   *     background: '#0F172A',
   *     foreground: '#F1F5F9'
   *   }
   * });
   *
   * // Later, apply it
   * theme.applyPreset('dark-mode');
   * ```
   */
  registerPalette(name: string, config: ThemeConfig): void {
    themePresets[name] = config;
  },
};
