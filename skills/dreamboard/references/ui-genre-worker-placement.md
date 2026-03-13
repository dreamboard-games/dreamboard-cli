# UI Guide: Worker Placement Games

Patterns for Agricola, Viticulture, Lords of Waterdeep, Caverna, and similar euro-style worker placement games.

## Game characteristics

- Players place **worker tokens** on shared **action slots** to gain resources or take actions.
- Slots may be exclusive (one player per round) or shared.
- Phases typically include: placement, resolution/harvest, and cleanup.
- Key UI signals: available slots, slot costs/rewards, number of workers remaining, resource counts.

## Recommended SDK components

### Primary

| Component             | Usage                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `SlotSystem`          | Core board — renders all action slots with occupants. Use `layout="grouped"` to organize by category. |
| `DefaultSlotItem`     | Pre-built slot renderer showing name, description, capacity, cost/reward labels.                      |
| `DefaultSlotOccupant` | Pre-built worker token display with player color.                                                     |
| `ResourceCounter`     | Display each player's resource pool (wood, stone, food, etc.).                                        |
| `ActionButton`        | "Place Worker" button with integrated cost display and affordability check.                           |

### Supporting

| Component                     | Usage                                                        |
| ----------------------------- | ------------------------------------------------------------ |
| `ActionPanel` / `ActionGroup` | Group available actions (e.g., "Place Worker", "End Turn").  |
| `CostDisplay`                 | Show resource costs on slot details.                         |
| `PlayerInfo`                  | Show each player's name, workers remaining, and turn status. |
| `PhaseIndicator`              | Distinguish placement phase from harvest/scoring phases.     |
| `GameEndDisplay`              | Final scoring with detailed breakdown.                       |
| `Drawer`                      | Mobile drawer for detailed slot inspection.                  |

### Hooks

| Hook                              | Usage                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| `useSlotSystem(slots, occupants)` | Utility for slot lookups: `getSlot`, `isFull`, `getRemainingCapacity`, `getOccupantsByPlayer`. |
| `useMyResources()`                | Current player's resource pool.                                                                |
| `useGameState`                    | Get `isMyTurn`, `currentState`, `currentPlayerIds`.                                            |
| `useAction`                       | Submit place-worker or end-turn actions.                                                       |
| `useUIArgs`                       | Get phase-specific data (available slots, worker count, etc.).                                 |
| `usePlayerInfo`                   | Map player IDs to names and colors.                                                            |

## Key patterns

### Slot board with placement

```tsx
const { placementPhase } = useUIArgs();
const slots = placementPhase?.slots ?? [];
const occupants = placementPhase?.occupants ?? [];
const availableSlotIds = new Set(placementPhase?.availableSlotIds ?? []);
const slotApi = useSlotSystem(slots, occupants);

<SlotSystem
  slots={slots}
  occupants={occupants}
  layout="grouped"
  renderSlot={(slot, slotOccupants) => (
    <DefaultSlotItem
      name={slot.name}
      description={slot.description}
      capacity={slot.capacity}
      occupantCount={slotOccupants.length}
      isExclusive={slot.exclusive}
      isAvailable={availableSlotIds.has(slot.id)}
      costLabel={formatCost(slot.cost)}
      rewardLabel={formatReward(slot.reward)}
      onClick={() => handlePlaceWorker(slot.id)}
      renderOccupants={() => (
        <div className="flex gap-1">
          {slotOccupants.map((o) => (
            <DefaultSlotOccupant
              key={o.pieceId}
              color={playerColors[o.playerId]}
              label={playerInfo[o.playerId]?.name}
            />
          ))}
        </div>
      )}
    />
  )}
/>;
```

### Resource display

```tsx
const resources = useMyResources();

<ResourceCounter
  resources={[
    {
      type: "wood",
      label: "Wood",
      icon: TreePine,
      iconColor: "text-amber-700",
    },
    {
      type: "stone",
      label: "Stone",
      icon: Mountain,
      iconColor: "text-slate-400",
    },
    { type: "food", label: "Food", icon: Apple, iconColor: "text-red-400" },
    { type: "gold", label: "Gold", icon: Coins, iconColor: "text-yellow-400" },
  ]}
  counts={resources}
  layout="row"
/>;
```

### Action buttons with costs

```tsx
<ActionButton
  label="Build Farm"
  cost={{ wood: 2, stone: 1 }}
  currentResources={resources}
  resourceDefs={resourceDefinitions}
  icon={Home}
  onClick={() => actions.buildActions.build({ buildingType: "farm" })}
/>
```

## UIArgs recommendations

```typescript
// shared/ui-args.ts
export interface PlacementPhaseUIArgs {
  slots: SlotDefinition[];
  occupants: SlotOccupant[];
  availableSlotIds: string[]; // Slots the current player can legally place on
  workersRemaining: number;
}

export interface HarvestPhaseUIArgs {
  feedingRequired: number; // Food needed
  currentFood: number;
}
```
