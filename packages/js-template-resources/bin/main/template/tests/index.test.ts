import { describe, beforeEach, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { TransactionApi } from "../src/types";

// These are available for use in tests when they are written
import type { expect as _expect, test as _test } from "vitest";
import type { gameLogic as _gameLogic } from "../src";
import type {
  GameState as _GameState,
  GameAction as _GameAction,
  Player as _Player,
  Card as _Card,
  GameApis as _GameApis,
  TransactionResult as _TransactionResult,
  TransactionOperationResult as _TransactionOperationResult,
  DeckData as _DeckData,
  GameBoardData as _GameBoardData,
  PlayerConfigData as _PlayerConfigData,
  JsonElement as _JsonElement,
} from "../src/types";
import type {
  GameStateBuilder as _GameStateBuilder,
  PlayerBuilder as _PlayerBuilder,
  CardDataBuilder as _CardDataBuilder,
  SuitAndRankCardBuilder as _SuitAndRankCardBuilder,
  DeckBuilder as _DeckBuilder,
} from "./state-builder";

const mockTransactionApi: DeepMockProxy<TransactionApi> =
  mockDeep<TransactionApi>();

vi.stubGlobal("transactionApi", mockTransactionApi);

describe("GameLogic", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockReset(mockTransactionApi);
  });

  // TODO: Add tests for each method
});
