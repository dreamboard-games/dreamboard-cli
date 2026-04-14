# UI Best Practices

Use this guide when implementing `ui/App.tsx` and `ui/components/*`.

This page is about rendering, interaction, and UI data flow. Keep rules in `rule.md`, runtime structure in `manifest.json`, and phase-specific UI data in `getUIArgs()`.

## Core Principles

1. **Start with SDK components**
   Prefer `./sdk/components/` and customize them with render props before building custom replacements.
2. **Design mobile-first**
   Mobile is the baseline. Desktop can add polish, but the primary layout should work on smaller screens first.
3. **Do not duplicate authoritative game state**
   Use hooks such as `useGameState`, `useUIArgs`, and `useAction` instead of mirroring shared state in local React state.
4. **Wrap actions in error handling**
   Show feedback through `useToast` or another clear error surface.
5. **Keep types intact**
   Use the generated hook and action types. Avoid `any`.
6. **Reserve a persistent feedback area**
   Players should always be able to see the current phase, turn ownership, latest meaningful result, and end-of-game summary.

## SDK Hooks

Use these from `./sdk/hooks/`.

| Hook | Returns | When to use |
| ---- | ------- | ----------- |
| `useGameState` | Full game state (`currentPlayerIds`, `decks`, `currentState`, `isMyTurn`) | Core session state |
| `useCard(cardId)` | `CardItem \| undefined` | Resolve one card |
| `useCards(cardIds)` | `CardItem[]` | Resolve multiple cards |
| `useMyHand(handId)` | Current player's cards for one hand | Private or public per-player cards |
| `useMyResources()` | Current player's resources | Resource display |
| `useMe()` | `{ playerId, name, isHost }` | Current player identity |
| `usePlayerInfo()` | All players keyed by ID | Player labels and scoreboards |
| `useAction()` | Phase-specific action submitters | Submitting actions |
| `useUIArgs()` | Phase-specific UI args | Data returned from `getUIArgs()` |
| `useGameNotifications()` | Event listeners | Turn prompts, rejections, game end |
| `useLobby()` | Lobby state | Seating and pre-game UI |
| `useDice(dieIds)` | Dice values and roll function | Dice mechanics |

## SDK Components

Use these from `./sdk/components/`.

### Core display

| Component | Purpose |
| --------- | ------- |
| `Card` | Display a card with animation support |
| `ConnectedCard` | Resolve card data from context automatically |
| `Hand` | Render a player's hand with custom card layout |
| `PlayArea` | Render a shared card area |
| `PlayerInfo` | Show player name, score, and turn state |

### Actions and status

| Component | Purpose |
| --------- | ------- |
| `ActionButton` | Action button with optional cost display |
| `ActionPanel` | Container for related actions |
| `ActionGroup` | Group actions inside a panel |
| `PhaseIndicator` | Show current phase and turn state |
| `ResourceCounter` | Display typed resources |
| `CostDisplay` | Show affordability |
| `DiceRoller` | Show die values |
| `GameEndDisplay` | Show final results |
| `Drawer` | Mobile overflow surface |

### Board components

| Component | Use case | Hook |
| --------- | -------- | ---- |
| `SquareGrid` | Chess, checkers, grid tactics | `useSquareBoard(boardId)` |
| `HexGrid` | Hex maps and wargames | `useHexBoard(boardId)` |
| `TrackBoard` | Race tracks and score tracks | `useTrackBoard(boardId)` |
| `NetworkGraph` | Connected-node boards | `useNetworkBoard(boardId)` |
| `ZoneMap` | Area-control boards | `useZoneMap(zones, pieces)` |
| `SlotSystem` | Worker placement | `useSlotSystem(slots, occupants)` |

## Layout Guidelines

- Use Tailwind CSS for styling.
- Use `clsx` for conditional class composition.
- Use `framer-motion` for meaningful motion, not motion everywhere.
- Keep touch targets large and spacing readable on mobile.
- Use `useIsMobile()` when behavior must differ by device.

## Persistent Feedback Region

Reserve a visible area near the top of the layout for status that should survive subview changes.

That region should be able to show:

- the current phase
- whether it is the local player's turn
- the latest meaningful status message
- round or trick resolution results
- game-over state and winner summary

If your game uses `AUTO` phases, do not let those transitions erase the only copy of round-resolution feedback before the next interactive view appears.

## Common Patterns

### Phase-based rendering

```tsx
const { currentState } = useGameState();
const uiArgs = useUIArgs();
const actions = useAction();

if (currentState === "playCards") {
  const phaseArgs = uiArgs.playCards;
  const phaseActions = actions.playCardsActions;
  return <PlayCardsView args={phaseArgs} actions={phaseActions} />;
}
```

### Action submission with error handling

```tsx
const { toast } = useToast();

const handlePlay = async () => {
  try {
    await actions.playCardsActions.playCard({ cardIds: selectedCards });
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Action failed");
  }
};
```

### Public hands in UI

For per-player containers that should be visible to everyone, prefer the built-in public-hand hook instead of duplicating that data in `getUIArgs()`.

```ts
import { useMyHand, usePublicHands } from "@dreamboard/ui-sdk";

const myHand = useMyHand("hand");
const scoredByPlayer = usePublicHands("scored-area");
const player2Scored = scoredByPlayer["player-2"] ?? [];
```

Notes:

- `useMyHand(handId)` reads the current player's copy of that hand
- `usePublicHands(handId)` reads all players' copies, keyed by `playerId`
- `usePublicHands()` only works for hands marked `visibility: "public"`

## Genre-Specific Guides

Use these when the game matches one of the built-in patterns:

- [ui-genre-trick-taking.md](ui-genre-trick-taking.md)
- [ui-genre-worker-placement.md](ui-genre-worker-placement.md)
- [ui-genre-resource-management.md](ui-genre-resource-management.md)
