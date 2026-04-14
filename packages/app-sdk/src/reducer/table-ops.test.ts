import { describe, expect, test } from "bun:test";
import {
  getComponentsOnEdge,
  getHexBoard,
  getEdge,
  getHexSpace,
  getHexSpaceAt,
  getVertex,
  getAdjacentSpaces,
  getBoard,
  getBoardsByTypeId,
  getComponentsOnVertex,
  getContainer,
  getIncidentEdges,
  getIncidentVertices,
  getSpace,
  getSpaceDistance,
  getSpaceEdges,
  getSpaceVertices,
  getComponentsInContainer,
  getComponentsOnSpace,
  getRelatedSpaces,
  getSquareBoard,
  getSquareDistance,
  getSquareNeighbors,
  getSquareSpace,
  getSquareSpaceAt,
  getTiledBoard,
  getSpacesByTypeId,
  moveCardBetweenSharedZones,
  moveComponentToContainer,
  moveComponentToEdge,
  moveComponentToSpace,
  moveComponentToVertex,
  type RuntimeTableRecord,
} from "../reducer";

function createSpatialTable(): RuntimeTableRecord {
  return {
    playerOrder: ["player-1", "player-2"],
    zones: {
      shared: {
        "draw-deck": ["card-1"],
        "special-deck": [],
        supply: ["piece-1", "die-1"],
      },
      perPlayer: {},
      visibility: {
        "draw-deck": "public",
        "special-deck": "public",
        supply: "public",
      },
      cardSetIdsByZoneId: {
        "draw-deck": ["main"],
        "special-deck": ["special"],
      },
    },
    decks: {
      "draw-deck": ["card-1"],
      "special-deck": [],
      supply: ["piece-1", "die-1"],
    },
    hands: {},
    handVisibility: {},
    cards: {
      "card-1": {
        id: "card-1",
        cardSetId: "main",
        cardType: "card",
        properties: {},
      },
    },
    pieces: {
      "piece-1": {
        id: "piece-1",
        pieceTypeId: "token",
        properties: {},
      },
    },
    componentLocations: {
      "card-1": {
        type: "InDeck",
        deckId: "draw-deck",
        playedBy: null,
        position: 0,
      },
      "piece-1": {
        type: "InZone",
        zoneId: "supply",
        playedBy: null,
        position: 0,
      },
      "die-1": {
        type: "InZone",
        zoneId: "supply",
        playedBy: null,
        position: 1,
      },
    },
    ownerOfCard: {
      "card-1": null,
    },
    visibility: {
      "card-1": { faceUp: true },
    },
    resources: {},
    boards: {
      byId: {
        "main-board": {
          id: "main-board",
          baseId: "main-board",
          layout: "generic",
          typeId: "track",
          scope: "shared",
          fields: {},
          spaces: {
            "space-a": {
              id: "space-a",
              typeId: "slot",
              fields: {},
              zoneId: "main-board::space::space-a",
            },
            "space-b": {
              id: "space-b",
              typeId: "slot",
              fields: {},
              zoneId: "main-board::space::space-b",
            },
          },
          relations: [
            {
              typeId: "adjacent",
              fromSpaceId: "space-a",
              toSpaceId: "space-b",
              directed: false,
              fields: {},
            },
          ],
          containers: {
            "market-row": {
              id: "market-row",
              name: "Market Row",
              host: { type: "board" },
              allowedCardSetIds: ["main"],
              zoneId: "main-board::container::market-row",
              fields: {},
            },
            "restricted-row": {
              id: "restricted-row",
              name: "Restricted Row",
              host: { type: "board" },
              allowedCardSetIds: ["special"],
              zoneId: "main-board::container::restricted-row",
              fields: {},
            },
          },
        },
        "hex-board": {
          id: "hex-board",
          baseId: "hex-board",
          layout: "hex",
          typeId: "map",
          scope: "shared",
          orientation: "pointy-top",
          fields: {},
          spaces: {
            "tile-a": {
              id: "tile-a",
              q: 0,
              r: 0,
              typeId: "forest",
              fields: {},
            },
            "tile-b": {
              id: "tile-b",
              q: 1,
              r: 0,
              typeId: "desert",
              fields: {},
            },
          },
          relations: [
            {
              id: "tile-a$$tile-b",
              typeId: "adjacent",
              fromSpaceId: "tile-a",
              toSpaceId: "tile-b",
              directed: false,
              fields: {},
            },
          ],
          containers: {},
          edges: [
            {
              id: "tile-a$$tile-b",
              spaceIds: ["tile-a", "tile-b"],
              typeId: null,
              label: null,
              ownerId: null,
              fields: {},
            },
          ],
          vertices: [
            {
              id: "tile-a$$tile-a$$tile-b",
              spaceIds: ["tile-a", "tile-a", "tile-b"],
              typeId: null,
              label: null,
              fields: {},
            },
          ],
        },
        "square-board": {
          id: "square-board",
          baseId: "square-board",
          layout: "square",
          typeId: "grid",
          scope: "shared",
          fields: {},
          spaces: {
            "cell-a1": {
              id: "cell-a1",
              row: 0,
              col: 0,
              typeId: "start",
              fields: {},
            },
            "cell-a2": {
              id: "cell-a2",
              row: 0,
              col: 1,
              typeId: "path",
              fields: {},
            },
            "cell-b1": {
              id: "cell-b1",
              row: 1,
              col: 0,
              typeId: "path",
              fields: {},
            },
            "cell-b2": {
              id: "cell-b2",
              row: 1,
              col: 1,
              typeId: "goal",
              fields: {},
            },
          },
          relations: [
            {
              id: "square-edge:a1-a2",
              typeId: "adjacent",
              fromSpaceId: "cell-a1",
              toSpaceId: "cell-a2",
              directed: false,
              fields: {},
            },
            {
              id: "square-edge:a1-b1",
              typeId: "adjacent",
              fromSpaceId: "cell-a1",
              toSpaceId: "cell-b1",
              directed: false,
              fields: {},
            },
            {
              id: "square-edge:a2-b2",
              typeId: "adjacent",
              fromSpaceId: "cell-a2",
              toSpaceId: "cell-b2",
              directed: false,
              fields: {},
            },
            {
              id: "square-edge:b1-b2",
              typeId: "adjacent",
              fromSpaceId: "cell-b1",
              toSpaceId: "cell-b2",
              directed: false,
              fields: {},
            },
          ],
          containers: {
            "cell-storage": {
              id: "cell-storage",
              name: "Cell Storage",
              host: { type: "board" },
              zoneId: "square-board::container::cell-storage",
              fields: {},
            },
          },
          edges: [
            {
              id: "square-edge:a1-a2",
              spaceIds: ["cell-a1", "cell-a2"],
              typeId: "road-slot",
              label: null,
              ownerId: null,
              fields: {},
            },
            {
              id: "square-edge:a1-b1",
              spaceIds: ["cell-a1", "cell-b1"],
              typeId: null,
              label: null,
              ownerId: null,
              fields: {},
            },
          ],
          vertices: [
            {
              id: "square-vertex:center",
              spaceIds: ["cell-a1", "cell-a2", "cell-b1", "cell-b2"],
              typeId: "corner",
              label: null,
              ownerId: null,
              fields: {},
            },
          ],
        },
      },
      hex: {},
      square: {},
      network: {},
      track: {},
    },
    dice: {
      "die-1": {
        id: "die-1",
        dieTypeId: "d6",
        sides: 6,
        properties: {},
      },
    },
  };
}

describe("table ops spatial helpers", () => {
  test("board helpers expose typed board metadata and adjacency for generic and hex boards", () => {
    const table = createSpatialTable();

    expect(getBoard(table, "main-board").layout).toBe("generic");
    expect(getBoard(table, "main-board").typeId).toBe("track");
    expect(getHexBoard(table, "hex-board").layout).toBe("hex");
    expect(getHexSpace(table, "hex-board", "tile-a").q).toBe(0);
    expect(getHexSpaceAt(table, "hex-board", 1, 0)?.id).toBe("tile-b");
    expect(getEdge(table, "hex-board", "tile-a$$tile-b").spaceIds).toEqual([
      "tile-a",
      "tile-b",
    ]);
    expect(
      getVertex(table, "hex-board", "tile-a$$tile-a$$tile-b").spaceIds,
    ).toEqual(["tile-a", "tile-a", "tile-b"]);
    expect(getSpace(table, "main-board", "space-a").zoneId).toBe(
      "main-board::space::space-a",
    );
    expect(getContainer(table, "main-board", "market-row").name).toBe(
      "Market Row",
    );
    expect(getBoardsByTypeId(table, "track")).toEqual(["main-board"]);
    expect(getSpacesByTypeId(table, "main-board", "slot")).toEqual([
      "space-a",
      "space-b",
    ]);
    expect(getSpacesByTypeId(table, "hex-board", "forest")).toEqual(["tile-a"]);
    expect(
      getRelatedSpaces(table, "main-board", "space-a", "adjacent"),
    ).toEqual(["space-b"]);
    expect(getAdjacentSpaces(table, "main-board", "space-a")).toEqual([
      "space-b",
    ]);
    expect(getAdjacentSpaces(table, "hex-board", "tile-a")).toEqual(["tile-b"]);
    expect(getTiledBoard(table, "hex-board").layout).toBe("hex");
  });

  test("shared tiled helpers expose square topology, range, and incidence", () => {
    const table = createSpatialTable();

    expect(getSquareBoard(table, "square-board").layout).toBe("square");
    expect(getSquareSpace(table, "square-board", "cell-a1").row).toBe(0);
    expect(getSquareSpaceAt(table, "square-board", 1, 1)?.id).toBe("cell-b2");
    expect(getAdjacentSpaces(table, "square-board", "cell-a1")).toEqual([
      "cell-a2",
      "cell-b1",
    ]);
    expect(getSquareNeighbors(table, "square-board", "cell-a1")).toEqual([
      "cell-a2",
      "cell-b1",
    ]);
    expect(
      getSquareNeighbors(table, "square-board", "cell-a1", {
        mode: "diagonal",
      }),
    ).toEqual(["cell-b2"]);
    expect(
      getSquareNeighbors(table, "square-board", "cell-a1", {
        mode: "all",
      }),
    ).toEqual(["cell-a2", "cell-b1", "cell-b2"]);
    expect(getSpaceDistance(table, "square-board", "cell-a1", "cell-b2")).toBe(
      2,
    );
    expect(getSquareDistance(table, "square-board", "cell-a1", "cell-b2")).toBe(
      2,
    );
    expect(
      getSquareDistance(table, "square-board", "cell-a1", "cell-b2", {
        metric: "chebyshev",
      }),
    ).toBe(1);
    expect(getSpaceEdges(table, "square-board", "cell-a1")).toEqual([
      "square-edge:a1-a2",
      "square-edge:a1-b1",
    ]);
    expect(getSpaceVertices(table, "square-board", "cell-a1")).toEqual([
      "square-vertex:center",
    ]);
    expect(
      getIncidentEdges(table, "square-board", "square-vertex:center"),
    ).toEqual(["square-edge:a1-a2", "square-edge:a1-b1"]);
    expect(
      getIncidentVertices(table, "square-board", "square-edge:a1-a2"),
    ).toEqual(["square-vertex:center"]);
  });

  test("card moves respect allowedCardSetIds for shared zones and board containers", () => {
    const table = createSpatialTable();

    expect(() =>
      moveCardBetweenSharedZones({
        table,
        fromZoneId: "draw-deck",
        toZoneId: "special-deck",
        cardId: "card-1",
      }),
    ).toThrow("cannot enter zone 'special-deck'");

    expect(() =>
      moveComponentToContainer(table, "card-1", "main-board", "restricted-row"),
    ).toThrow("cannot enter container 'restricted-row'");
  });

  test("moveComponentToSpace and moveComponentToContainer re-home cards, pieces, and dice", () => {
    const table = createSpatialTable();

    const withCardInContainer = moveComponentToContainer(
      table,
      "card-1",
      "main-board",
      "market-row",
    );
    const withPieceOnSpace = moveComponentToSpace(
      withCardInContainer,
      "piece-1",
      "main-board",
      "space-a",
    );
    const withDieOnSpace = moveComponentToSpace(
      withPieceOnSpace,
      "die-1",
      "main-board",
      "space-a",
    );

    expect(withDieOnSpace.decks["draw-deck"]).toEqual([]);
    expect(withDieOnSpace.zones.shared.supply).toEqual([]);
    expect(withDieOnSpace.componentLocations["card-1"]).toEqual({
      type: "InContainer",
      boardId: "main-board",
      containerId: "market-row",
      position: 0,
    });
    expect(withDieOnSpace.componentLocations["piece-1"]).toEqual({
      type: "OnSpace",
      boardId: "main-board",
      spaceId: "space-a",
      position: 0,
    });
    expect(withDieOnSpace.componentLocations["die-1"]).toEqual({
      type: "OnSpace",
      boardId: "main-board",
      spaceId: "space-a",
      position: 1,
    });
    expect(
      getComponentsInContainer(withDieOnSpace, "main-board", "market-row"),
    ).toEqual(["card-1"]);
    expect(
      getComponentsOnSpace(withDieOnSpace, "main-board", "space-a"),
    ).toEqual(["piece-1", "die-1"]);
  });

  test("moveComponentToEdge and moveComponentToVertex validate targets and preserve stable ordering", () => {
    const table = createSpatialTable();

    expect(() =>
      moveComponentToEdge(
        table,
        "piece-1",
        "square-board",
        "missing-edge" as never,
      ),
    ).toThrow("Unknown edge");
    expect(() =>
      moveComponentToVertex(
        table,
        "piece-1",
        "square-board",
        "missing-vertex" as never,
      ),
    ).toThrow("Unknown vertex");

    const withPieceOnEdge = moveComponentToEdge(
      table,
      "piece-1",
      "square-board",
      "square-edge:a1-a2",
    );
    const withDieOnEdge = moveComponentToEdge(
      withPieceOnEdge,
      "die-1",
      "square-board",
      "square-edge:a1-a2",
    );
    const withPieceOnVertex = moveComponentToVertex(
      withDieOnEdge,
      "piece-1",
      "square-board",
      "square-vertex:center",
    );

    expect(
      getComponentsOnEdge(withDieOnEdge, "square-board", "square-edge:a1-a2"),
    ).toEqual(["piece-1", "die-1"]);
    expect(
      getComponentsOnVertex(
        withPieceOnVertex,
        "square-board",
        "square-vertex:center",
      ),
    ).toEqual(["piece-1"]);
  });

  test("moving a component out of a slot reindexes only matching structured slot hosts", () => {
    const table = createSpatialTable();
    table.pieces["piece-2"] = {
      id: "piece-2",
      pieceTypeId: "token",
      properties: {},
    };
    table.pieces["piece-3"] = {
      id: "piece-3",
      pieceTypeId: "token",
      properties: {},
    };
    table.componentLocations["piece-1"] = {
      type: "InSlot",
      host: {
        kind: "piece",
        id: "host-a",
      },
      slotId: "worker-rest",
      position: 0,
    };
    table.componentLocations["piece-2"] = {
      type: "InSlot",
      host: {
        kind: "piece",
        id: "host-a",
      },
      slotId: "worker-rest",
      position: 1,
    };
    table.componentLocations["piece-3"] = {
      type: "InSlot",
      host: {
        kind: "die",
        id: "host-a",
      },
      slotId: "worker-rest",
      position: 0,
    };

    const moved = moveComponentToSpace(
      table,
      "piece-1",
      "main-board",
      "space-a",
    );

    expect(moved.componentLocations["piece-1"]).toEqual({
      type: "OnSpace",
      boardId: "main-board",
      spaceId: "space-a",
      position: 0,
    });
    expect(moved.componentLocations["piece-2"]).toEqual({
      type: "InSlot",
      host: {
        kind: "piece",
        id: "host-a",
      },
      slotId: "worker-rest",
      position: 0,
    });
    expect(moved.componentLocations["piece-3"]).toEqual({
      type: "InSlot",
      host: {
        kind: "die",
        id: "host-a",
      },
      slotId: "worker-rest",
      position: 0,
    });
  });
});
