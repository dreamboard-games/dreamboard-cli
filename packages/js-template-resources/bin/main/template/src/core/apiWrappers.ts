import type {
  GameApis,
  GameState,
  CardApi,
  DeckApi,
  DieApi,
  GameApi,
  GlobalStateApi,
  GlobalStateChangeResult,
  PlayerStateChangeResult,
  KvApi,
  ResourceApi,
  ResourceCost,
  JsonElement,
  HexBoardApi,
  NetworkBoardApi,
  SquareBoardApi,
  TrackBoardApi,
  HexTileState,
  HexEdgeState,
  HexVertexState,
  NetworkNodeState,
  NetworkEdgeState,
  NetworkPieceState,
  SquareCellState,
  SquarePieceState,
  TrackSpaceState,
  TrackPieceState,
} from "../types";
import type {
  CardId,
  DeckId,
  DieId,
  PlayerId,
  HandId,
  ResourceId,
  GlobalState,
  PlayerState,
  BoardId,
  PieceId,
} from "@dreamboard/manifest";
import {
  assertCardId,
  assertCardIds,
  assertDeckId,
  assertPlayerId,
  assertHandId,
  assertResourceId,
} from "../runtime/guards";

/**
 * Extended GlobalStateApi with convenience patch methods that merge partial state
 * before calling the underlying set methods.
 */
export interface WrappedGlobalStateApi extends GlobalStateApi {
  patchGlobalState: (
    partialState: Partial<GlobalState>,
  ) => GlobalStateChangeResult;
  patchPlayerState: (
    playerId: PlayerId | string,
    partialState: Partial<PlayerState>,
  ) => PlayerStateChangeResult;
}

/**
 * Extended GameApis that uses WrappedGlobalStateApi with patch helpers.
 */
export interface WrappedGameApis extends Omit<GameApis, "globalStateApi"> {
  globalStateApi: WrappedGlobalStateApi;
}

/**
 * Create a mutating wrapper around GameApis that automatically applies results to GameState
 * and throws exceptions on API failures.
 *
 * @param apis - The original GameApis instance
 * @param state - The GameState object to mutate
 * @returns A WrappedGameApis instance with automatic state mutation and convenience helpers
 */
export function wrapGameApis(
  apis: GameApis,
  state: GameState,
): WrappedGameApis {
  return {
    cardApi: wrapCardApi(apis.cardApi, state),
    deckApi: wrapDeckApi(apis.deckApi, state),
    dieApi: wrapDieApi(apis.dieApi, state),
    gameApi: wrapGameApi(apis.gameApi, state),
    globalStateApi: wrapGlobalStateApi(apis.globalStateApi, state),
    kvApi: wrapKvApi(apis.kvApi, state),
    resourceApi: wrapResourceApi(apis.resourceApi, state),
    hexApi: wrapHexBoardApi(apis.hexApi, state),
    networkApi: wrapNetworkBoardApi(apis.networkApi, state),
    squareApi: wrapSquareBoardApi(apis.squareApi, state),
    trackApi: wrapTrackBoardApi(apis.trackApi, state),
  };
}

/**
 * Wrap CardApi methods to automatically apply results to GameState
 */
function wrapCardApi(cardApi: CardApi, state: GameState): CardApi {
  return {
    detachCard: (cardId: CardId | string) => {
      const result = cardApi.detachCard(assertCardId(cardId));
      if (!result.success) {
        throw new Error(`Card detach failed: ${result.errorMessage}`);
      }
      // Update component location to Detached
      if (result.cardId) {
        state.componentLocations[result.cardId] = { type: "Detached" };
      }
      return result;
    },

    flip: (deckId: DeckId | string, cardId: CardId | string) => {
      const result = cardApi.flip(assertDeckId(deckId), assertCardId(cardId));
      if (!result.success) {
        throw new Error(`Card flip failed: ${result.errorMessage}`);
      }
      // Update visibility
      if (result.cardId) {
        state.visibility[result.cardId] = {
          faceUp: result.faceUp ?? false,
          visibleTo: result.visibleTo,
        };
      }
      return result;
    },

    moveCardsFromHandToDeck: (
      playerId: PlayerId | string,
      handId: HandId | string,
      cardIds: (CardId | string)[],
      deckId: DeckId | string,
    ) => {
      const validatedPlayerId = assertPlayerId(playerId);
      const validatedCardIds = assertCardIds(cardIds);
      const validatedDeckId = assertDeckId(deckId);
      const validatedHandId = assertHandId(handId);

      const result = cardApi.moveCardsFromHandToDeck(
        validatedPlayerId,
        validatedHandId,
        validatedCardIds,
        validatedDeckId,
      );
      if (!result.success) {
        throw new Error(`Move cards to deck failed: ${result.errorMessage}`);
      }
      // Update component locations for moved cards to be in the deck
      // Set playedBy to track who played the card
      for (let i = 0; i < result.movedCards.length; i++) {
        const cardId = result.movedCards[i];
        if (cardId) {
          state.componentLocations[cardId] = {
            type: "InDeck",
            deckId: validatedDeckId,
            position: i,
            playedBy: validatedPlayerId,
          };
        }
      }
      // Update locations for cards remaining in player's hand
      for (let i = 0; i < result.playerHand.length; i++) {
        const cardId = result.playerHand[i];
        if (cardId) {
          state.componentLocations[cardId] = {
            type: "InHand",
            playerId: validatedPlayerId,
            handId: validatedHandId,
            position: i,
          };
        }
      }
      return result;
    },

    moveCardsFromHandToHand: (
      fromPlayerId: PlayerId | string,
      fromHandId: HandId | string,
      toPlayerId: PlayerId | string,
      toHandId: HandId | string,
      cardIds: (CardId | string)[],
    ) => {
      const validatedFromPlayerId = assertPlayerId(fromPlayerId);
      const validatedFromHandId = assertHandId(fromHandId);
      const validatedToPlayerId = assertPlayerId(toPlayerId);
      const validatedToHandId = assertHandId(toHandId);
      const validatedCardIds = assertCardIds(cardIds);

      const result = cardApi.moveCardsFromHandToHand(
        validatedFromPlayerId,
        validatedFromHandId,
        validatedToPlayerId,
        validatedToHandId,
        validatedCardIds,
      );
      if (!result.success) {
        throw new Error(
          `Move cards between hands failed: ${result.errorMessage}`,
        );
      }

      for (let i = 0; i < result.fromPlayerHand.length; i++) {
        const cardId = result.fromPlayerHand[i];
        if (cardId) {
          state.componentLocations[cardId] = {
            type: "InHand",
            playerId: validatedFromPlayerId,
            handId: validatedFromHandId,
            position: i,
          };
        }
      }
      // Update component locations for cards in destination player's hand
      for (let i = 0; i < result.toPlayerHand.length; i++) {
        const cardId = result.toPlayerHand[i];
        if (cardId) {
          state.componentLocations[cardId] = {
            type: "InHand",
            playerId: validatedToPlayerId,
            handId: validatedToHandId,
            position: i,
          };
        }
      }
      return result;
    },

    moveCardsToPlayer: (
      cardIds: (CardId | string)[],
      toPlayerId: PlayerId | string,
      handId: HandId | string,
    ) => {
      const validatedCardIds = assertCardIds(cardIds);
      const validatedPlayerId = assertPlayerId(toPlayerId);
      const validatedHandId = assertHandId(handId);

      const result = cardApi.moveCardsToPlayer(
        validatedCardIds,
        validatedPlayerId,
        validatedHandId,
      );
      if (!result.success) {
        throw new Error(`Move cards to player failed: ${result.errorMessage}`);
      }
      // Update component locations for cards in player's hand
      for (let i = 0; i < result.playerHand.length; i++) {
        const cardId = result.playerHand[i];
        if (cardId) {
          state.componentLocations[cardId] = {
            type: "InHand",
            playerId: validatedPlayerId,
            handId: validatedHandId,
            position: i,
          };
        }
      }
      return result;
    },

    transferOwnership: (
      cardId: CardId | string,
      toPlayer: PlayerId | string,
    ) => {
      const result = cardApi.transferOwnership(
        assertCardId(cardId),
        assertPlayerId(toPlayer),
      );
      if (!result.success) {
        throw new Error(`Transfer ownership failed: ${result.errorMessage}`);
      }
      // Update card ownership
      if (result.cardId && result.newOwnerId) {
        state.ownerOfCard[result.cardId] = result.newOwnerId;
      }
      return result;
    },

    unassignOwnership: (cardId: CardId | string) => {
      const result = cardApi.unassignOwnership(assertCardId(cardId));
      if (!result.success) {
        throw new Error(`Unassign ownership failed: ${result.errorMessage}`);
      }
      // Remove card ownership
      if (result.cardId) {
        state.ownerOfCard[result.cardId] = null;
      }
      return result;
    },
  };
}

/**
 * Wrap DeckApi methods to automatically apply results to GameState
 */
function wrapDeckApi(deckApi: DeckApi, state: GameState): DeckApi {
  return {
    addCards: (deckId: DeckId | string, cardIds: (CardId | string)[]) => {
      const validatedDeckId = assertDeckId(deckId);
      const validatedCardIds = assertCardIds(cardIds);
      const result = deckApi.addCards(validatedDeckId, validatedCardIds);
      if (!result.success) {
        throw new Error(`Add cards to deck failed: ${result.errorMessage}`);
      }
      // Update component locations for all cards in deck
      for (let i = 0; i < result.updatedCardsInDeck.length; i++) {
        const cardId = result.updatedCardsInDeck[i];
        if (cardId) {
          state.componentLocations[cardId] = {
            type: "InDeck",
            deckId: validatedDeckId,
            playedBy: null,
            position: i,
          };
        }
      }
      return result;
    },

    moveCardsFromDeckToDeck: (
      fromDeckId: DeckId | string,
      toDeckId: DeckId | string,
    ) => {
      const validatedFromDeckId = assertDeckId(fromDeckId);
      const validatedToDeckId = assertDeckId(toDeckId);
      const result = deckApi.moveCardsFromDeckToDeck(
        validatedFromDeckId,
        validatedToDeckId,
      );
      if (!result.success) {
        throw new Error(
          `Move cards between decks failed: ${result.errorMessage}`,
        );
      }
      // Update component locations for cards in source deck
      for (let i = 0; i < result.fromDeck.length; i++) {
        const cardId = result.fromDeck[i];
        if (cardId) {
          state.componentLocations[cardId] = {
            type: "InDeck",
            deckId: validatedFromDeckId,
            playedBy: null,
            position: i,
          };
        }
      }
      // Update component locations for cards in destination deck
      for (let i = 0; i < result.toDeck.length; i++) {
        const cardId = result.toDeck[i];
        if (cardId) {
          state.componentLocations[cardId] = {
            type: "InDeck",
            deckId: validatedToDeckId,
            playedBy: null,
            position: i,
          };
        }
      }
      return result;
    },

    moveCardsFromDeckToPlayer: (
      deckId: DeckId | string,
      playerId: PlayerId | string,
      handId: HandId | string,
      count: number,
    ) => {
      const validatedDeckId = assertDeckId(deckId);
      const validatedPlayerId = assertPlayerId(playerId);
      const validatedHandId = assertHandId(handId);

      const result = deckApi.moveCardsFromDeckToPlayer(
        validatedDeckId,
        validatedPlayerId,
        validatedHandId,
        count,
      );
      if (!result.success) {
        throw new Error(`Deal cards to player failed: ${result.errorMessage}`);
      }
      // Update component locations for remaining cards in deck
      for (let i = 0; i < result.updatedCardsInDeck.length; i++) {
        const cardId = result.updatedCardsInDeck[i];
        if (cardId) {
          state.componentLocations[cardId] = {
            type: "InDeck",
            deckId: validatedDeckId,
            playedBy: null,
            position: i,
          };
        }
      }
      // Update component locations for cards in player's hand
      for (let i = 0; i < result.updatedPlayerHand.length; i++) {
        const cardId = result.updatedPlayerHand[i];
        if (cardId) {
          state.componentLocations[cardId] = {
            type: "InHand",
            playerId: validatedPlayerId,
            handId: validatedHandId,
            position: i,
          };
        }
      }
      return result;
    },

    removeCard: (deckId: DeckId | string, cardId: CardId | string) => {
      const validatedDeckId = assertDeckId(deckId);
      const validatedCardId = assertCardId(cardId);
      const result = deckApi.removeCard(validatedDeckId, validatedCardId);
      if (!result.success) {
        throw new Error(`Remove card from deck failed: ${result.errorMessage}`);
      }

      // Set removed card to Detached
      state.componentLocations[validatedCardId] = { type: "Detached" };

      // Update component locations for remaining cards in deck
      for (let i = 0; i < result.updatedCardsInDeck.length; i++) {
        const cardId = result.updatedCardsInDeck[i];
        if (cardId) {
          state.componentLocations[cardId] = {
            type: "InDeck",
            deckId: validatedDeckId,
            playedBy: null,
            position: i,
          };
        }
      }
      return result;
    },

    shuffle: (deckId: DeckId | string) => {
      const validatedDeckId = assertDeckId(deckId);
      const result = deckApi.shuffle(validatedDeckId);
      if (!result.success) {
        throw new Error(`Shuffle deck failed: ${result.errorMessage}`);
      }

      for (let i = 0; i < result.updatedCardsInDeck.length; i++) {
        const cardId = result.updatedCardsInDeck[i];
        if (cardId) {
          state.componentLocations[cardId] = {
            type: "InDeck",
            deckId: validatedDeckId,
            playedBy: null,
            position: i,
          };
        }
      }
      return result;
    },
  };
}

/**
 * Wrap DieApi methods to automatically apply results to GameState
 */
function wrapDieApi(dieApi: DieApi, state: GameState): DieApi {
  return {
    roll: (dieId: DieId) => {
      const result = dieApi.roll(dieId);
      if (!result.success) {
        throw new Error(`Roll die failed: ${result.errorMessage}`);
      }
      // Update die state
      if (result.updatedDie) {
        state.dice[dieId] = result.updatedDie;
      }
      return result;
    },

    setValue: (dieId: DieId, newValue: number | undefined) => {
      const result = dieApi.setValue(dieId, newValue);
      if (!result.success) {
        throw new Error(`Set die value failed: ${result.errorMessage}`);
      }
      // Update die state
      if (result.updatedDie) {
        state.dice[dieId] = result.updatedDie;
      }
      return result;
    },
  };
}

/**
 * Wrap GameApi methods to automatically apply results to GameState
 */
function wrapGameApi(gameApi: GameApi, state: GameState): GameApi {
  return {
    advanceTurn: () => {
      const result = gameApi.advanceTurn();
      if (!result.success) {
        throw new Error(`Failed to advance turn: ${result.errorMessage}`);
      }
      if (result.newPlayerId) {
        state.currentPlayerIds = [result.newPlayerId];
      }
      return result;
    },

    declareWinner: (winnerPlayerId: PlayerId | string, reason: string) => {
      const result = gameApi.declareWinner(
        assertPlayerId(winnerPlayerId),
        reason,
      );
      if (!result.success) {
        throw new Error(`Declare winner failed: ${result.errorMessage}`);
      }

      return result;
    },

    endGame: () => {
      const result = gameApi.endGame();
      if (!result.success) {
        throw new Error(`End game failed: ${result.errorMessage}`);
      }

      return result;
    },

    setNextPlayer: (nextPlayerId: PlayerId | string) => {
      const result = gameApi.setNextPlayer(assertPlayerId(nextPlayerId));
      if (!result.success) {
        throw new Error(`Set next player failed: ${result.errorMessage}`);
      }
      // Update current player - clears all and sets single player
      if (result.newPlayerId) {
        state.currentPlayerIds = [result.newPlayerId];
      }
      return result;
    },

    setActivePlayers: (playerIds: (PlayerId | string)[]) => {
      const validatedPlayerIds = playerIds.map((id) => assertPlayerId(id));
      const result = gameApi.setActivePlayers(validatedPlayerIds);
      if (!result.success) {
        throw new Error(`Set active players failed: ${result.errorMessage}`);
      }
      // Update current players
      state.currentPlayerIds = result.playerIds.map((playerId) =>
        assertPlayerId(playerId),
      );
      return result;
    },
  };
}

/**
 * Wrap GlobalStateApi methods to automatically apply results to GameState
 */
function wrapGlobalStateApi(
  globalStateApi: GlobalStateApi,
  state: GameState,
): WrappedGlobalStateApi {
  return {
    setGlobalState: (newState: GlobalState) => {
      const result = globalStateApi.setGlobalState(newState);
      if (!result.success) {
        throw new Error(`Set global state failed: ${result.errorMessage}`);
      }
      // Merge new state into global variables
      Object.assign(state.globalVariables, result.newState);
      return result;
    },

    setPlayerState: (playerId: PlayerId | string, newState: PlayerState) => {
      const result = globalStateApi.setPlayerState(
        assertPlayerId(playerId),
        newState,
      );
      if (!result.success) {
        throw new Error(`Set player state failed: ${result.errorMessage}`);
      }
      // Update player state
      if (result.playerId) {
        state.playerVariables[result.playerId] = result.newState;
      }
      return result;
    },

    patchGlobalState: (partialState: Partial<GlobalState>) => {
      const currentState = state.globalVariables;
      const merged: GlobalState = { ...currentState, ...partialState };
      const result = globalStateApi.setGlobalState(merged);
      if (!result.success) {
        throw new Error(`Patch global state failed: ${result.errorMessage}`);
      }
      Object.assign(state.globalVariables, result.newState);
      return result;
    },

    patchPlayerState: (
      playerId: PlayerId | string,
      partialState: Partial<PlayerState>,
    ) => {
      const validatedPlayerId = assertPlayerId(playerId);
      const currentState = state.playerVariables[validatedPlayerId];
      const merged: PlayerState = { ...currentState, ...partialState };
      const result = globalStateApi.setPlayerState(validatedPlayerId, merged);
      if (!result.success) {
        throw new Error(`Patch player state failed: ${result.errorMessage}`);
      }
      if (result.playerId) {
        state.playerVariables[result.playerId] = result.newState;
      }
      return result;
    },
  };
}

/**
 * Wrap KvApi methods to automatically apply results to GameState.
 * KvApi is for internal game logic storage only - UI cannot access these values.
 * Use globalStateApi or playerStateApi if UI needs to display the data.
 */
function wrapKvApi(kvApi: KvApi, state: GameState): KvApi {
  return {
    set: (key: string, value: JsonElement) => {
      const result = kvApi.set(key, value);
      if (!result.success) {
        throw new Error(
          `KV set failed for key '${key}': ${result.errorMessage}`,
        );
      }
      // Update local state for immediate read-after-write consistency
      state.kvStore[key] = value;
      return result;
    },

    get: (key: string) => {
      const result = kvApi.get(key);
      if (!result.success) {
        throw new Error(
          `KV get failed for key '${key}': ${result.errorMessage}`,
        );
      }
      return result;
    },

    delete: (key: string) => {
      const result = kvApi.delete(key);
      if (!result.success) {
        throw new Error(
          `KV delete failed for key '${key}': ${result.errorMessage}`,
        );
      }
      // Update local state
      delete state.kvStore[key];
      return result;
    },

    has: (key: string) => {
      return kvApi.has(key);
    },

    keys: () => {
      return kvApi.keys();
    },
  };
}

/**
 * Wrap ResourceApi methods to automatically apply results to GameState.
 */
function wrapResourceApi(
  resourceApi: ResourceApi,
  state: GameState,
): ResourceApi {
  return {
    canAfford: (playerId: PlayerId | string, cost: ResourceCost) => {
      return resourceApi.canAfford(assertPlayerId(playerId), cost);
    },

    deduct: (playerId: PlayerId | string, cost: ResourceCost) => {
      const validatedPlayerId = assertPlayerId(playerId);
      const result = resourceApi.deduct(validatedPlayerId, cost);
      if (!result.success) {
        throw new Error(`Deduct resources failed: ${result.errorMessage}`);
      }
      // Update local state
      if (result.updatedAmounts) {
        state.playerResources[validatedPlayerId] = result.updatedAmounts
          .amounts as Record<ResourceId, number>;
      }
      return result;
    },

    add: (playerId: PlayerId | string, resources: ResourceCost) => {
      const validatedPlayerId = assertPlayerId(playerId);
      const result = resourceApi.add(validatedPlayerId, resources);
      if (!result.success) {
        throw new Error(`Add resources failed: ${result.errorMessage}`);
      }
      // Update local state
      if (result.updatedAmounts) {
        state.playerResources[validatedPlayerId] = result.updatedAmounts
          .amounts as Record<ResourceId, number>;
      }
      return result;
    },

    transfer: (
      fromPlayerId: PlayerId | string,
      toPlayerId: PlayerId | string,
      resources: ResourceCost,
    ) => {
      const validatedFromPlayerId = assertPlayerId(fromPlayerId);
      const validatedToPlayerId = assertPlayerId(toPlayerId);
      const result = resourceApi.transfer(
        validatedFromPlayerId,
        validatedToPlayerId,
        resources,
      );
      if (!result.success) {
        throw new Error(`Transfer resources failed: ${result.errorMessage}`);
      }
      // Update local state for target player
      if (result.updatedAmounts) {
        state.playerResources[validatedToPlayerId] = result.updatedAmounts
          .amounts as Record<ResourceId, number>;
      }
      // Deduct transferred resources from source player's local state
      const fromPlayerResources = state.playerResources[validatedFromPlayerId];
      if (fromPlayerResources && resources.amounts) {
        for (const [resourceId, amount] of Object.entries(resources.amounts)) {
          if (amount !== undefined) {
            const currentAmount =
              fromPlayerResources[resourceId as ResourceId] ?? 0;
            fromPlayerResources[resourceId as ResourceId] =
              currentAmount - amount;
          }
        }
      }
      return result;
    },

    setAmount: (
      playerId: PlayerId | string,
      resourceId: ResourceId | string,
      amount: number,
    ) => {
      const validatedPlayerId = assertPlayerId(playerId);
      const validatedResourceId = assertResourceId(resourceId);
      const result = resourceApi.setAmount(
        validatedPlayerId,
        validatedResourceId,
        amount,
      );
      if (!result.success) {
        throw new Error(`Set resource amount failed: ${result.errorMessage}`);
      }
      // Update local state
      if (result.updatedAmounts) {
        state.playerResources[validatedPlayerId] = result.updatedAmounts
          .amounts as Record<ResourceId, number>;
      }
      return result;
    },

    getAmount: (
      playerId: PlayerId | string,
      resourceId: ResourceId | string,
    ) => {
      return resourceApi.getAmount(
        assertPlayerId(playerId),
        assertResourceId(resourceId),
      );
    },

    getAllAmounts: (playerId: PlayerId | string) => {
      return resourceApi.getAllAmounts(assertPlayerId(playerId));
    },

    getMissing: (playerId: PlayerId | string, cost: ResourceCost) => {
      return resourceApi.getMissing(assertPlayerId(playerId), cost);
    },
  };
}

/**
 * Wrap BoardApi methods to automatically throw on failures and apply state changes.
 * Board API is composed of nested APIs for each board type.
 */

/**
 * Wrap HexBoardApi methods to automatically throw on failures and apply state changes.
 */
function wrapHexBoardApi(hexApi: HexBoardApi, state: GameState): HexBoardApi {
  const updateTileState = (boardId: BoardId, tile: HexTileState) => {
    const board = state.hexBoards[boardId];
    if (board) {
      board.tiles[tile.id] = tile;
    }
  };

  const updateEdgeState = (boardId: BoardId, edge: HexEdgeState) => {
    const board = state.hexBoards[boardId];
    if (board) {
      const existingIndex = board.edges.findIndex((e) => e.id === edge.id);
      if (existingIndex >= 0) {
        board.edges[existingIndex] = edge;
      } else {
        board.edges.push(edge);
      }
    }
  };

  const updateVertexState = (boardId: BoardId, vertex: HexVertexState) => {
    const board = state.hexBoards[boardId];
    if (board) {
      const existingIndex = board.vertices.findIndex((v) => v.id === vertex.id);
      if (existingIndex >= 0) {
        board.vertices[existingIndex] = vertex;
      } else {
        board.vertices.push(vertex);
      }
    }
  };

  return {
    placeEdge: (boardId, hex1, hex2) => {
      const result = hexApi.placeEdge(boardId, hex1, hex2);
      if (!result.success) {
        throw new Error(`Place hex edge failed: ${result.errorMessage}`);
      }
      if (result.updatedEdge) {
        updateEdgeState(boardId, result.updatedEdge);
      }
      return result;
    },
    placeVertex: (boardId, hex1, hex2, hex3) => {
      const result = hexApi.placeVertex(boardId, hex1, hex2, hex3);
      if (!result.success) {
        throw new Error(`Place hex vertex failed: ${result.errorMessage}`);
      }
      if (result.updatedVertex) {
        updateVertexState(boardId, result.updatedVertex);
      }
      return result;
    },
    setTilePosition: (boardId, tileId, q, r) => {
      const result = hexApi.setTilePosition(boardId, tileId, q, r);
      if (!result.success) {
        throw new Error(`Set tile position failed: ${result.errorMessage}`);
      }
      if (result.updatedTile) {
        updateTileState(boardId, result.updatedTile);
      }
      return result;
    },
    updateEdge: (boardId, edgeId, owner, typeId, properties) => {
      const result = hexApi.updateEdge(
        boardId,
        edgeId,
        owner,
        typeId,
        properties,
      );
      if (!result.success) {
        throw new Error(`Update hex edge failed: ${result.errorMessage}`);
      }
      if (result.updatedEdge) {
        updateEdgeState(boardId, result.updatedEdge);
      }
      return result;
    },
    updateTile: (boardId, tileId, owner, typeId, label, properties) => {
      const result = hexApi.updateTile(
        boardId,
        tileId,
        owner,
        typeId,
        label,
        properties,
      );
      if (!result.success) {
        throw new Error(`Update hex tile failed: ${result.errorMessage}`);
      }
      if (result.updatedTile) {
        updateTileState(boardId, result.updatedTile);
      }
      return result;
    },
    updateVertex: (boardId, vertexId, owner, typeId, properties) => {
      const result = hexApi.updateVertex(
        boardId,
        vertexId,
        owner,
        typeId,
        properties,
      );
      if (!result.success) {
        throw new Error(`Update hex vertex failed: ${result.errorMessage}`);
      }
      if (result.updatedVertex) {
        updateVertexState(boardId, result.updatedVertex);
      }
      return result;
    },
    shuffleTilePositions: (boardId, tileIds) => {
      const result = hexApi.shuffleTilePositions(boardId, tileIds);
      if (!result.success) {
        throw new Error(
          `Shuffle tile positions failed: ${result.errorMessage}`,
        );
      }
      // Update all tiles in state
      if (result.updatedTiles) {
        for (const tile of result.updatedTiles) {
          updateTileState(boardId, tile);
        }
      }
      return result;
    },
  };
}

/**
 * Wrap NetworkBoardApi methods to automatically throw on failures and apply state changes.
 */
function wrapNetworkBoardApi(
  networkApi: NetworkBoardApi,
  state: GameState,
): NetworkBoardApi {
  const updateNodeState = (boardId: BoardId, node: NetworkNodeState) => {
    const board = state.networkBoards[boardId];
    if (board) {
      board.nodes[node.id] = node;
    }
  };

  const updateEdgeState = (boardId: BoardId, edge: NetworkEdgeState) => {
    const board = state.networkBoards[boardId];
    if (board) {
      const existingIndex = board.edges.findIndex((e) => e.id === edge.id);
      if (existingIndex >= 0) {
        board.edges[existingIndex] = edge;
      } else {
        board.edges.push(edge);
      }
    }
  };

  const updatePieceState = (
    boardId: BoardId,
    pieceId: PieceId,
    piece: NetworkPieceState | null,
  ) => {
    const board = state.networkBoards[boardId];
    if (board) {
      if (piece) {
        board.pieces[pieceId] = piece;
      } else {
        delete board.pieces[pieceId];
      }
    }
  };

  return {
    movePiece: (boardId, pieceId, toNodeId) => {
      const result = networkApi.movePiece(boardId, pieceId, toNodeId);
      if (!result.success) {
        throw new Error(`Move network piece failed: ${result.errorMessage}`);
      }
      if (result.updatedPiece) {
        updatePieceState(boardId, pieceId, result.updatedPiece);
      }
      return result;
    },
    placeEdge: (boardId, from, to) => {
      const result = networkApi.placeEdge(boardId, from, to);
      if (!result.success) {
        throw new Error(`Place network edge failed: ${result.errorMessage}`);
      }
      if (result.updatedEdge) {
        updateEdgeState(boardId, result.updatedEdge);
      }
      return result;
    },
    removePiece: (boardId, pieceId) => {
      const result = networkApi.removePiece(boardId, pieceId);
      if (!result.success) {
        throw new Error(`Remove network piece failed: ${result.errorMessage}`);
      }
      // Remove piece from state (updatedPiece will be null)
      updatePieceState(boardId, pieceId, null);
      return result;
    },
    setNodePosition: (boardId, nodeId, x, y) => {
      const result = networkApi.setNodePosition(boardId, nodeId, x, y);
      if (!result.success) {
        throw new Error(`Set node position failed: ${result.errorMessage}`);
      }
      if (result.updatedNode) {
        updateNodeState(boardId, result.updatedNode);
      }
      return result;
    },
    updateEdge: (boardId, edgeId, owner, typeId, label, properties) => {
      const result = networkApi.updateEdge(
        boardId,
        edgeId,
        owner,
        typeId,
        label,
        properties,
      );
      if (!result.success) {
        throw new Error(`Update network edge failed: ${result.errorMessage}`);
      }
      if (result.updatedEdge) {
        updateEdgeState(boardId, result.updatedEdge);
      }
      return result;
    },
    updateNode: (boardId, nodeId, owner, typeId, label, properties) => {
      const result = networkApi.updateNode(
        boardId,
        nodeId,
        owner,
        typeId,
        label,
        properties,
      );
      if (!result.success) {
        throw new Error(`Update network node failed: ${result.errorMessage}`);
      }
      if (result.updatedNode) {
        updateNodeState(boardId, result.updatedNode);
      }
      return result;
    },
    shuffleNodePositions: (boardId, nodeIds) => {
      const result = networkApi.shuffleNodePositions(boardId, nodeIds);
      if (!result.success) {
        throw new Error(
          `Shuffle node positions failed: ${result.errorMessage}`,
        );
      }
      // Update all nodes in state
      if (result.updatedNodes) {
        for (const node of result.updatedNodes) {
          updateNodeState(boardId, node);
        }
      }
      return result;
    },
  };
}

/**
 * Wrap SquareBoardApi methods to automatically throw on failures and apply state changes.
 */
function wrapSquareBoardApi(
  squareApi: SquareBoardApi,
  state: GameState,
): SquareBoardApi {
  const cellKey = (row: number, col: number): string => `${row}-${col}`;

  const updateCellState = (boardId: BoardId, cell: SquareCellState) => {
    const board = state.squareBoards[boardId];
    if (board) {
      board.cells[cellKey(cell.row, cell.col)] = cell;
    }
  };

  const updatePieceState = (
    boardId: BoardId,
    pieceId: PieceId,
    piece: SquarePieceState | null,
  ) => {
    const board = state.squareBoards[boardId];
    if (board) {
      if (piece) {
        board.pieces[pieceId] = piece;
      } else {
        delete board.pieces[pieceId];
      }
    }
  };

  return {
    movePiece: (boardId, pieceId, toRow, toCol) => {
      const result = squareApi.movePiece(boardId, pieceId, toRow, toCol);
      if (!result.success) {
        throw new Error(`Move square piece failed: ${result.errorMessage}`);
      }
      if (result.updatedPiece) {
        updatePieceState(boardId, pieceId, result.updatedPiece);
      }
      return result;
    },
    placePiece: (boardId, pieceId, row, col, typeId, owner) => {
      const result = squareApi.placePiece(
        boardId,
        pieceId,
        row,
        col,
        typeId,
        owner,
      );
      if (!result.success) {
        throw new Error(`Place square piece failed: ${result.errorMessage}`);
      }
      if (result.updatedPiece) {
        updatePieceState(boardId, pieceId, result.updatedPiece);
      }
      return result;
    },
    removePiece: (boardId, pieceId) => {
      const result = squareApi.removePiece(boardId, pieceId);
      if (!result.success) {
        throw new Error(`Remove square piece failed: ${result.errorMessage}`);
      }
      // Remove piece from state (updatedPiece will be null)
      updatePieceState(boardId, pieceId, null);
      return result;
    },
    updateCell: (boardId, row, col, owner, typeId, properties) => {
      const result = squareApi.updateCell(
        boardId,
        row,
        col,
        owner,
        typeId,
        properties,
      );
      if (!result.success) {
        throw new Error(`Update square cell failed: ${result.errorMessage}`);
      }
      if (result.updatedCell) {
        updateCellState(boardId, result.updatedCell);
      }
      return result;
    },
  };
}

/**
 * Wrap TrackBoardApi methods to automatically throw on failures and apply state changes.
 */
function wrapTrackBoardApi(
  trackApi: TrackBoardApi,
  state: GameState,
): TrackBoardApi {
  const updateSpaceState = (boardId: BoardId, space: TrackSpaceState) => {
    const board = state.trackBoards[boardId];
    if (board) {
      board.spaces[space.id] = space;
    }
  };

  const updatePieceState = (
    boardId: BoardId,
    pieceId: PieceId,
    piece: TrackPieceState | null,
  ) => {
    const board = state.trackBoards[boardId];
    if (board) {
      if (piece) {
        board.pieces[pieceId] = piece;
      } else {
        delete board.pieces[pieceId];
      }
    }
  };

  return {
    movePiece: (boardId, pieceId, toSpaceId) => {
      const result = trackApi.movePiece(boardId, pieceId, toSpaceId);
      if (!result.success) {
        throw new Error(`Move track piece failed: ${result.errorMessage}`);
      }
      if (result.updatedPiece) {
        updatePieceState(boardId, pieceId, result.updatedPiece);
      }
      return result;
    },
    placePiece: (boardId, pieceId, spaceId, typeId, owner) => {
      const result = trackApi.placePiece(
        boardId,
        pieceId,
        spaceId,
        typeId,
        owner,
      );
      if (!result.success) {
        throw new Error(`Place track piece failed: ${result.errorMessage}`);
      }
      if (result.updatedPiece) {
        updatePieceState(boardId, pieceId, result.updatedPiece);
      }
      return result;
    },
    removePiece: (boardId, pieceId) => {
      const result = trackApi.removePiece(boardId, pieceId);
      if (!result.success) {
        throw new Error(`Remove track piece failed: ${result.errorMessage}`);
      }
      // Remove piece from state (updatedPiece will be null)
      updatePieceState(boardId, pieceId, null);
      return result;
    },
    setSpacePosition: (boardId, spaceId, index, x, y, nextSpaces) => {
      const result = trackApi.setSpacePosition(
        boardId,
        spaceId,
        index,
        x,
        y,
        nextSpaces,
      );
      if (!result.success) {
        throw new Error(`Set space position failed: ${result.errorMessage}`);
      }
      if (result.updatedSpace) {
        updateSpaceState(boardId, result.updatedSpace);
      }
      return result;
    },
    updateSpace: (boardId, spaceId, owner, typeId, name, properties) => {
      const result = trackApi.updateSpace(
        boardId,
        spaceId,
        owner,
        typeId,
        name,
        properties,
      );
      if (!result.success) {
        throw new Error(`Update track space failed: ${result.errorMessage}`);
      }
      if (result.updatedSpace) {
        updateSpaceState(boardId, result.updatedSpace);
      }
      return result;
    },
  };
}
