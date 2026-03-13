/**
 * Context object for logging - can be any serializable data structure
 */
export type LogContext =
  | Record<string, unknown>
  | string
  | number
  | boolean
  | null;

export interface Logger {
  info(msg: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
}
