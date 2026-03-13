import { initialState } from "./initial-state";
import type {
  Card,
  CardId,
  CardOverride,
  Component,
  DeckData,
  DeckId,
  DeckPlayState,
  DieData,
  GameBoardData,
  GameState,
  GlobalState,
  Player,
  PlayerConfigData,
  PlayerId,
  PlayerState,
  RoundPhaseState,
  RoundState,
  StepId,
  TokenData,
  ZoneData,
} from "../src/types";

/* Functional fluent builder for creating Player objects with sensible defaults
 *
 * Usage examples:
 * - Basic: PlayerBuilder().build()
 * - Custom: PlayerBuilder().withId('hero').withName('Hero Player').withScore(100).build()
 * - With cards: PlayerBuilder().withCard('card1', someCard).build()
 */
const PlayerBuilder = () => {
  // Default values
  let id = "player-1";
  let name = "Player 1";
  let score = 0;
  let hand: CardId[] = [];

  const builder = {
    /**
     * Set the player ID
     */
    withId: (playerId: string) => {
      id = playerId;
      return builder;
    },

    /**
     * Set the player name
     */
    withName: (playerName: string) => {
      name = playerName;
      return builder;
    },

    /**
     * Set the player score
     */
    withScore: (playerScore: number) => {
      score = playerScore;
      return builder;
    },

    /**
     * Override the entire hand
     */
    withHand: (playerHand: CardId[]) => {
      hand = [...playerHand];
      return builder;
    },

    /**
     * Add a single card to the hand
     */
    withCard: (cardId: CardId) => {
      hand.push(cardId);
      return builder;
    },

    /**
     * Add multiple cards to the hand
     */
    withCards: (cardIds: CardId[]) => {
      hand = [...hand, ...cardIds];
      return builder;
    },

    /**
     * Clear all cards from hand
     */
    withEmptyHand: () => {
      hand = [];
      return builder;
    },

    /**
     * Build the final Player object
     */
    build: (): Player => ({
      id: id as PlayerId,
      name,
      score,
      hand,
    }),
  };

  return builder;
};

/**
 * Functional fluent builder for creating Card objects with sensible defaults
 *
 * Usage examples:
 * - Basic: CardDataBuilder().build()
 * - Custom: CardDataBuilder().withId('ace_spades').withName('Ace of Spades').build()
 */
const CardDataBuilder = () => {
  // Default values
  let cardName: string | null = "Default Card";
  let description: string | null = "A default card for testing";
  let id = "default_card";
  const componentType = "GenericCardData";

  const builder = {
    /**
     * Set the component ID
     */
    withId: (componentId: string) => {
      id = componentId;
      return builder;
    },

    /**
     * Set the card name
     */
    withName: (name: string | null) => {
      cardName = name;
      return builder;
    },

    /**
     * Set the card description
     */
    withDescription: (desc: string | null) => {
      description = desc;
      return builder;
    },

    /**
     * Build the final Card object
     */
    build: (): Card => ({
      type: "GenericCardData" as const,
      cardName,
      componentType,
      description,
      id: id as CardId,
    }),
  };

  return builder;
};

/**
 * Functional fluent builder for creating SuitAndRankCard objects
 *
 * Usage examples:
 * - Basic: SuitAndRankCardBuilder().withSuit('HEARTS').withRank('A').build()
 * - Custom: SuitAndRankCardBuilder().withSuit('SPADES').withRank('K').build()
 */
const SuitAndRankCardBuilder = () => {
  // Default values
  let cardName: string | null = null;
  let description: string | null = null;
  let id = "default_suit_rank_card";
  const componentType = "SuitAndRankCardData";
  let suit = "HEARTS";
  let rank = "A";

  const builder = {
    /**
     * Set the card suit
     */
    withSuit: (cardSuit: string) => {
      suit = cardSuit;
      return builder;
    },

    /**
     * Set the card rank
     */
    withRank: (cardRank: string) => {
      rank = cardRank;
      return builder;
    },

    /**
     * Set both suit and rank at once
     */
    withSuitAndRank: (cardSuit: string, cardRank: string) => {
      suit = cardSuit;
      rank = cardRank;
      return builder;
    },

    /**
     * Set the component ID
     */
    withId: (componentId: string) => {
      id = componentId;
      return builder;
    },

    /**
     * Set the card name
     */
    withName: (name: string | null) => {
      cardName = name;
      return builder;
    },

    /**
     * Set the card description
     */
    withDescription: (desc: string | null) => {
      description = desc;
      return builder;
    },

    /**
     * Build the final Card object
     */
    build: (): Card => ({
      type: "SuitAndRankCardData" as const,
      cardName,
      componentType,
      description,
      id: id as CardId,
      suit,
      rank,
    }),
  };

  return builder;
};

/**
 * Functional fluent builder for creating DeckData objects
 *
 * Usage examples:
 * - Empty deck: DeckBuilder().withId('main_deck').build()
 * - With cards: DeckBuilder().withId('player_deck').withCards([card1, card2]).build()
 */
const DeckBuilder = () => {
  // Default values
  let id = "default_deck";
  let cards: CardId[] = [];

  const builder = {
    /**
     * Set the deck ID
     */
    withId: (deckId: string) => {
      id = deckId;
      return builder;
    },

    /**
     * Set the cards in the deck
     */
    withCards: (deckCards: CardId[]) => {
      cards = [...deckCards];
      return builder;
    },

    /**
     * Add a single card to the deck
     */
    withCard: (cardId: CardId) => {
      cards.push(cardId);
      return builder;
    },

    /**
     * Add multiple cards to the deck
     */
    addCards: (newCards: CardId[]) => {
      cards.push(...newCards);
      return builder;
    },

    /**
     * Create a standard 52-card deck
     */
    withStandardDeck: () => {
      const suits = ["HEARTS", "DIAMONDS", "CLUBS", "SPADES"];
      const ranks = [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
        "A",
      ];

      cards = suits.flatMap((suit) =>
        ranks.map((rank) => `${suit}_${rank}` as CardId),
      );
      return builder;
    },

    /**
     * Clear all cards from the deck
     */
    empty: () => {
      cards = [];
      return builder;
    },

    /**
     * Build the final DeckData object
     */
    build: (): DeckData => ({
      id: id as DeckId,
      cards,
    }),
  };

  return builder;
};

/**
 * Functional fluent builder for creating GameState objects with sensible defaults
 *
 * Usage examples:
 * - Basic: GameStateBuilder().build()
 * - With players: GameStateBuilder().withPlayerCount(3).build()
 * - Custom game ID: GameStateBuilder().withGameId('custom-game').build()
 * - Complex setup: GameStateBuilder()
 *     .withPlayerCount(4)
 *     .withGameId('tournament-game')
 *     .withCurrentPlayer('player_2')
 *     .build()
 */
const GameStateBuilder = () => {
  // Default values
  let gameId = "test-game";
  let playerCount = 4;
  let currentPlayerIds: string[] = ["player-1"];
  let customPlayers: { [key: string]: Player } | null = null;
  let customDecks: { [key: string]: DeckData } | null = null;
  let customCards: { [key: string]: Card } | null = null;
  let customDice: { [key: string]: DieData } | null = null;
  let customTokens: { [key: string]: TokenData } | null = null;
  let customZones: { [key: string]: ZoneData } | null = null;
  let customGlobalVariables: GlobalState | null = null;
  let customPlayerVariables: {
    [key: string]: PlayerState;
  } | null = null;
  let customRoundVariables: RoundState | null = null;
  let customCurrentRoundPhase: RoundPhaseState | null = null;
  let customCurrentTurnStep: StepId | null = null;
  let customRoundNumber: number | null = null;
  let customDeckCardOverride: Record<
    DeckId,
    Record<CardId, CardOverride>
  > | null = null;
  let customDeckPlayStates: Record<DeckId, DeckPlayState> | null = null;
  let customGameBoard: GameBoardData | null = null;
  let customPlayerConfig: PlayerConfigData | null = null;
  let customPlayerOrder: string[] | null = null;

  const builder = {
    /**
     * Set the game ID
     */
    withGameId: (id: string) => {
      gameId = id;
      return builder;
    },

    /**
     * Set the number of players (automatically generates player IDs and order)
     */
    withPlayerCount: (count: number) => {
      playerCount = count;
      if (
        !customPlayers &&
        currentPlayerIds.length > 0 &&
        currentPlayerIds[0] === "player-1" &&
        count > 0
      ) {
        currentPlayerIds = ["player-1"];
      }
      return builder;
    },

    /**
     * Set the current player ID (clears all and sets single player)
     */
    withCurrentPlayer: (playerId: string | null) => {
      currentPlayerIds = playerId ? [playerId] : [];
      return builder;
    },

    /**
     * Set multiple active players (for MULTIPLE_ACTIVE_PLAYER states)
     */
    withActivePlayers: (playerIds: string[]) => {
      currentPlayerIds = [...playerIds];
      return builder;
    },

    /**
     * Set a custom player order
     */
    withPlayerOrder: (order: string[]) => {
      customPlayerOrder = [...order];
      return builder;
    },

    /**
     * Override the default players with custom ones
     */
    withPlayers: (players: Player[]) => {
      customPlayers = players.reduce(
        (acc, player) => {
          acc[player.id] = player;
          return acc;
        },
        {} as { [key: string]: Player },
      );
      return builder;
    },

    /**
     * Add a single custom player
     */
    withPlayer: (player: Player) => {
      if (!customPlayers) {
        customPlayers = {};
      }
      customPlayers[player.id] = player;
      return builder;
    },

    /**
     * Override the default decks
     */
    withDecks: (decks: DeckData[]) => {
      customDecks = decks.reduce(
        (acc, deck) => {
          acc[deck.id] = deck;
          return acc;
        },
        {} as { [key: string]: DeckData },
      );
      return builder;
    },

    /**
     * Add a single deck
     */
    withDeck: (deck: DeckData) => {
      if (!customDecks) {
        customDecks = {};
      }
      customDecks[deck.id] = deck;
      return builder;
    },

    /**
     * Override the default cards
     */
    withCards: (cards: Card[]) => {
      customCards = cards.reduce(
        (acc, card) => {
          acc[card.id] = card;
          return acc;
        },
        {} as { [key: string]: Card },
      );
      return builder;
    },

    /**
     * Add a single card
     */
    withCard: (card: Card) => {
      if (!customCards) {
        customCards = {};
      }
      customCards[card.id] = card;
      return builder;
    },

    /**
     * Override the default dice
     */
    withDice: (dice: DieData[]) => {
      customDice = dice.reduce(
        (acc, die) => {
          acc[die.id] = die;
          return acc;
        },
        {} as { [key: string]: DieData },
      );
      return builder;
    },

    /**
     * Add a single die
     */
    withDie: (die: DieData) => {
      if (!customDice) {
        customDice = {};
      }
      customDice[die.id] = die;
      return builder;
    },

    /**
     * Override the default tokens
     */
    withTokens: (tokens: TokenData[]) => {
      customTokens = tokens.reduce(
        (acc, token) => {
          acc[token.id] = token;
          return acc;
        },
        {} as { [key: string]: TokenData },
      );
      return builder;
    },

    /**
     * Add a single token
     */
    withToken: (token: TokenData) => {
      if (!customTokens) {
        customTokens = {};
      }
      customTokens[token.id] = token;
      return builder;
    },

    /**
     * Override the default zones
     */
    withZones: (zones: ZoneData[]) => {
      customZones = zones.reduce(
        (acc, zone) => {
          acc[zone.id] = zone;
          return acc;
        },
        {} as { [key: string]: ZoneData },
      );
      return builder;
    },

    /**
     * Add a single zone
     */
    withZone: (zone: ZoneData) => {
      if (!customZones) {
        customZones = {};
      }
      customZones[zone.id] = zone;
      return builder;
    },

    /**
     * Set the current turn step
     */
    withCurrentTurnStep: (step: StepId | null) => {
      customCurrentTurnStep = step;
      return builder;
    },

    /**
     * Set the round number
     */
    withRoundNumber: (roundNum: number) => {
      customRoundNumber = roundNum;
      return builder;
    },

    /**
     * Set the current round phase
     */
    withCurrentRoundPhase: (phase: RoundPhaseState) => {
      customCurrentRoundPhase = phase;
      return builder;
    },

    /**
     * Set deck card overrides
     */
    withDeckCardOverride: (
      overrides: Record<DeckId, Record<CardId, CardOverride>>,
    ) => {
      customDeckCardOverride = overrides;
      return builder;
    },

    /**
     * Set deck play states
     */
    withDeckPlayStates: (playStates: Record<DeckId, DeckPlayState>) => {
      customDeckPlayStates = playStates;
      return builder;
    },

    /**
     * Set global variables
     */
    withGlobalVariables: (variables: GlobalState) => {
      customGlobalVariables = variables;
      return builder;
    },

    /**
     * Add a single global variable
     */
    withGlobalVariable: (variables: GlobalState) => {
      customGlobalVariables = variables;
      return builder;
    },

    /**
     * Set player-specific variables
     */
    withPlayerVariables: (variables: { [key: string]: PlayerState }) => {
      customPlayerVariables = variables;
      return builder;
    },

    /**
     * Add variables for a specific player
     */
    withPlayerVariable: (playerId: string, variables: PlayerState) => {
      if (!customPlayerVariables) {
        customPlayerVariables = {};
      }
      customPlayerVariables[playerId] = variables;
      return builder;
    },

    /**
     * Set round-specific variables
     */
    withRoundVariables: (variables: RoundState) => {
      customRoundVariables = variables;
      return builder;
    },

    /**
     * Add a single round variable
     */
    withRoundVariable: (variables: RoundState) => {
      customRoundVariables = variables;
      return builder;
    },

    /**
     * Override the default game board
     */
    withGameBoard: (gameBoard: GameBoardData) => {
      customGameBoard = gameBoard;
      return builder;
    },

    /**
     * Override the default player configuration
     */
    withPlayerConfig: (config: PlayerConfigData) => {
      customPlayerConfig = config;
      return builder;
    },

    /**
     * Build the final GameState object
     */
    build: (): GameState => {
      // Start with initial state as base
      const baseState = { ...initialState };

      // Generate player order based on custom order, player count, or custom players
      const finalPlayerCount = customPlayers
        ? Object.keys(customPlayers).length
        : playerCount;
      const playerOrder =
        customPlayerOrder ||
        (customPlayers
          ? Object.keys(customPlayers)
          : Array.from(
              { length: finalPlayerCount },
              (_, i) => `player-${i + 1}`,
            ));

      // Generate players if not custom provided
      const players =
        customPlayers ||
        Object.fromEntries(
          playerOrder.map((playerId) => [
            playerId,
            PlayerBuilder().withId(playerId).build(),
          ]),
        );

      // Build current round phase with custom variables if provided
      const currentRoundPhase = customCurrentRoundPhase || {
        ...baseState.currentRoundPhase,
        variables:
          customRoundVariables || baseState.currentRoundPhase.variables,
      };

      return {
        ...baseState,
        currentPlayerIds: currentPlayerIds as PlayerId[],
        gameId,
        globalVariables: customGlobalVariables || baseState.globalVariables,
        playerConfig: customPlayerConfig || baseState.playerConfig,
        playerOrder: playerOrder as PlayerId[],
        playerVariables: (customPlayerVariables ||
          baseState.playerVariables) as Record<PlayerId, PlayerState>,
        players: players as Record<PlayerId, Player>,
        decks: (customDecks || baseState.decks) as Record<DeckId, DeckData>,
        cards: (customCards || baseState.cards) as Record<CardId, Card>,
        dice: (customDice || baseState.dice) as Record<string, DieData>,
        tokens: (customTokens || baseState.tokens) as Record<string, TokenData>,
        zones: (customZones || baseState.zones) as Record<string, ZoneData>,
        gameBoard: customGameBoard as Component,
        currentRoundPhase,
        currentTurnStep:
          customCurrentTurnStep !== null
            ? customCurrentTurnStep
            : baseState.currentTurnStep,
        roundNumber:
          customRoundNumber !== null
            ? customRoundNumber
            : baseState.roundNumber,
        deckCardOverride: customDeckCardOverride || baseState.deckCardOverride,
        deckPlayStates: customDeckPlayStates || baseState.deckPlayStates,
      };
    },
  };

  return builder;
};

// Named and default exports for all builders
export {
  CardDataBuilder,
  DeckBuilder,
  GameStateBuilder,
  PlayerBuilder,
  SuitAndRankCardBuilder,
};
