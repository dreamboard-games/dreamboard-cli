import type { ThemeConfig } from "./types.js";

/**
 * Predefined theme configurations
 */
export const themePresets: Record<string, ThemeConfig> = {
  classic: {
    colors: {
      primary: "#1e40af",
      secondary: "#7c3aed",
      accent: "#f59e0b",
      background: "#ffffff",
      foreground: "#1f2937",
      muted: "#6b7280",
      border: "#d1d5db",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
    fonts: {
      family: "system-ui, -apple-system, sans-serif",
      size: "16px",
      headingFamily: "Georgia, serif",
      monoFamily: "ui-monospace, monospace",
    },
  },

  modern: {
    colors: {
      primary: "#0f172a",
      secondary: "#334155",
      accent: "#f97316",
      background: "#ffffff",
      foreground: "#020617",
      muted: "#64748b",
      border: "#e2e8f0",
      success: "#22c55e",
      warning: "#eab308",
      error: "#dc2626",
      info: "#0ea5e9",
    },
    fonts: {
      family: "Inter, system-ui, sans-serif",
      size: "16px",
      headingFamily: "Inter, system-ui, sans-serif",
      monoFamily: "JetBrains Mono, monospace",
    },
  },

  minimal: {
    colors: {
      primary: "#000000",
      secondary: "#404040",
      accent: "#808080",
      background: "#ffffff",
      foreground: "#000000",
      muted: "#737373",
      border: "#e5e5e5",
      success: "#16a34a",
      warning: "#ca8a04",
      error: "#b91c1c",
      info: "#0284c7",
    },
    fonts: {
      family: "Helvetica, Arial, sans-serif",
      size: "16px",
      headingFamily: "Helvetica, Arial, sans-serif",
      monoFamily: "Courier, monospace",
    },
  },
};
