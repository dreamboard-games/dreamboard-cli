declare const console: Console;

import type { Logger } from "./logger.js";

export function Logger(): Logger {
  return {
    info(msg: string, ...args: unknown[]): void {
      console.log(`INFO: ${msg}`, ...args.map(stringifyDefensively));
    },

    warn(msg: string, ...args: unknown[]): void {
      console.warn(`WARN: ${msg}`, ...args.map(stringifyDefensively));
    },

    error(msg: string, ...args: unknown[]): void {
      console.error(`ERROR: ${msg}`, ...args.map(stringifyDefensively));
    },
  };
}

/**
 * Safely stringify any value, handling circular references and errors
 */
function stringifyDefensively(obj: unknown): string {
  try {
    if (obj === null || obj === undefined) {
      return String(obj);
    }

    if (
      typeof obj === "string" ||
      typeof obj === "number" ||
      typeof obj === "boolean"
    ) {
      return String(obj);
    }

    // Handle Error objects specially since their properties are non-enumerable
    if (obj instanceof Error) {
      return JSON.stringify(
        {
          name: obj.name,
          message: obj.message,
          stack: obj.stack,
          ...(obj as unknown as Record<string, unknown>), // Include any additional enumerable properties
        },
        null,
        2,
      );
    }

    return JSON.stringify(obj, null, 2);
  } catch (_err) {
    // Handle circular references or other JSON.stringify errors
    try {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === "object" && value !== null) {
          // Handle Error objects in nested structures
          if (value instanceof Error) {
            return {
              name: value.name,
              message: value.message,
              stack: value.stack,
            };
          }
          // Simple circular reference handling for other objects
          return "[Object]";
        }
        return value;
      });
    } catch {
      // Final fallback for completely unstringifiable objects
      if (obj instanceof Error) {
        return `${obj.name}: ${obj.message}`;
      }
      return "[Unstringifiable Object]";
    }
  }
}
