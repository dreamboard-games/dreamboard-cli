# UI Best Practices

Best practices for working on `ui/App.tsx` and `ui/components/*` — the React frontend.

## General principles

1. **Use SDK components** — import from `./sdk/components/`. Prefer library components over rolling your own. Customize them via render props if needed.
2. **Mobile-first** — mobile is the primary target, desktop is an enhancement. Start with mobile-optimized layouts, use large touch targets, and relative units (rem, em).
3. **No state duplication** — avoid `React.useState()` for state that needs to sync across players. Use `useGameState`, `useUIArgs`, and action submitters instead.
4. **Error handling on actions** — always wrap action submissions in try/catch and show feedback via `useToast`.
5. **Do not use `any`** — always work with typed hooks and props.
6. **Persistent feedback matters** — include a stable feedback region that survives auto-phase transitions so players can always see the current phase, latest status message, last round result, and game-over summary.

## SDK hooks (from `./sdk/hooks/`)

| Hook                   | Returns                                                           | When to use                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `useGameState`         | Full game state (currentPlayerIds, decks, currentState, isMyTurn) | Core game state. All fields are non-nullable — do not use optional chaining.                                                                    |
| `useCard(cardId)`      | `CardItem \| undefined`                                           | Get a single card's data                                                                                                                        |
| `useCards(cardIds)`    | `CardItem[]`                                                      | Get multiple cards                                                                                                                              |
| `useMyHand(handId)`    | Hand data for current player                                      | Player's cards                                                                                                                                  |
| `useMyResources()`     | Current player's resources                                        | Resource display                                                                                                                                |
| `useMe`                | `{ playerId, name, isHost }`                                      | Current player identity                                                                                                                         |
| `usePlayerInfo`        | Map of all players                                                | Player list/display                                                                                                                             |
| `useAction`            | Phase-specific action submitters                                  | Submitting actions. Keyed by phase with "Actions" suffix (e.g., `playCardsActions`). Only current phase returns submitters; others return null. |
| `useUIArgs`            | Phase-specific UI args                                            | Data from `getUIArgs()`. Keyed by phase name. Only current phase has data.                                                                      |
| `useGameNotifications` | Event listeners                                                   | `onYourTurn`, `onActionRejected`, `onGameEnded`                                                                                                 |
| `useLobby`             | Lobby state                                                       | seats, canStart, hostUserId                                                                                                                     |
| `useDice(dieIds)`      | Dice values and roll function                                     | Dice mechanics                                                                                                                                  |

## SDK components (from `./sdk/components/`)

### Core display

| Component       | Purpose                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------- |
| `Card`          | Displays a game card with animations. Supports `renderContent` for custom faces.             |
| `ConnectedCard` | Auto-fetches card data from context.                                                         |
| `Hand`          | Container for player's hand. Uses render props: `renderCard`, `renderDrawer`, `renderEmpty`. |
| `PlayArea`      | Central board area for active cards. Supports grid/row layouts.                              |
| `PlayerInfo`    | Player avatar with status, score, and turn indicators.                                       |

### Action UI

| Component      | Purpose                                                      |
| -------------- | ------------------------------------------------------------ |
| `ActionButton` | Button with integrated cost display and affordability check. |
| `ActionPanel`  | Collapsible container for action groups.                     |
| `ActionGroup`  | Groups related actions with title and variant styling.       |

### Game state display

| Component         | Purpose                                                             |
| ----------------- | ------------------------------------------------------------------- |
| `PhaseIndicator`  | Shows current phase and "Your Turn" indicator.                      |
| `ResourceCounter` | Displays resource counts with icons and animations.                 |
| `CostDisplay`     | Shows resource costs with green/red affordability indication.       |
| `DiceRoller`      | Display component for dice values with render prop.                 |
| `GameEndDisplay`  | End-of-game overlay with trophy, scoreboard, and return-to-lobby.   |
| `Drawer`          | Mobile-friendly drawer for overflow content (e.g., too many cards). |

### Board components

| Component      | Use case                                | Hook                              |
| -------------- | --------------------------------------- | --------------------------------- |
| `SquareGrid`   | Chess, Checkers, Go, Tic-Tac-Toe        | `useSquareBoard(boardId)`         |
| `HexGrid`      | Catan, wargames, Hive                   | `useHexBoard(boardId)`            |
| `TrackBoard`   | Monopoly, racing, Snakes & Ladders      | `useTrackBoard(boardId)`          |
| `NetworkGraph` | Ticket to Ride, Pandemic, Power Grid    | `useNetworkBoard(boardId)`        |
| `ZoneMap`      | Risk, Small World, area control         | `useZoneMap(zones, pieces)`       |
| `SlotSystem`   | Agricola, Viticulture, worker placement | `useSlotSystem(slots, occupants)` |

## Layout guidelines

- Use Tailwind CSS for all styling.
- Use `clsx` for conditional class composition.
- Use `framer-motion` for animations (already included via SDK components).
- Keep spacing tight on mobile, generous on desktop.
- Limit simultaneous animations for performance.
- Use `useIsMobile()` hook when you need device-specific behavior.

## Persistent feedback region

Reserve a visible area near the top of the layout for game status. This should outlive individual action panels and phase-specific subviews.

- Show the current phase and whether it is the local player's turn.
- Show a human-readable status message for the latest meaningful change.
- Keep the last round result visible until the next player-facing state can explain it.
- Show a clear game-over summary when the game ends.

If your game uses AUTO phases, do not let those transitions wipe the only copy of round-resolution feedback before the UI can render it.

## Common patterns

### Phase-based rendering

```tsx
const { currentState, isMyTurn } = useGameState();
const uiArgs = useUIArgs();
const actions = useAction();

// Render based on current phase
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

### Game end detection

```tsx
const { currentState } = useGameState();

if (currentState === "endGame") {
  return <GameEndDisplay isGameOver scores={scores} />;
}
```

## Public hands in UI

For public card zones (for example a scored area), prefer the built-in hook instead of custom `getUIArgs()` plumbing.

```ts
import { useMyHand, usePublicHands } from "@dreamboard/ui-sdk";

const myHand = useMyHand("hand");
const scoredByPlayer = usePublicHands("scored-area");
const player2Scored = scoredByPlayer["player-2"] ?? [];
```

Notes:

- `useMyHand(handId)` returns cards for the currently controlling player only.
- `usePublicHands(handId)` returns all players' cards for that hand, keyed by `playerId`.
- `usePublicHands()` is only populated for hands marked `"visibility": "public"`.

## Genre-specific guidance

For detailed UI patterns and recommended components per game genre, see:

- [ui-genre-trick-taking.md](ui-genre-trick-taking.md) — Hearts, Spades, Bridge, Big Two
- [ui-genre-worker-placement.md](ui-genre-worker-placement.md) — Agricola, Viticulture, Lords of Waterdeep
- [ui-genre-resource-management.md](ui-genre-resource-management.md) — Catan, Splendor, engine builders
