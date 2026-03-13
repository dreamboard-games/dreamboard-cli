import type { GridConfig, PlacementOptions, ResponsiveValue } from "./types.js";

/**
 * Layout API for configuring responsive grid layouts.
 * This provides a declarative way to position game components.
 */
export const layout = {
  /**
   * Configure the CSS Grid layout with responsive breakpoints.
   *
   * @param config - Grid configuration with responsive values
   *
   * @example
   * ```typescript
   * layout.configureGrid({
   *   columns: { base: 4, md: 8, xl: 12 },
   *   rows: { base: 'auto', md: 'minmax(0, 1fr) auto' },
   *   gap: { base: '8px', xl: '16px' }
   * });
   * ```
   */
  configureGrid(config: GridConfig): void {
    const root = document.documentElement;

    // Helper to set CSS variable for responsive value
    const setResponsiveVar = (
      name: string,
      value: ResponsiveValue<unknown>,
    ) => {
      if (typeof value === "object" && value !== null) {
        // Set base value
        if ("base" in value) {
          root.style.setProperty(name, String(value.base));
        }

        // Set breakpoint-specific values as CSS variables
        Object.entries(value).forEach(([breakpoint, val]) => {
          if (breakpoint !== "base") {
            root.style.setProperty(`${name}-${breakpoint}`, String(val));
          }
        });
      } else {
        root.style.setProperty(name, String(value));
      }
    };

    setResponsiveVar("--grid-columns", config.columns);

    if (config.rows) {
      setResponsiveVar("--grid-rows", config.rows);
    }

    if (config.gap) {
      setResponsiveVar("--grid-gap", config.gap);
    }
  },

  /**
   * Place a component in the grid at specific coordinates.
   *
   * @param componentId - Unique identifier for the component
   * @param options - Placement configuration with responsive areas
   *
   * @example
   * ```typescript
   * layout.place('deck:draw', {
   *   area: { base: [1, 1, 2, 2], md: [3, 1, 5, 3] },
   *   align: 'center',
   *   justify: 'center'
   * });
   * ```
   */
  place(componentId: string, options: PlacementOptions): void {
    const element = document.getElementById(componentId);
    if (!element) {
      // eslint-disable-next-line no-console
      console.warn(`Element with id "${componentId}" not found for placement`);
      return;
    }

    // Helper to set responsive style
    const setResponsiveStyle = (
      property: string,
      value: ResponsiveValue<unknown>,
    ) => {
      if (typeof value === "object" && value !== null) {
        // Set base value
        if ("base" in value) {
          element.style.setProperty(property, String(value.base));
        }

        // Set breakpoint-specific values as CSS custom properties
        Object.entries(value).forEach(([breakpoint, val]) => {
          if (breakpoint !== "base") {
            element.style.setProperty(`${property}-${breakpoint}`, String(val));
          }
        });
      } else {
        element.style.setProperty(property, String(value));
      }
    };

    // Set grid area
    const setGridArea = (
      area: ResponsiveValue<[number, number, number, number]>,
    ) => {
      if (Array.isArray(area)) {
        const [colStart, rowStart, colEnd, rowEnd] = area;
        element.style.gridArea = `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}`;
      } else {
        Object.entries(area).forEach(([breakpoint, coords]) => {
          if (coords) {
            const [colStart, rowStart, colEnd, rowEnd] = coords;
            const gridAreaValue = `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}`;
            if (breakpoint === "base") {
              element.style.gridArea = gridAreaValue;
            } else {
              element.style.setProperty(
                `--grid-area-${breakpoint}`,
                gridAreaValue,
              );
            }
          }
        });
      }
    };

    setGridArea(options.area);

    if (options.align) {
      setResponsiveStyle("align-self", options.align);
    }

    if (options.justify) {
      setResponsiveStyle("justify-self", options.justify);
    }

    if (options.order) {
      setResponsiveStyle("order", options.order);
    }
  },
};
