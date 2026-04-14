# UI Guide: Resource Management Games

Patterns for Catan, Splendor, engine builders, trading games, and similar resource-centric games.

## Game characteristics

- Players **collect, spend, and trade resources** to build structures, buy cards, or score points.
- May involve a shared board (hex grid, network, market row) plus personal tableaux.
- Key UI signals: resource pools, affordability, available purchases, trade offers, build options.

## Recommended SDK components

### Primary

| Component                     | Usage                                                                      |
| ----------------------------- | -------------------------------------------------------------------------- |
| `ResourceCounter`             | Display each player's resource pool with icons and animated count changes. |
| `CostDisplay`                 | Show build/purchase costs with green/red affordability feedback.           |
| `ActionButton`                | "Build", "Buy", "Trade" buttons with integrated cost display.              |
| `ActionPanel` / `ActionGroup` | Organize actions by type (Build, Trade, End Turn).                         |
| `Card` / `Hand`               | Display purchasable cards or player tableau cards.                         |

### Board components (pick based on game)

| Component      | Use case                                  | Hook                       |
| -------------- | ----------------------------------------- | -------------------------- |
| `HexGrid`      | Catan-style resource hex boards           | `useHexBoard(boardId)`     |
| `NetworkGraph` | Trade route networks                      | `useNetworkBoard(boardId)` |
| `SquareGrid`   | Grid-based markets or tableaux            | `useSquareBoard(boardId)`  |
| `PlayArea`     | Market row / available cards for purchase | —                          |

### Supporting

| Component        | Usage                                                    |
| ---------------- | -------------------------------------------------------- |
| `PlayerInfo`     | Player name, score, and victory point tracker.           |
| `PhaseIndicator` | Current phase (roll, trade, build, etc.).                |
| `DiceRoller`     | For dice-based resource generation (e.g., Catan).        |
| `GameEndDisplay` | Final scores with score breakdown.                       |
| `Drawer`         | Mobile drawer for trade interface or detailed card view. |

### Hooks

| Hook                       | Usage                                                 |
| -------------------------- | ----------------------------------------------------- |
| `useMyResources()`         | Current player's resource counts.                     |
| `useHexBoard(boardId)`     | Hex board state for Catan-style games.                |
| `useNetworkBoard(boardId)` | Network/route state.                                  |
| `useSquareBoard(boardId)`  | Grid board state.                                     |
| `useDice(dieIds)`          | Dice rolling mechanics.                               |
| `useGameState`             | Turn order, current phase, active players.            |
| `useAction`                | Submit build, trade, end-turn actions.                |
| `useUIArgs`                | Phase-specific data (available builds, trade offers). |
| `usePlayerInfo`            | All player info for scoreboards.                      |

## Key patterns

### Resource display with affordability

```tsx
const resources = useMyResources();
const resourceDefs: ResourceDefinition[] = [
  { type: "brick", label: "Brick", icon: Blocks, color: "text-red-600" },
  { type: "lumber", label: "Lumber", icon: TreePine, color: "text-green-700" },
  { type: "ore", label: "Ore", icon: Mountain, color: "text-slate-500" },
  { type: "grain", label: "Grain", icon: Wheat, color: "text-yellow-500" },
  { type: "wool", label: "Wool", icon: Cloud, color: "text-green-400" },
];

<ResourceCounter
  resources={resourceDefs.map((d) => ({
    ...d,
    iconColor: d.color,
    bgColor: "bg-slate-800",
  }))}
  counts={resources}
  layout="row"
/>;
```

### Build actions with costs

```tsx
const { buildPhase } = useUIArgs();
const resources = useMyResources();

<ActionPanel title="Build" state="buildPhase">
  <ActionGroup title="Structures">
    <ActionButton
      label="Build Road"
      cost={{ brick: 1, lumber: 1 }}
      currentResources={resources}
      resourceDefs={resourceDefs}
      available={buildPhase?.canBuildRoad}
      onClick={() => actions.buildActions.build({ type: "road" })}
    />
    <ActionButton
      label="Build Settlement"
      cost={{ brick: 1, lumber: 1, grain: 1, wool: 1 }}
      currentResources={resources}
      resourceDefs={resourceDefs}
      available={buildPhase?.canBuildSettlement}
      onClick={() => actions.buildActions.build({ type: "settlement" })}
    />
  </ActionGroup>
</ActionPanel>;
```

### Hex board for Catan-style games

```tsx
const { tiles, edges, vertices } = useHexBoard("catan-board");

<HexGrid
  tiles={tiles}
  edges={edges}
  vertices={vertices}
  hexSize={50}
  renderTile={(tile) => (
    <DefaultHexTile
      size={50}
      fill={terrainColors[tile.typeId]}
      label={tile.data?.diceNumber}
    />
  )}
  renderEdge={(edge, pos) => (
    <DefaultHexEdge position={pos} color={playerColors[edge.owner]} />
  )}
  renderVertex={(vertex, pos) => (
    <DefaultHexVertex position={pos} color={playerColors[vertex.owner]} />
  )}
  interactiveVertices={placementMode === "settlement"}
  interactiveEdges={placementMode === "road"}
  onInteractiveVertexClick={(v) => handlePlacement("settlement", v.id)}
  onInteractiveEdgeClick={(e) => handlePlacement("road", e.id)}
/>;
```

### Market row (purchasable cards)

```tsx
<PlayArea
  cards={marketCards}
  layout="row"
  interactive
  onCardClick={(cardId) => handlePurchase(cardId)}
  renderCard={(card) => (
    <div className="relative">
      <DefaultCardContent card={card} />
      <CostDisplay
        cost={card.properties.cost}
        currentResources={resources}
        resourceDefs={resourceDefs}
        layout="inline"
      />
    </div>
  )}
/>
```

## UIArgs recommendations

```typescript
// shared/ui-args.ts
export interface BuildPhaseUIArgs {
  canBuildRoad: boolean;
  canBuildSettlement: boolean;
  canBuildCity: boolean;
  canBuyCard: boolean;
  availableBuildLocations?: string[]; // Board positions where building is allowed
}

export interface TradePhaseUIArgs {
  canTrade: boolean;
  tradeOffers?: {
    from: string;
    offering: Record<string, number>;
    requesting: Record<string, number>;
  }[];
  bankTradeRatios?: Record<string, number>; // e.g., { brick: 4, lumber: 3 } for ports
}

export interface DicePhaseUIArgs {
  diceValues?: number[];
  resourcesGained?: Record<string, number>;
}
```
