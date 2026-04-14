import {
  assertCardAllowedInContainer,
  assertCardAllowedInZone,
  cloneRuntimeTable,
  ensureArray,
  getComponentsInContainer,
  getComponentsOnSpace,
} from "./table-ops";
import { nextRandomInt } from "./rng";
import type {
  RuntimeComponentLocation,
  RuntimeRngState,
  RuntimeTableRecord,
  SetupBootstrapContainerRef,
  SetupBootstrapDestinationRef,
  SetupBootstrapPerPlayerContainerTemplateRef,
  SetupBootstrapStep,
} from "./model";

type StatefulBootstrapContext = {
  table: RuntimeTableRecord;
  runtime: {
    rng: RuntimeRngState;
  };
};

type ResolvedSharedZoneRef = {
  kind: "sharedZone";
  zoneId: string;
};

type ResolvedPlayerZoneRef = {
  kind: "playerZone";
  zoneId: string;
  playerId: string;
};

type ResolvedBoardZoneRef = {
  kind: "container";
  boardId: string;
  containerId: string;
  zoneId: string;
};

type ResolvedBoardSpaceRef = {
  kind: "space";
  boardId: string;
  spaceId: string;
  zoneId: string;
};

type ResolvedContainerRef =
  | ResolvedSharedZoneRef
  | ResolvedPlayerZoneRef
  | ResolvedBoardZoneRef
  | ResolvedBoardSpaceRef;

function isCardComponent(
  table: RuntimeTableRecord,
  componentId: string,
): boolean {
  return componentId in table.cards;
}

function resolveRuntimeBoardId(
  table: RuntimeTableRecord,
  boardId: string,
  playerId?: string,
): string {
  if (playerId) {
    const perPlayerBoardId = `${boardId}:${playerId}`;
    if (table.boards.byId[perPlayerBoardId]) {
      return perPlayerBoardId;
    }
  }
  if (table.boards.byId[boardId]) {
    return boardId;
  }
  throw new Error(`Unknown board '${boardId}'.`);
}

function resolveContainerRef(
  table: RuntimeTableRecord,
  ref: SetupBootstrapContainerRef | SetupBootstrapDestinationRef,
): ResolvedContainerRef {
  if (ref.type === "sharedZone") {
    return {
      kind: "sharedZone",
      zoneId: ref.zoneId,
    };
  }

  if (ref.type === "playerZone") {
    return {
      kind: "playerZone",
      zoneId: ref.zoneId,
      playerId: ref.playerId,
    };
  }

  if (ref.type === "sharedBoardContainer") {
    const board = table.boards.byId[resolveRuntimeBoardId(table, ref.boardId)];
    const container = board?.containers[ref.containerId];
    if (!container) {
      throw new Error(
        `Unknown board container '${ref.containerId}' on board '${ref.boardId}'.`,
      );
    }
    return {
      kind: "container",
      boardId: board.id,
      containerId: ref.containerId,
      zoneId: container.zoneId,
    };
  }

  if (ref.type === "playerBoardContainer") {
    const board =
      table.boards.byId[
        resolveRuntimeBoardId(table, ref.boardId, ref.playerId)
      ];
    const container = board?.containers[ref.containerId];
    if (!container) {
      throw new Error(
        `Unknown board container '${ref.containerId}' on board '${ref.boardId}' for '${ref.playerId}'.`,
      );
    }
    return {
      kind: "container",
      boardId: board.id,
      containerId: ref.containerId,
      zoneId: container.zoneId,
    };
  }

  if (ref.type === "sharedBoardSpace") {
    const board = table.boards.byId[resolveRuntimeBoardId(table, ref.boardId)];
    if (!board) {
      throw new Error(`Unknown board '${ref.boardId}'.`);
    }
    const space = board?.spaces[ref.spaceId];
    if (!space?.zoneId) {
      throw new Error(
        `Board space '${ref.spaceId}' on board '${ref.boardId}' has no container zone.`,
      );
    }
    return {
      kind: "space",
      boardId: board.id,
      spaceId: ref.spaceId,
      zoneId: space.zoneId,
    };
  }

  const board =
    table.boards.byId[resolveRuntimeBoardId(table, ref.boardId, ref.playerId)];
  if (!board) {
    throw new Error(
      `Unknown board '${ref.boardId}' for player '${ref.playerId}'.`,
    );
  }
  const space = board?.spaces[ref.spaceId];
  if (!space?.zoneId) {
    throw new Error(
      `Board space '${ref.spaceId}' on board '${ref.boardId}' for '${ref.playerId}' has no container zone.`,
    );
  }
  return {
    kind: "space",
    boardId: board.id,
    spaceId: ref.spaceId,
    zoneId: space.zoneId,
  };
}

function readContainerComponents(
  table: RuntimeTableRecord,
  ref: ResolvedContainerRef,
): string[] {
  if (ref.kind === "sharedZone") {
    return [
      ...ensureArray(table.zones.shared[ref.zoneId] ?? table.decks[ref.zoneId]),
    ];
  }

  if (ref.kind === "playerZone") {
    return [
      ...ensureArray(
        table.zones.perPlayer[ref.zoneId]?.[ref.playerId] ??
          table.hands[ref.zoneId]?.[ref.playerId],
      ),
    ];
  }

  if (ref.kind === "space") {
    return getComponentsOnSpace(table, ref.boardId, ref.spaceId);
  }

  return getComponentsInContainer(table, ref.boardId, ref.containerId);
}

function sharedZoneLocationFor(
  table: RuntimeTableRecord,
  componentId: string,
  zoneId: string,
  position: number,
): RuntimeComponentLocation {
  if (isCardComponent(table, componentId)) {
    return {
      type: "InDeck",
      deckId: zoneId,
      playedBy: null,
      position,
    };
  }

  return {
    type: "InZone",
    zoneId,
    playedBy: null,
    position,
  };
}

function updateCardVisibilityForZone(
  table: RuntimeTableRecord,
  componentId: string,
  ref: ResolvedContainerRef,
): void {
  if (!isCardComponent(table, componentId)) {
    return;
  }

  if (ref.kind === "playerZone") {
    const visibility = table.zones.visibility[ref.zoneId];
    table.ownerOfCard[componentId] = ref.playerId;
    table.visibility[componentId] =
      visibility === "all" || visibility === "public"
        ? { faceUp: true }
        : { faceUp: false, visibleTo: [ref.playerId] };
    return;
  }

  if (ref.kind === "sharedZone") {
    const visibility = table.zones.visibility[ref.zoneId];
    if (visibility === "hidden" || visibility === "ownerOnly") {
      table.visibility[componentId] = { faceUp: false };
      return;
    }
    table.visibility[componentId] = { faceUp: true };
  }
}

function writeContainerComponents(
  table: RuntimeTableRecord,
  ref: ResolvedContainerRef,
  componentIds: readonly string[],
): void {
  if (ref.kind === "sharedZone") {
    componentIds.forEach((componentId) => {
      assertCardAllowedInZone(table, ref.zoneId, componentId);
    });
    table.decks[ref.zoneId] = [...componentIds];
    table.zones.shared[ref.zoneId] = [...componentIds];
    componentIds.forEach((componentId, index) => {
      table.componentLocations[componentId] = sharedZoneLocationFor(
        table,
        componentId,
        ref.zoneId,
        index,
      );
      updateCardVisibilityForZone(table, componentId, ref);
    });
    return;
  }

  if (ref.kind === "playerZone") {
    componentIds.forEach((componentId) => {
      assertCardAllowedInZone(table, ref.zoneId, componentId);
    });
    const handByPlayer = { ...(table.hands[ref.zoneId] ?? {}) };
    handByPlayer[ref.playerId] = [...componentIds];
    table.hands[ref.zoneId] = handByPlayer;

    const zoneByPlayer = { ...(table.zones.perPlayer[ref.zoneId] ?? {}) };
    zoneByPlayer[ref.playerId] = [...componentIds];
    table.zones.perPlayer[ref.zoneId] = zoneByPlayer;

    componentIds.forEach((componentId, index) => {
      table.componentLocations[componentId] = {
        type: "InHand",
        handId: ref.zoneId,
        playerId: ref.playerId,
        position: index,
      };
      updateCardVisibilityForZone(table, componentId, ref);
    });
    return;
  }

  if (ref.kind === "space") {
    componentIds.forEach((componentId, index) => {
      table.componentLocations[componentId] = {
        type: "OnSpace",
        boardId: ref.boardId,
        spaceId: ref.spaceId,
        position: index,
      };
    });
    return;
  }

  componentIds.forEach((componentId) => {
    assertCardAllowedInContainer(
      table,
      ref.boardId,
      ref.containerId,
      componentId,
    );
  });
  componentIds.forEach((componentId, index) => {
    table.componentLocations[componentId] = {
      type: "InContainer",
      boardId: ref.boardId,
      containerId: ref.containerId,
      position: index,
    };
  });
}

function selectMovedComponents(
  current: readonly string[],
  step: Extract<SetupBootstrapStep, { type: "move" }>,
): string[] {
  if (step.componentIds && typeof step.count === "number") {
    throw new Error(
      "Setup bootstrap move step cannot specify both count and componentIds.",
    );
  }

  if (step.componentIds) {
    const missing = step.componentIds.filter(
      (componentId) => !current.includes(componentId),
    );
    if (missing.length > 0) {
      throw new Error(
        `Setup bootstrap move step references missing components: ${missing.join(", ")}`,
      );
    }
    return [...step.componentIds];
  }

  if (typeof step.count === "number") {
    return current.slice(0, step.count);
  }

  return [...current];
}

function resolveDealTargetRef(
  table: RuntimeTableRecord,
  ref: SetupBootstrapPerPlayerContainerTemplateRef,
  playerId: string,
): ResolvedContainerRef {
  if (ref.type === "playerZone") {
    return {
      kind: "playerZone",
      zoneId: ref.zoneId,
      playerId,
    };
  }

  const board =
    table.boards.byId[resolveRuntimeBoardId(table, ref.boardId, playerId)];
  const container = board?.containers[ref.containerId];
  if (!container) {
    throw new Error(
      `Unknown board container '${ref.containerId}' on board '${ref.boardId}' for '${playerId}'.`,
    );
  }
  return {
    kind: "container",
    boardId: board.id,
    containerId: ref.containerId,
    zoneId: container.zoneId,
  };
}

export function applySetupBootstrap<State extends StatefulBootstrapContext>(
  state: State,
  steps: readonly SetupBootstrapStep[],
): State {
  if (steps.length === 0) {
    return state;
  }

  const nextTable = cloneRuntimeTable(state.table);
  let nextRng = state.runtime.rng;

  for (const step of steps) {
    if (step.type === "shuffle") {
      const container = resolveContainerRef(nextTable, step.container);
      const shuffled = readContainerComponents(nextTable, container);
      for (let lastIndex = shuffled.length - 1; lastIndex > 0; lastIndex -= 1) {
        const [swapIndex, updatedRng] = nextRandomInt(lastIndex + 1, nextRng);
        nextRng = updatedRng;
        const current = shuffled[lastIndex]!;
        shuffled[lastIndex] = shuffled[swapIndex]!;
        shuffled[swapIndex] = current;
      }
      writeContainerComponents(nextTable, container, shuffled);
      continue;
    }

    if (step.type === "move") {
      const from = resolveContainerRef(nextTable, step.from);
      const to = resolveContainerRef(nextTable, step.to);
      const currentFrom = readContainerComponents(nextTable, from);
      const moved = selectMovedComponents(currentFrom, step);
      const remaining = currentFrom.filter(
        (componentId) => !moved.includes(componentId),
      );
      const currentTo = readContainerComponents(nextTable, to);

      writeContainerComponents(nextTable, from, remaining);
      writeContainerComponents(nextTable, to, [...currentTo, ...moved]);
      continue;
    }

    const from = resolveContainerRef(nextTable, step.from);
    if (from.kind === "playerZone") {
      throw new Error(
        "Setup bootstrap deal steps require a shared source container.",
      );
    }
    const playerIds = step.playerIds
      ? [...step.playerIds]
      : [...nextTable.playerOrder];
    let sourceComponents = readContainerComponents(nextTable, from);

    for (const playerId of playerIds) {
      if (sourceComponents.length === 0) {
        break;
      }
      const dealt = sourceComponents.slice(0, step.count);
      if (dealt.length === 0) {
        break;
      }
      sourceComponents = sourceComponents.slice(dealt.length);
      const target = resolveDealTargetRef(nextTable, step.to, playerId);
      const currentTo = readContainerComponents(nextTable, target);
      writeContainerComponents(nextTable, target, [...currentTo, ...dealt]);
    }

    writeContainerComponents(nextTable, from, sourceComponents);
  }

  return {
    ...state,
    table: nextTable,
    runtime: {
      ...state.runtime,
      rng: nextRng,
    },
  };
}
