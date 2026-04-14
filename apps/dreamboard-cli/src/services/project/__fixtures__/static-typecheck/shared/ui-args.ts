export type AnyUIArgs = Record<string, unknown>;

export type UIArgsResult<T extends string = string> = Record<T, AnyUIArgs>;
