export type PersistedRunSession = {
  sessionId: string;
  shortCode: string;
  gameId: string;
  seed?: number;
  compiledResultId?: string;
  createdAt: string;
  lastEventId?: string;
  controllablePlayerIds: string[];
  yourTurnCount: number;
};

const DEFAULT_RUN_SEED = 1337;
const MIN_KOTLIN_LONG = -9_223_372_036_854_775_808n;
const MAX_KOTLIN_LONG = 9_223_372_036_854_775_807n;
const MIN_SAFE_SEED = BigInt(Number.MIN_SAFE_INTEGER);
const MAX_SAFE_SEED = BigInt(Number.MAX_SAFE_INTEGER);

export function createPersistedRunSession(input: {
  sessionId: string;
  shortCode: string;
  gameId: string;
  seed?: number;
  compiledResultId?: string;
  createdAt?: string;
}): PersistedRunSession {
  return {
    sessionId: input.sessionId,
    shortCode: input.shortCode,
    gameId: input.gameId,
    seed: input.seed,
    compiledResultId: input.compiledResultId,
    createdAt: input.createdAt ?? new Date().toISOString(),
    controllablePlayerIds: [],
    yourTurnCount: 0,
  };
}

export function parseRunSeed(rawSeed: string | undefined): number {
  const value = rawSeed?.trim();
  if (!value) {
    return DEFAULT_RUN_SEED;
  }
  if (!/^-?\d+$/.test(value)) {
    throw new Error("seed must be an integer");
  }

  const parsed = BigInt(value);
  if (parsed < MIN_KOTLIN_LONG || parsed > MAX_KOTLIN_LONG) {
    throw new Error("seed must be within signed 64-bit integer range");
  }
  if (parsed < MIN_SAFE_SEED || parsed > MAX_SAFE_SEED) {
    throw new Error(
      `seed must be within JavaScript safe integer range (${Number.MIN_SAFE_INTEGER}..${Number.MAX_SAFE_INTEGER})`,
    );
  }

  return Number(parsed);
}
