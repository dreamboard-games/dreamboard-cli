/**
 * Cosmos decorator that provides mock contexts for fixtures.
 * This wraps all fixtures with the necessary providers.
 */
import React, { type ReactNode } from "react";
import { RuntimeContext } from "../../context/RuntimeContext.js";
import { PluginSessionContext } from "../../context/PluginSessionContext.js";
import type { PluginStateSnapshot } from "../../types/plugin-state.js";
import type { GameState, CardInfo } from "../../types/player-state.js";
import type {
  RuntimeAPI,
  PluginSessionState,
} from "../../types/runtime-api.js";

// Sample card data for fixtures
export const SAMPLE_CARDS: Record<string, CardInfo> = {
  "card-spade-A": {
    deckDefinitionId: "standard-deck",
    cardType: "standard",
    cardName: "Ace of Spades",
    description: "The highest card",
    properties: JSON.stringify({ suit: "♠", rank: "A", value: 14 }),
  },
  "card-heart-K": {
    deckDefinitionId: "standard-deck",
    cardType: "standard",
    cardName: "King of Hearts",
    description: "A royal card",
    properties: JSON.stringify({ suit: "♥", rank: "K", value: 13 }),
  },
  "card-diamond-Q": {
    deckDefinitionId: "standard-deck",
    cardType: "standard",
    cardName: "Queen of Diamonds",
    description: "A royal card",
    properties: JSON.stringify({ suit: "♦", rank: "Q", value: 12 }),
  },
  "card-club-J": {
    deckDefinitionId: "standard-deck",
    cardType: "standard",
    cardName: "Jack of Clubs",
    description: "A royal card",
    properties: JSON.stringify({ suit: "♣", rank: "J", value: 11 }),
  },
  "card-spade-10": {
    deckDefinitionId: "standard-deck",
    cardType: "standard",
    cardName: "10 of Spades",
    description: "A number card",
    properties: JSON.stringify({ suit: "♠", rank: "10", value: 10 }),
  },
  "card-heart-9": {
    deckDefinitionId: "standard-deck",
    cardType: "standard",
    cardName: "9 of Hearts",
    description: "A number card",
    properties: JSON.stringify({ suit: "♥", rank: "9", value: 9 }),
  },
  "card-diamond-8": {
    deckDefinitionId: "standard-deck",
    cardType: "standard",
    cardName: "8 of Diamonds",
    description: "A number card",
    properties: JSON.stringify({ suit: "♦", rank: "8", value: 8 }),
  },
  "card-club-7": {
    deckDefinitionId: "standard-deck",
    cardType: "standard",
    cardName: "7 of Clubs",
    description: "A number card",
    properties: JSON.stringify({ suit: "♣", rank: "7", value: 7 }),
  },
};

// Default mock game state
const defaultGameState: GameState = {
  isMyTurn: true,
  currentState: "playing",
  currentPlayerIds: ["player-1"],
  hands: {
    "main-hand": Object.keys(SAMPLE_CARDS).slice(0, 5),
  },
  decks: {
    "draw-deck": ["card-diamond-8", "card-club-7"],
    "discard-pile": [],
  },
  globalVariables: {},
  playerVariables: {
    "player-1": { score: 10, name: "Alice" },
    "player-2": { score: 5, name: "Bob" },
  },
  cards: SAMPLE_CARDS,
};

// Default mock session state (from runtime-api.ts)
const defaultSessionState: PluginSessionState = {
  status: "ready",
  sessionId: "mock-session-123",
  controllablePlayerIds: ["player-1"],
  controllingPlayerId: "player-1",
  userId: "user-1",
};

// Default mock plugin state snapshot
const defaultMockSnapshot: PluginStateSnapshot = {
  game: defaultGameState,
  lobby: null,
  notifications: [],
  session: {
    sessionId: "mock-session-123",
    controllablePlayerIds: ["player-1"],
    controllingPlayerId: "player-1",
    userId: "user-1",
  },
  history: null,
  syncId: 1,
};

interface MockProviderProps {
  children: ReactNode;
  gameState?: Partial<GameState>;
  sessionState?: Partial<PluginSessionState>;
}

/**
 * Provider that supplies mock runtime for Cosmos fixtures
 */
export function MockRuntimeProvider({
  children,
  gameState,
  sessionState,
}: MockProviderProps) {
  const mergedGameState: GameState = {
    ...defaultGameState,
    ...gameState,
    cards: { ...defaultGameState.cards, ...gameState?.cards },
  };

  const mergedSnapshot: PluginStateSnapshot = {
    ...defaultMockSnapshot,
    game: mergedGameState,
  };

  const mergedSessionState: PluginSessionState = {
    ...defaultSessionState,
    ...sessionState,
  };

  // Create mock RuntimeAPI
  const mockRuntime: RuntimeAPI = {
    getSessionState: () => mergedSessionState,
    onMessage: () => () => {},
    onAnyMessage: () => () => {},
    validateAction: async () => ({ valid: true }),
    submitAction: async (playerId, action, params) => {
      console.log("[Mock Runtime] Action submitted:", playerId, action, params);
    },
    disconnect: () => {
      console.log("[Mock Runtime] Disconnected");
    },
    // PluginRuntimeAPI methods (extended interface)
    getSnapshot: () => mergedSnapshot,
    subscribeToState: () => () => {},
    switchPlayer: (playerId) => {
      console.log("[Mock Runtime] Switch player:", playerId);
    },
  } as RuntimeAPI & {
    getSnapshot: () => PluginStateSnapshot;
    subscribeToState: (cb: (state: PluginStateSnapshot) => void) => () => void;
    switchPlayer: (playerId: string) => void;
  };

  return (
    <RuntimeContext.Provider value={mockRuntime}>
      <PluginSessionContext.Provider value={mergedSessionState}>
        {children}
      </PluginSessionContext.Provider>
    </RuntimeContext.Provider>
  );
}

// Export sample card IDs for use in fixtures
export const SAMPLE_CARD_IDS = Object.keys(SAMPLE_CARDS);
