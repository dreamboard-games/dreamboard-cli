/**
 * Validation result types and helpers for action validation
 */

import type { ActionErrorCodes } from "@dreamboard/manifest";

/**
 * Result of action validation
 */
export interface ValidationResult {
  valid: boolean;
  errorCode?: ActionErrorCodes | string;
  message?: string;
}

/**
 * Create a successful validation result
 */
export function validationSuccess(): ValidationResult {
  return { valid: true };
}

/**
 * Create a failed validation result with an error code and optional message
 * @param errorCode - Machine-readable error code (should match one of ActionErrorCodes)
 * @param message - Optional human-readable error message
 */
export function validationError(
  errorCode: ActionErrorCodes,
  message?: string,
): ValidationResult {
  return { valid: false, errorCode, message };
}
