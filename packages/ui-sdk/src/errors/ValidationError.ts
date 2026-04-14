/**
 * Error thrown when action validation fails.
 * Contains the error code and optional message from the validation result.
 */
export class ValidationError extends Error {
  constructor(
    public readonly errorCode?: string,
    message?: string,
  ) {
    super(message || errorCode || "Validation failed");
    this.name = "ValidationError";
  }
}
