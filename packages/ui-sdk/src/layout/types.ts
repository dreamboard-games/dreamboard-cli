/**
 * Layout and grid types for responsive UI configuration
 */

/**
 * Breakpoint names for responsive layout
 */
export type Breakpoint = "base" | "sm" | "md" | "lg" | "xl";

/**
 * Responsive value that can vary by breakpoint
 */
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

/**
 * CSS Grid configuration
 */
export interface GridConfig {
  /** Number of columns in the grid */
  columns: ResponsiveValue<number>;
  /** Number of rows in the grid (auto by default) */
  rows?: ResponsiveValue<string>;
  /** Gap between grid items */
  gap?: ResponsiveValue<string>;
}

/**
 * Grid area definition: [colStart, rowStart, colEnd, rowEnd]
 */
export type GridArea = [number, number, number, number];

/**
 * Component placement options in the grid
 */
export interface PlacementOptions {
  /** Grid area by breakpoint */
  area: ResponsiveValue<GridArea>;
  /** CSS align-self value */
  align?: ResponsiveValue<string>;
  /** CSS justify-self value */
  justify?: ResponsiveValue<string>;
  /** Rendering order (for flexbox fallback) */
  order?: ResponsiveValue<number>;
}
