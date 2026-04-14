import type {
  BoardContainerIdOfTable,
  BoardIdOfTable,
  BoardTypeIdOfTable,
  CardIdOfState,
  ComponentIdOfTable,
  CompatibleCardIdForHandAndDeck,
  DeckCardsOfTable,
  DeckIdOfTable,
  HandCardsOfTable,
  HandIdOfTable,
  HexBoardIdOfTable,
  HexEdgeIdOfTable,
  HexEdgeTypeIdOfTable,
  HexSpaceIdOfTable,
  HexSpaceTypeIdOfTable,
  HexVertexIdOfTable,
  HexVertexTypeIdOfTable,
  PlayerIdOfState,
  PlayerIdOfTable,
  PlayerZoneIdOfTable,
  RelationTypeIdOfTable,
  RuntimeBoardState,
  RuntimeComponentLocation,
  RuntimeSquareBoardState,
  RuntimeTableRecord,
  SquareBoardIdOfTable,
  SquareEdgeIdOfTable,
  SquareEdgeTypeIdOfTable,
  SquareSpaceIdOfTable,
  SquareSpaceTypeIdOfTable,
  SquareVertexIdOfTable,
  SquareVertexTypeIdOfTable,
  SharedZoneIdOfTable,
  SpaceIdOfTable,
  SpaceTypeIdOfTable,
  TableOfState,
  TiledBoardIdOfTable,
  TiledEdgeIdOfTable,
  TiledEdgeTypeIdOfTable,
  TiledVertexIdOfTable,
  TiledVertexTypeIdOfTable,
} from "./model";

export function ensureArray<T>(value: readonly T[] | T[] | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

function locationPosition(location: RuntimeComponentLocation): number {
  return "position" in location && typeof location.position === "number"
    ? location.position
    : Number.MAX_SAFE_INTEGER;
}

function orderedComponentIdsForLocation(
  table: RuntimeTableRecord,
  predicate: (location: RuntimeComponentLocation) => boolean,
): string[] {
  return Object.entries(table.componentLocations)
    .filter(([, location]) => predicate(location))
    .sort(
      (left, right) => locationPosition(left[1]) - locationPosition(right[1]),
    )
    .map(([componentId]) => componentId);
}

function allowedCardSetIdsForZone(
  table: RuntimeTableRecord,
  zoneId: string,
): readonly string[] {
  return table.zones.cardSetIdsByZoneId?.[zoneId] ?? [];
}

export function assertCardAllowedInZone<Table extends RuntimeTableRecord>(
  table: Table,
  zoneId: string,
  componentId: string,
): void {
  const card = table.cards[componentId];
  if (!card) {
    return;
  }

  const allowedCardSetIds = allowedCardSetIdsForZone(table, zoneId);
  if (
    allowedCardSetIds.length > 0 &&
    !allowedCardSetIds.includes(card.cardSetId)
  ) {
    throw new Error(
      `Card '${componentId}' from card set '${card.cardSetId}' cannot enter zone '${zoneId}'.`,
    );
  }
}

function cloneRuntimeBoardState(board: RuntimeBoardState): RuntimeBoardState {
  if (board.layout !== "generic") {
    return {
      ...board,
      fields: { ...board.fields },
      spaces: Object.fromEntries(
        Object.entries(board.spaces).map(([spaceId, space]) => [
          spaceId,
          {
            ...space,
            fields: { ...space.fields },
          },
        ]),
      ),
      relations: board.relations.map((relation) => ({
        ...relation,
        fields: { ...relation.fields },
      })),
      containers: Object.fromEntries(
        Object.entries(board.containers).map(([containerId, container]) => [
          containerId,
          {
            ...container,
            fields: { ...container.fields },
          },
        ]),
      ),
      edges: board.edges.map((edge) => ({
        ...edge,
        spaceIds: [...edge.spaceIds],
        fields: { ...edge.fields },
      })),
      vertices: board.vertices.map((vertex) => ({
        ...vertex,
        spaceIds: [...vertex.spaceIds],
        fields: { ...vertex.fields },
      })),
    };
  }

  return {
    ...board,
    fields: { ...board.fields },
    spaces: Object.fromEntries(
      Object.entries(board.spaces).map(([spaceId, space]) => [
        spaceId,
        {
          ...space,
          fields: { ...space.fields },
        },
      ]),
    ),
    relations: board.relations.map((relation) => ({
      ...relation,
      fields: { ...relation.fields },
    })),
    containers: Object.fromEntries(
      Object.entries(board.containers).map(([containerId, container]) => [
        containerId,
        {
          ...container,
          fields: { ...container.fields },
        },
      ]),
    ),
  };
}

export function cloneRuntimeTable<Table extends RuntimeTableRecord>(
  table: Table,
): Table {
  return {
    ...table,
    zones: {
      shared: Object.fromEntries(
        Object.entries(table.zones.shared).map(([zoneId, componentIds]) => [
          zoneId,
          [...componentIds],
        ]),
      ) as Table["zones"]["shared"],
      perPlayer: Object.fromEntries(
        Object.entries(table.zones.perPlayer).map(([zoneId, players]) => [
          zoneId,
          Object.fromEntries(
            Object.entries(players).map(([playerId, componentIds]) => [
              playerId,
              [...componentIds],
            ]),
          ),
        ]),
      ) as Table["zones"]["perPlayer"],
      visibility: { ...table.zones.visibility },
      cardSetIdsByZoneId: table.zones.cardSetIdsByZoneId
        ? Object.fromEntries(
            Object.entries(table.zones.cardSetIdsByZoneId).map(
              ([zoneId, cardSetIds]) => [zoneId, [...cardSetIds]],
            ),
          )
        : table.zones.cardSetIdsByZoneId,
    } as Table["zones"],
    decks: Object.fromEntries(
      Object.entries(table.decks).map(([deckId, cards]) => [
        deckId,
        [...cards],
      ]),
    ) as Table["decks"],
    hands: Object.fromEntries(
      Object.entries(table.hands).map(([handId, players]) => [
        handId,
        Object.fromEntries(
          Object.entries(players).map(([playerId, cards]) => [
            playerId,
            [...cards],
          ]),
        ),
      ]),
    ) as Table["hands"],
    handVisibility: { ...table.handVisibility },
    pieces: Object.fromEntries(
      Object.entries(table.pieces).map(([pieceId, piece]) => [
        pieceId,
        { ...piece },
      ]),
    ) as Table["pieces"],
    componentLocations: { ...table.componentLocations },
    ownerOfCard: { ...table.ownerOfCard },
    visibility: { ...table.visibility },
    resources: Object.fromEntries(
      Object.entries(table.resources).map(([playerId, resources]) => [
        playerId,
        { ...resources },
      ]),
    ) as Table["resources"],
    boards: {
      ...table.boards,
      byId: Object.fromEntries(
        Object.entries(table.boards.byId).map(([boardId, board]) => [
          boardId,
          cloneRuntimeBoardState(board),
        ]),
      ),
      hex: Object.fromEntries(
        Object.entries(table.boards.hex ?? {}).map(([boardId, board]) => [
          boardId,
          cloneRuntimeBoardState(board),
        ]),
      ),
      square: Object.fromEntries(
        Object.entries(table.boards.square ?? {}).map(([boardId, board]) => [
          boardId,
          cloneRuntimeBoardState(board),
        ]),
      ),
    } as Table["boards"],
    dice: Object.fromEntries(
      Object.entries(table.dice).map(([dieId, die]) => [dieId, { ...die }]),
    ) as Table["dice"],
  };
}

function syncSharedZoneWithDeck<
  Table extends RuntimeTableRecord,
  ZoneId extends SharedZoneIdOfTable<Table>,
>(table: Table, zoneId: ZoneId, nextCards: readonly string[]): void {
  table.decks[zoneId] = [...nextCards] as Table["decks"][ZoneId];
  table.zones.shared[zoneId] = [
    ...nextCards,
  ] as Table["zones"]["shared"][ZoneId];
}

function syncPlayerZoneWithHand<
  Table extends RuntimeTableRecord,
  ZoneId extends PlayerZoneIdOfTable<Table>,
  PlayerId extends PlayerIdOfTable<Table>,
>(
  table: Table,
  zoneId: ZoneId,
  playerId: PlayerId,
  nextCards: readonly string[],
): void {
  const handByPlayer = { ...(table.hands[zoneId] ?? {}) };
  handByPlayer[playerId] = [...nextCards] as Table["hands"][ZoneId][PlayerId];
  table.hands[zoneId] = handByPlayer;

  const zoneByPlayer = { ...(table.zones.perPlayer[zoneId] ?? {}) };
  zoneByPlayer[playerId] = [
    ...nextCards,
  ] as Table["zones"]["perPlayer"][ZoneId][PlayerId];
  table.zones.perPlayer[zoneId] = zoneByPlayer;
}

function reindexSpaceOccupants<
  Table extends RuntimeTableRecord,
  BoardId extends BoardIdOfTable<Table>,
  SpaceId extends SpaceIdOfTable<Table, BoardId>,
>(table: Table, boardId: BoardId, spaceId: SpaceId): void {
  getComponentsOnSpace(table, boardId, spaceId).forEach(
    (componentId, index) => {
      const location = table.componentLocations[componentId];
      if (location?.type === "OnSpace") {
        table.componentLocations[componentId] = {
          ...location,
          position: index,
        };
      }
    },
  );
}

function reindexContainerOccupants<
  Table extends RuntimeTableRecord,
  BoardId extends BoardIdOfTable<Table>,
  ContainerId extends BoardContainerIdOfTable<Table, BoardId>,
>(table: Table, boardId: BoardId, containerId: ContainerId): void {
  getComponentsInContainer(table, boardId, containerId).forEach(
    (componentId, index) => {
      const location = table.componentLocations[componentId];
      if (location?.type === "InContainer") {
        table.componentLocations[componentId] = {
          ...location,
          position: index,
        };
      }
    },
  );
}

function reindexEdgeOccupants<
  Table extends RuntimeTableRecord,
  BoardId extends HexBoardIdOfTable<Table>,
  EdgeId extends HexEdgeIdOfTable<Table, BoardId>,
>(table: Table, boardId: BoardId, edgeId: EdgeId): void {
  orderedComponentIdsForLocation(
    table,
    (location) =>
      location.type === "OnEdge" &&
      location.boardId === boardId &&
      location.edgeId === edgeId,
  ).forEach((componentId, index) => {
    const location = table.componentLocations[componentId];
    if (location?.type === "OnEdge") {
      table.componentLocations[componentId] = {
        ...location,
        position: index,
      };
    }
  });
}

function reindexVertexOccupants<
  Table extends RuntimeTableRecord,
  BoardId extends HexBoardIdOfTable<Table>,
  VertexId extends HexVertexIdOfTable<Table, BoardId>,
>(table: Table, boardId: BoardId, vertexId: VertexId): void {
  orderedComponentIdsForLocation(
    table,
    (location) =>
      location.type === "OnVertex" &&
      location.boardId === boardId &&
      location.vertexId === vertexId,
  ).forEach((componentId, index) => {
    const location = table.componentLocations[componentId];
    if (location?.type === "OnVertex") {
      table.componentLocations[componentId] = {
        ...location,
        position: index,
      };
    }
  });
}

function reindexSlotOccupants<Table extends RuntimeTableRecord>(
  table: Table,
  host: Extract<RuntimeComponentLocation, { type: "InSlot" }>["host"],
  slotId: string,
): void {
  orderedComponentIdsForLocation(
    table,
    (location) =>
      location.type === "InSlot" &&
      location.host.kind === host.kind &&
      location.host.id === host.id &&
      location.slotId === slotId,
  ).forEach((componentId, index) => {
    const location = table.componentLocations[componentId];
    if (location?.type === "InSlot") {
      table.componentLocations[componentId] = {
        ...location,
        position: index,
      };
    }
  });
}

function removeComponentFromCurrentLocation<
  Table extends RuntimeTableRecord,
  ComponentId extends ComponentIdOfTable<Table>,
>(table: Table, componentId: ComponentId): void {
  const currentLocation = table.componentLocations[componentId];
  if (!currentLocation) {
    return;
  }

  if (currentLocation.type === "InDeck") {
    const nextCards = ensureArray(table.decks[currentLocation.deckId]).filter(
      (candidate) => candidate !== componentId,
    );
    syncSharedZoneWithDeck(
      table,
      currentLocation.deckId as SharedZoneIdOfTable<Table>,
      nextCards,
    );
    nextCards.forEach((cardId, index) => {
      const location = table.componentLocations[cardId];
      if (location?.type === "InDeck") {
        table.componentLocations[cardId] = {
          ...location,
          position: index,
        };
      }
    });
    return;
  }

  if (currentLocation.type === "InHand") {
    const nextCards = ensureArray(
      table.hands[currentLocation.handId]?.[currentLocation.playerId],
    ).filter((candidate) => candidate !== componentId);
    syncPlayerZoneWithHand(
      table,
      currentLocation.handId as PlayerZoneIdOfTable<Table>,
      currentLocation.playerId as PlayerIdOfTable<Table>,
      nextCards,
    );
    nextCards.forEach((cardId, index) => {
      const location = table.componentLocations[cardId];
      if (location?.type === "InHand") {
        table.componentLocations[cardId] = {
          ...location,
          position: index,
        };
      }
    });
    return;
  }

  if (currentLocation.type === "OnSpace") {
    delete table.componentLocations[componentId];
    reindexSpaceOccupants(
      table,
      currentLocation.boardId as BoardIdOfTable<Table>,
      currentLocation.spaceId as SpaceIdOfTable<Table, BoardIdOfTable<Table>>,
    );
    return;
  }

  if (currentLocation.type === "InZone") {
    if (currentLocation.zoneId in table.zones.shared) {
      const nextComponents = ensureArray(
        table.zones.shared[currentLocation.zoneId],
      ).filter((candidate) => candidate !== componentId);
      syncSharedZoneWithDeck(
        table,
        currentLocation.zoneId as SharedZoneIdOfTable<Table>,
        nextComponents,
      );
      nextComponents.forEach((currentComponentId, index) => {
        const location = table.componentLocations[currentComponentId];
        if (location?.type === "InZone") {
          table.componentLocations[currentComponentId] = {
            ...location,
            position: index,
          };
        }
      });
    }
    delete table.componentLocations[componentId];
    return;
  }

  if (currentLocation.type === "InContainer") {
    delete table.componentLocations[componentId];
    reindexContainerOccupants(
      table,
      currentLocation.boardId as BoardIdOfTable<Table>,
      currentLocation.containerId as BoardContainerIdOfTable<
        Table,
        BoardIdOfTable<Table>
      >,
    );
    return;
  }

  if (currentLocation.type === "OnEdge") {
    delete table.componentLocations[componentId];
    reindexEdgeOccupants(
      table,
      currentLocation.boardId as HexBoardIdOfTable<Table>,
      currentLocation.edgeId as HexEdgeIdOfTable<
        Table,
        HexBoardIdOfTable<Table>
      >,
    );
    return;
  }

  if (currentLocation.type === "OnVertex") {
    delete table.componentLocations[componentId];
    reindexVertexOccupants(
      table,
      currentLocation.boardId as HexBoardIdOfTable<Table>,
      currentLocation.vertexId as HexVertexIdOfTable<
        Table,
        HexBoardIdOfTable<Table>
      >,
    );
    return;
  }

  if (currentLocation.type === "InSlot") {
    delete table.componentLocations[componentId];
    reindexSlotOccupants(table, currentLocation.host, currentLocation.slotId);
    return;
  }

  delete table.componentLocations[componentId];
}

function appendToDeck<
  Table extends RuntimeTableRecord,
  DeckId extends DeckIdOfTable<Table>,
>(
  table: Table,
  deckId: DeckId,
  cardId: DeckCardsOfTable<Table, DeckId>[number],
  playedBy: PlayerIdOfTable<Table> | null = null,
): Table {
  const nextTable = cloneRuntimeTable(table);
  const deckCards = [
    ...ensureArray(nextTable.decks[deckId]),
  ] as DeckCardsOfTable<Table, DeckId>;
  assertCardAllowedInZone(nextTable, deckId, cardId);
  deckCards.push(cardId);
  syncSharedZoneWithDeck(nextTable, deckId, deckCards);
  nextTable.componentLocations[cardId] = {
    type: "InDeck",
    deckId,
    playedBy,
    position: deckCards.length - 1,
  };
  nextTable.ownerOfCard[cardId] = playedBy;
  nextTable.visibility[cardId] = {
    faceUp: true,
  };
  return nextTable;
}

function removeFromDeck<
  Table extends RuntimeTableRecord,
  DeckId extends DeckIdOfTable<Table>,
>(
  table: Table,
  deckId: DeckId,
  cardId: DeckCardsOfTable<Table, DeckId>[number],
): Table {
  const nextTable = cloneRuntimeTable(table);
  const remaining = ensureArray(nextTable.decks[deckId]).filter(
    (candidate) => candidate !== cardId,
  );
  syncSharedZoneWithDeck(nextTable, deckId, remaining);
  for (const [index, currentCardId] of remaining.entries()) {
    const currentLocation = nextTable.componentLocations[currentCardId];
    if (currentLocation?.type === "InDeck") {
      nextTable.componentLocations[currentCardId] = {
        ...currentLocation,
        position: index,
      };
    }
  }
  return nextTable;
}

function moveFromHandToDeck<
  Table extends RuntimeTableRecord,
  HandId extends HandIdOfTable<Table>,
  PlayerId extends PlayerIdOfTable<Table>,
  DeckId extends DeckIdOfTable<Table>,
>(options: {
  table: Table;
  playerId: PlayerId;
  handId: HandId;
  cardId: CompatibleCardIdForHandAndDeck<Table, HandId, PlayerId, DeckId>;
  deckId: DeckId;
  playedBy?: PlayerIdOfTable<Table> | null;
}): Table {
  const nextTable = cloneRuntimeTable(options.table);
  const currentHand = ensureArray(
    nextTable.hands[options.handId]?.[options.playerId],
  ).filter((candidate) => candidate !== options.cardId) as HandCardsOfTable<
    Table,
    HandId,
    PlayerId
  >;
  syncPlayerZoneWithHand(
    nextTable,
    options.handId,
    options.playerId,
    currentHand,
  );
  for (const [index, currentCardId] of currentHand.entries()) {
    nextTable.componentLocations[currentCardId] = {
      type: "InHand",
      handId: options.handId,
      playerId: options.playerId,
      position: index,
    };
  }
  nextTable.ownerOfCard[options.cardId] = options.playedBy ?? options.playerId;
  nextTable.visibility[options.cardId] = {
    faceUp: true,
  };
  return appendToDeck(
    nextTable,
    options.deckId,
    options.cardId,
    options.playedBy ?? options.playerId,
  );
}

export function setActivePlayers<
  State extends { flow: { activePlayers: PlayerIdOfState<State>[] } },
>(state: State, activePlayers: PlayerIdOfState<State>[]): State {
  return {
    ...state,
    flow: {
      ...state.flow,
      activePlayers,
    },
  };
}

export function setPhaseState<State extends { phase: object }, PhaseState>(
  state: State,
  phaseState: PhaseState,
): State {
  return {
    ...state,
    phase: phaseState,
  };
}

export function getSharedZoneCards<
  Table extends RuntimeTableRecord,
  ZoneId extends SharedZoneIdOfTable<Table>,
>(table: Table, zoneId: ZoneId): readonly string[] {
  return [...ensureArray(table.zones.shared[zoneId] ?? table.decks[zoneId])];
}

export function getPlayerZoneCards<
  Table extends RuntimeTableRecord,
  ZoneId extends PlayerZoneIdOfTable<Table>,
  PlayerId extends PlayerIdOfTable<Table>,
>(table: Table, playerId: PlayerId, zoneId: ZoneId): readonly string[] {
  return [
    ...ensureArray(
      table.zones.perPlayer[zoneId]?.[playerId] ??
        table.hands[zoneId]?.[playerId],
    ),
  ];
}

export function getBoard<
  Table extends RuntimeTableRecord,
  BoardId extends BoardIdOfTable<NoInfer<Table>>,
>(table: Table, boardId: BoardId): Table["boards"]["byId"][BoardId] {
  return table.boards.byId[boardId] as Table["boards"]["byId"][BoardId];
}

export function getHexBoard<
  Table extends RuntimeTableRecord,
  BoardId extends HexBoardIdOfTable<NoInfer<Table>>,
>(
  table: Table,
  boardId: BoardId,
): Extract<Table["boards"]["byId"][BoardId], { layout: "hex" }> {
  return getBoard(table, boardId) as Extract<
    Table["boards"]["byId"][BoardId],
    { layout: "hex" }
  >;
}

export function getTiledBoard<
  Table extends RuntimeTableRecord,
  BoardId extends TiledBoardIdOfTable<NoInfer<Table>>,
>(
  table: Table,
  boardId: BoardId,
): Extract<Table["boards"]["byId"][BoardId], { layout: "hex" | "square" }> {
  return getBoard(table, boardId) as Extract<
    Table["boards"]["byId"][BoardId],
    { layout: "hex" | "square" }
  >;
}

export function getSquareBoard<
  Table extends RuntimeTableRecord,
  BoardId extends SquareBoardIdOfTable<NoInfer<Table>>,
>(
  table: Table,
  boardId: BoardId,
): Extract<Table["boards"]["byId"][BoardId], { layout: "square" }> {
  return getBoard(table, boardId) as Extract<
    Table["boards"]["byId"][BoardId],
    { layout: "square" }
  >;
}

export function getSpace<
  Table extends RuntimeTableRecord,
  BoardId extends BoardIdOfTable<NoInfer<Table>>,
  SpaceId extends SpaceIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  spaceId: SpaceId,
): Table["boards"]["byId"][BoardId]["spaces"][SpaceId] {
  return getBoard(table, boardId).spaces[
    spaceId
  ] as Table["boards"]["byId"][BoardId]["spaces"][SpaceId];
}

export function getHexSpace<
  Table extends RuntimeTableRecord,
  BoardId extends HexBoardIdOfTable<NoInfer<Table>>,
  SpaceId extends HexSpaceIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  spaceId: SpaceId,
): Extract<
  Table["boards"]["byId"][BoardId],
  { layout: "hex" }
>["spaces"][SpaceId] {
  return getHexBoard(table, boardId).spaces[spaceId] as Extract<
    Table["boards"]["byId"][BoardId],
    { layout: "hex" }
  >["spaces"][SpaceId];
}

export function getSquareSpace<
  Table extends RuntimeTableRecord,
  BoardId extends SquareBoardIdOfTable<NoInfer<Table>>,
  SpaceId extends SquareSpaceIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  spaceId: SpaceId,
): Extract<
  Table["boards"]["byId"][BoardId],
  { layout: "square" }
>["spaces"][SpaceId] {
  return getSquareBoard(table, boardId).spaces[spaceId] as Extract<
    Table["boards"]["byId"][BoardId],
    { layout: "square" }
  >["spaces"][SpaceId];
}

export function getContainer<
  Table extends RuntimeTableRecord,
  BoardId extends BoardIdOfTable<NoInfer<Table>>,
  ContainerId extends BoardContainerIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  containerId: ContainerId,
): Table["boards"]["byId"][BoardId]["containers"][ContainerId] {
  return getBoard(table, boardId).containers[
    containerId
  ] as Table["boards"]["byId"][BoardId]["containers"][ContainerId];
}

export function assertCardAllowedInContainer<
  Table extends RuntimeTableRecord,
  BoardId extends BoardIdOfTable<NoInfer<Table>>,
  ContainerId extends BoardContainerIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  containerId: ContainerId,
  componentId: string,
): void {
  const card = table.cards[componentId];
  if (!card) {
    return;
  }

  const allowedCardSetIds =
    getContainer(table, boardId, containerId).allowedCardSetIds ?? [];
  if (
    allowedCardSetIds.length > 0 &&
    !allowedCardSetIds.includes(card.cardSetId)
  ) {
    throw new Error(
      `Card '${componentId}' from card set '${card.cardSetId}' cannot enter container '${containerId}' on board '${boardId}'.`,
    );
  }
}

export function getEdge<
  Table extends RuntimeTableRecord,
  BoardId extends TiledBoardIdOfTable<NoInfer<Table>>,
  EdgeId extends TiledEdgeIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  edgeId: EdgeId,
): Extract<
  Table["boards"]["byId"][BoardId],
  { layout: "hex" | "square" }
>["edges"][number] {
  const edge = getTiledBoard(table, boardId).edges.find(
    (candidate) => candidate.id === edgeId,
  );
  if (!edge) {
    throw new Error(`Unknown edge '${edgeId}' on board '${boardId}'.`);
  }
  return edge as Extract<
    Table["boards"]["byId"][BoardId],
    { layout: "hex" | "square" }
  >["edges"][number];
}

export function getVertex<
  Table extends RuntimeTableRecord,
  BoardId extends TiledBoardIdOfTable<NoInfer<Table>>,
  VertexId extends TiledVertexIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  vertexId: VertexId,
): Extract<
  Table["boards"]["byId"][BoardId],
  { layout: "hex" | "square" }
>["vertices"][number] {
  const vertex = getTiledBoard(table, boardId).vertices.find(
    (candidate) => candidate.id === vertexId,
  );
  if (!vertex) {
    throw new Error(`Unknown vertex '${vertexId}' on board '${boardId}'.`);
  }
  return vertex as Extract<
    Table["boards"]["byId"][BoardId],
    { layout: "hex" | "square" }
  >["vertices"][number];
}

export function getHexSpaceAt<
  Table extends RuntimeTableRecord,
  BoardId extends HexBoardIdOfTable<NoInfer<Table>>,
>(
  table: Table,
  boardId: BoardId,
  q: number,
  r: number,
):
  | Extract<
      Table["boards"]["byId"][BoardId],
      { layout: "hex" }
    >["spaces"][HexSpaceIdOfTable<NoInfer<Table>, BoardId>]
  | undefined {
  return Object.values(getHexBoard(table, boardId).spaces).find(
    (space) => space.q === q && space.r === r,
  ) as
    | Extract<
        Table["boards"]["byId"][BoardId],
        { layout: "hex" }
      >["spaces"][HexSpaceIdOfTable<NoInfer<Table>, BoardId>]
    | undefined;
}

export function getSquareSpaceAt<
  Table extends RuntimeTableRecord,
  BoardId extends SquareBoardIdOfTable<NoInfer<Table>>,
>(
  table: Table,
  boardId: BoardId,
  row: number,
  col: number,
):
  | Extract<
      Table["boards"]["byId"][BoardId],
      { layout: "square" }
    >["spaces"][SquareSpaceIdOfTable<NoInfer<Table>, BoardId>]
  | undefined {
  return Object.values(getSquareBoard(table, boardId).spaces).find(
    (space) => space.row === row && space.col === col,
  ) as
    | Extract<
        Table["boards"]["byId"][BoardId],
        { layout: "square" }
      >["spaces"][SquareSpaceIdOfTable<NoInfer<Table>, BoardId>]
    | undefined;
}

export function getSpaceEdges<
  Table extends RuntimeTableRecord,
  BoardId extends TiledBoardIdOfTable<NoInfer<Table>>,
>(
  table: Table,
  boardId: BoardId,
  spaceId: SpaceIdOfTable<NoInfer<Table>, BoardId>,
): TiledEdgeIdOfTable<Table, BoardId>[] {
  return getTiledBoard(table, boardId)
    .edges.filter((edge) => edge.spaceIds.includes(spaceId))
    .map((edge) => edge.id as TiledEdgeIdOfTable<Table, BoardId>);
}

export function getSpaceVertices<
  Table extends RuntimeTableRecord,
  BoardId extends TiledBoardIdOfTable<NoInfer<Table>>,
>(
  table: Table,
  boardId: BoardId,
  spaceId: SpaceIdOfTable<NoInfer<Table>, BoardId>,
): TiledVertexIdOfTable<Table, BoardId>[] {
  return getTiledBoard(table, boardId)
    .vertices.filter((vertex) => vertex.spaceIds.includes(spaceId))
    .map((vertex) => vertex.id as TiledVertexIdOfTable<Table, BoardId>);
}

export function getIncidentEdges<
  Table extends RuntimeTableRecord,
  BoardId extends TiledBoardIdOfTable<NoInfer<Table>>,
  VertexId extends TiledVertexIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  vertexId: VertexId,
): TiledEdgeIdOfTable<Table, BoardId>[] {
  const vertexSpaceIds = new Set(getVertex(table, boardId, vertexId).spaceIds);
  return getTiledBoard(table, boardId)
    .edges.filter((edge) =>
      edge.spaceIds.every((spaceId) => vertexSpaceIds.has(spaceId)),
    )
    .map((edge) => edge.id as TiledEdgeIdOfTable<Table, BoardId>);
}

export function getIncidentVertices<
  Table extends RuntimeTableRecord,
  BoardId extends TiledBoardIdOfTable<NoInfer<Table>>,
  EdgeId extends TiledEdgeIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  edgeId: EdgeId,
): TiledVertexIdOfTable<Table, BoardId>[] {
  const edgeSpaceIds = new Set(getEdge(table, boardId, edgeId).spaceIds);
  return getTiledBoard(table, boardId)
    .vertices.filter((vertex) =>
      Array.from(edgeSpaceIds).every((spaceId) =>
        vertex.spaceIds.includes(spaceId),
      ),
    )
    .map((vertex) => vertex.id as TiledVertexIdOfTable<Table, BoardId>);
}

export function getRelatedSpaces<
  Table extends RuntimeTableRecord,
  BoardId extends BoardIdOfTable<NoInfer<Table>>,
  SpaceId extends SpaceIdOfTable<NoInfer<Table>, BoardId>,
  TypeId extends RelationTypeIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  spaceId: SpaceId,
  relationTypeId: TypeId,
): SpaceId[] {
  const board = getBoard(table, boardId);
  const related = new Set<SpaceId>();

  for (const relation of board.relations) {
    if (relation.typeId !== relationTypeId) {
      continue;
    }
    if (relation.fromSpaceId === spaceId) {
      related.add(relation.toSpaceId as SpaceId);
      continue;
    }
    if (!relation.directed && relation.toSpaceId === spaceId) {
      related.add(relation.fromSpaceId as SpaceId);
    }
  }

  return [...related];
}

export function getAdjacentSpaces<
  Table extends RuntimeTableRecord,
  BoardId extends BoardIdOfTable<NoInfer<Table>>,
  SpaceId extends SpaceIdOfTable<NoInfer<Table>, BoardId>,
>(table: Table, boardId: BoardId, spaceId: SpaceId): SpaceId[] {
  return getRelatedSpaces(
    table,
    boardId,
    spaceId,
    "adjacent" as RelationTypeIdOfTable<NoInfer<Table>, BoardId>,
  );
}

export function getSpaceDistance<
  Table extends RuntimeTableRecord,
  BoardId extends BoardIdOfTable<NoInfer<Table>>,
  SpaceId extends SpaceIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  fromSpaceId: SpaceId,
  toSpaceId: SpaceId,
): number {
  if (fromSpaceId === toSpaceId) {
    return 0;
  }

  const visited = new Set<string>([fromSpaceId]);
  let frontier: string[] = [fromSpaceId];
  let distance = 0;

  while (frontier.length > 0) {
    distance += 1;
    const nextFrontier: string[] = [];

    for (const currentSpaceId of frontier) {
      for (const neighborId of getAdjacentSpaces(
        table,
        boardId,
        currentSpaceId as SpaceId,
      )) {
        if (neighborId === toSpaceId) {
          return distance;
        }
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          nextFrontier.push(neighborId);
        }
      }
    }

    frontier = nextFrontier;
  }

  return Number.POSITIVE_INFINITY;
}

export function getSquareNeighbors<
  Table extends RuntimeTableRecord,
  BoardId extends SquareBoardIdOfTable<NoInfer<Table>>,
  SpaceId extends SquareSpaceIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  spaceId: SpaceId,
  options: { mode?: "orthogonal" | "diagonal" | "all" } = {},
): SquareSpaceIdOfTable<Table, BoardId>[] {
  const board = getSquareBoard(table, boardId);
  const space = getSquareSpace(table, boardId, spaceId);
  const offsets: ReadonlyArray<readonly [number, number]> =
    options.mode === "diagonal"
      ? [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ]
      : options.mode === "all"
        ? [
            [-1, 0],
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
          ]
        : [
            [-1, 0],
            [0, 1],
            [1, 0],
            [0, -1],
          ];

  return offsets
    .map(([rowOffset, colOffset]) =>
      Object.values(board.spaces).find(
        (candidate) =>
          candidate.row === space.row + rowOffset &&
          candidate.col === space.col + colOffset,
      ),
    )
    .filter((candidate): candidate is typeof space => candidate != null)
    .map((candidate) => candidate.id as SquareSpaceIdOfTable<Table, BoardId>);
}

export function getSquareDistance<
  Table extends RuntimeTableRecord,
  BoardId extends SquareBoardIdOfTable<NoInfer<Table>>,
  SpaceId extends SquareSpaceIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  fromSpaceId: SpaceId,
  toSpaceId: SpaceId,
  options: { metric?: "manhattan" | "chebyshev" } = {},
): number {
  const from = getSquareSpace(table, boardId, fromSpaceId);
  const to = getSquareSpace(table, boardId, toSpaceId);
  const rowDistance = Math.abs(from.row - to.row);
  const colDistance = Math.abs(from.col - to.col);

  return options.metric === "chebyshev"
    ? Math.max(rowDistance, colDistance)
    : rowDistance + colDistance;
}

export function getBoardsByTypeId<
  Table extends RuntimeTableRecord,
  TypeId extends BoardTypeIdOfTable<NoInfer<Table>>,
>(table: Table, typeId: TypeId): BoardIdOfTable<Table>[] {
  return Object.entries(table.boards.byId)
    .filter(([, board]) => board.typeId === typeId)
    .map(([boardId]) => boardId as BoardIdOfTable<Table>);
}

export function getSpacesByTypeId<
  Table extends RuntimeTableRecord,
  BoardId extends BoardIdOfTable<NoInfer<Table>>,
  TypeId extends SpaceTypeIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  typeId: TypeId,
): SpaceIdOfTable<Table, BoardId>[] {
  return Object.entries(getBoard(table, boardId).spaces)
    .filter(([, space]) => space.typeId === typeId)
    .map(([spaceId]) => spaceId as SpaceIdOfTable<Table, BoardId>);
}

export function getEdgesByTypeId<
  Table extends RuntimeTableRecord,
  BoardId extends TiledBoardIdOfTable<NoInfer<Table>>,
  TypeId extends TiledEdgeTypeIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  typeId: TypeId,
): TiledEdgeIdOfTable<Table, BoardId>[] {
  return getTiledBoard(table, boardId)
    .edges.filter((edge) => edge.typeId === typeId)
    .map((edge) => edge.id as TiledEdgeIdOfTable<Table, BoardId>);
}

export function getVerticesByTypeId<
  Table extends RuntimeTableRecord,
  BoardId extends TiledBoardIdOfTable<NoInfer<Table>>,
  TypeId extends TiledVertexTypeIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  typeId: TypeId,
): TiledVertexIdOfTable<Table, BoardId>[] {
  return getTiledBoard(table, boardId)
    .vertices.filter((vertex) => vertex.typeId === typeId)
    .map((vertex) => vertex.id as TiledVertexIdOfTable<Table, BoardId>);
}

export function getComponentsOnSpace<
  Table extends RuntimeTableRecord,
  BoardId extends BoardIdOfTable<NoInfer<Table>>,
  SpaceId extends SpaceIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  spaceId: SpaceId,
): ComponentIdOfTable<Table>[] {
  const zoneId = getSpace(table, boardId, spaceId).zoneId;
  return orderedComponentIdsForLocation(
    table,
    (location) =>
      (location.type === "OnSpace" &&
        location.boardId === boardId &&
        location.spaceId === spaceId) ||
      (location.type === "InZone" &&
        typeof zoneId === "string" &&
        zoneId.length > 0 &&
        location.zoneId === zoneId),
  ) as ComponentIdOfTable<Table>[];
}

export function getComponentsInContainer<
  Table extends RuntimeTableRecord,
  BoardId extends BoardIdOfTable<NoInfer<Table>>,
  ContainerId extends BoardContainerIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  containerId: ContainerId,
): ComponentIdOfTable<Table>[] {
  const zoneId = getContainer(table, boardId, containerId).zoneId;
  return orderedComponentIdsForLocation(
    table,
    (location) =>
      (location.type === "InContainer" &&
        location.boardId === boardId &&
        location.containerId === containerId) ||
      (location.type === "InZone" &&
        typeof zoneId === "string" &&
        zoneId.length > 0 &&
        location.zoneId === zoneId),
  ) as ComponentIdOfTable<Table>[];
}

export function getComponentsOnEdge<
  Table extends RuntimeTableRecord,
  BoardId extends TiledBoardIdOfTable<NoInfer<Table>>,
  EdgeId extends TiledEdgeIdOfTable<NoInfer<Table>, BoardId>,
>(table: Table, boardId: BoardId, edgeId: EdgeId): ComponentIdOfTable<Table>[] {
  return orderedComponentIdsForLocation(
    table,
    (location) =>
      location.type === "OnEdge" &&
      location.boardId === boardId &&
      location.edgeId === edgeId,
  ) as ComponentIdOfTable<Table>[];
}

export function getComponentsOnVertex<
  Table extends RuntimeTableRecord,
  BoardId extends TiledBoardIdOfTable<NoInfer<Table>>,
  VertexId extends TiledVertexIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  boardId: BoardId,
  vertexId: VertexId,
): ComponentIdOfTable<Table>[] {
  return orderedComponentIdsForLocation(
    table,
    (location) =>
      location.type === "OnVertex" &&
      location.boardId === boardId &&
      location.vertexId === vertexId,
  ) as ComponentIdOfTable<Table>[];
}

export function moveComponentToSpace<
  Table extends RuntimeTableRecord,
  ComponentId extends ComponentIdOfTable<Table>,
  BoardId extends BoardIdOfTable<NoInfer<Table>>,
  SpaceId extends SpaceIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  componentId: ComponentId,
  boardId: BoardId,
  spaceId: SpaceId,
): Table {
  const nextTable = cloneRuntimeTable(table);
  const position = getComponentsOnSpace(nextTable, boardId, spaceId).length;
  removeComponentFromCurrentLocation(nextTable, componentId);
  nextTable.componentLocations[componentId] = {
    type: "OnSpace",
    boardId,
    spaceId,
    position,
  };
  return nextTable;
}

export function moveComponentToContainer<
  Table extends RuntimeTableRecord,
  ComponentId extends ComponentIdOfTable<Table>,
  BoardId extends BoardIdOfTable<NoInfer<Table>>,
  ContainerId extends BoardContainerIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  componentId: ComponentId,
  boardId: BoardId,
  containerId: ContainerId,
): Table {
  const nextTable = cloneRuntimeTable(table);
  assertCardAllowedInContainer(nextTable, boardId, containerId, componentId);
  const position = getComponentsInContainer(
    nextTable,
    boardId,
    containerId,
  ).length;
  removeComponentFromCurrentLocation(nextTable, componentId);
  nextTable.componentLocations[componentId] = {
    type: "InContainer",
    boardId,
    containerId,
    position,
  };
  return nextTable;
}

export function moveComponentToEdge<
  Table extends RuntimeTableRecord,
  ComponentId extends ComponentIdOfTable<Table>,
  BoardId extends TiledBoardIdOfTable<NoInfer<Table>>,
  EdgeId extends TiledEdgeIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  componentId: ComponentId,
  boardId: BoardId,
  edgeId: EdgeId,
): Table {
  const nextTable = cloneRuntimeTable(table);
  getEdge(nextTable, boardId, edgeId);
  const position = getComponentsOnEdge(nextTable, boardId, edgeId).length;
  removeComponentFromCurrentLocation(nextTable, componentId);
  nextTable.componentLocations[componentId] = {
    type: "OnEdge",
    boardId,
    edgeId,
    position,
  };
  return nextTable;
}

export function moveComponentToVertex<
  Table extends RuntimeTableRecord,
  ComponentId extends ComponentIdOfTable<Table>,
  BoardId extends TiledBoardIdOfTable<NoInfer<Table>>,
  VertexId extends TiledVertexIdOfTable<NoInfer<Table>, BoardId>,
>(
  table: Table,
  componentId: ComponentId,
  boardId: BoardId,
  vertexId: VertexId,
): Table {
  const nextTable = cloneRuntimeTable(table);
  getVertex(nextTable, boardId, vertexId);
  const position = getComponentsOnVertex(nextTable, boardId, vertexId).length;
  removeComponentFromCurrentLocation(nextTable, componentId);
  nextTable.componentLocations[componentId] = {
    type: "OnVertex",
    boardId,
    vertexId,
    position,
  };
  return nextTable;
}

export function moveCardFromPlayerZoneToSharedZone<
  Table extends RuntimeTableRecord,
  HandId extends PlayerZoneIdOfTable<Table>,
  PlayerId extends PlayerIdOfTable<Table>,
  DeckId extends SharedZoneIdOfTable<Table>,
>(options: {
  table: Table;
  playerId: PlayerId;
  fromZoneId: HandId;
  toZoneId: DeckId;
  cardId: CompatibleCardIdForHandAndDeck<Table, HandId, PlayerId, DeckId>;
  playedBy?: PlayerIdOfTable<Table> | null;
}): Table {
  return moveFromHandToDeck({
    table: options.table,
    playerId: options.playerId,
    handId: options.fromZoneId,
    cardId: options.cardId,
    deckId: options.toZoneId,
    playedBy: options.playedBy,
  });
}

export function moveCardBetweenSharedZones<
  Table extends RuntimeTableRecord,
  FromZoneId extends SharedZoneIdOfTable<Table>,
  ToZoneId extends SharedZoneIdOfTable<Table>,
>(options: {
  table: Table;
  fromZoneId: FromZoneId;
  toZoneId: ToZoneId;
  cardId: DeckCardsOfTable<Table, FromZoneId>[number];
  playedBy?: PlayerIdOfTable<Table> | null;
}): Table {
  const removed = removeFromDeck(
    options.table,
    options.fromZoneId,
    options.cardId,
  );
  return appendToDeck(
    removed,
    options.toZoneId,
    options.cardId as DeckCardsOfTable<Table, ToZoneId>[number],
    options.playedBy ?? null,
  );
}

export function removeCardFromSharedZone<
  Table extends RuntimeTableRecord,
  DeckId extends DeckIdOfTable<Table>,
>(
  table: Table,
  deckId: DeckId,
  cardId: DeckCardsOfTable<Table, DeckId>[number],
): Table {
  return removeFromDeck(table, deckId, cardId);
}

export function addCardToSharedZone<
  Table extends RuntimeTableRecord,
  DeckId extends DeckIdOfTable<Table>,
>(
  table: Table,
  deckId: DeckId,
  cardId: DeckCardsOfTable<Table, DeckId>[number],
  playedBy: PlayerIdOfTable<Table> | null = null,
): Table {
  return appendToDeck(table, deckId, cardId, playedBy);
}

export type { RuntimeTableRecord, TableOfState, CardIdOfState };
