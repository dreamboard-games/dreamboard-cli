# UI Library

Reference for using Dreamboard official UI Library for building board games.

`@dreamboard/ui-sdk` is Dreamboard's headless UI package. Use it for projected
game view reads, typed player actions, prompts, windows, and runtime state.
Dreamboard also scaffolds a local component library into
`ui/components/dreamboard/*` so each game can own and edit its visuals.

## Package boundary

Use `@dreamboard/ui-sdk` for:

- runtime and plugin-state helpers
- reducer-view reads for the controlling seat
- typed action, prompt, and window submission
- lobby and session metadata
- headless layout, geometry, and topology helpers

Use local `ui/components/dreamboard` files for:

- loading and error shells such as `PluginRuntime`, `ErrorBoundary`, `ToastProvider`, and `GameSkeleton`
- presentational UI such as cards, action panels, dice displays, and player badges
- board renderers such as `HexGrid`, `SquareGrid`, `SlotSystem`, `ZoneMap`, and `TrackBoard`

## Import surface

Game UIs should split imports by ownership: hooks and types from
`@dreamboard/ui-sdk`, visual components from the local scaffold.

```tsx
import {
  CardCollection,
  ViewCard,
  ViewSlotOccupant,
  useActions,
  useCards,
  useChoicePrompt,
  useGameSelector,
  useGameView,
  useGameplayPrompts,
  useGameplayWindows,
  useLobby,
  useMe,
  useBoardTopology,
  useHexBoard,
  useIsMyTurn,
  usePlayerInfo,
  usePluginSession,
  usePrompt,
  useSquareBoard,
} from "@dreamboard/ui-sdk";

import {
  ErrorBoundary,
  GameSkeleton,
  PluginRuntime,
  ToastProvider,
} from "./components/dreamboard";
```

## Runtime shell

### Local `PluginRuntime`

`PluginRuntime` waits for the first reducer-native state-sync snapshot and then
provides runtime, session, and plugin-state context to authored hooks.

| Prop               | Required | Notes                                                                   |
| ------------------ | -------- | ----------------------------------------------------------------------- |
| `children`         | Yes      | Rendered after runtime initialization succeeds                          |
| `timeout`          | No       | Milliseconds to wait for first state-sync snapshot; defaults to `10000` |
| `loadingComponent` | No       | Replaces the default loading shell                                      |
| `errorComponent`   | No       | Receives the runtime boot error string                                  |

```tsx
import { createRoot } from "react-dom/client";
import { PluginRuntime } from "./components/dreamboard";

createRoot(document.getElementById("root")!).render(
  <PluginRuntime timeout={15000}>
    <App />
  </PluginRuntime>,
);
```

### Local `ErrorBoundary`

Wrap the root UI so authored render failures stay inside the plugin instead of
blanking the whole frame.

```tsx
import { ErrorBoundary, PluginRuntime } from "./components/dreamboard";

<ErrorBoundary>
  <PluginRuntime>
    <App />
  </PluginRuntime>
</ErrorBoundary>;
```

### Local `ToastProvider` and `useToast()`

Use `ToastProvider` once near the root. Use `useToast()` from children when the
UI needs transient feedback that is not reducer state.

```tsx
import { ToastProvider, useToast } from "./components/dreamboard";

function EndTurnButton() {
  const { success } = useToast();

  return <button onClick={() => success("Turn submitted")}>End turn</button>;
}
```

`useToast()` returns:

- `toasts`
- `show(message, type?, duration?)`
- `dismiss(id)`
- `success(message, duration?)`
- `error(message, duration?)`
- `info(message, duration?)`
- `warning(message, duration?)`

### Local `GameSkeleton`

Use `GameSkeleton` while the plugin session is still loading or when the UI
needs a fallback shell.

| Prop        | Required | Notes                                              |
| ----------- | -------- | -------------------------------------------------- |
| `variant`   | No       | One of `default`, `cards`, `players`, or `minimal` |
| `message`   | No       | Loading or placeholder text                        |
| `className` | No       | Additional container classes                       |

```tsx
import { usePluginSession } from "@dreamboard/ui-sdk";
import { GameSkeleton } from "./components/dreamboard";

function AppLoader() {
  const { status } = usePluginSession();

  if (status === "loading") {
    return <GameSkeleton variant="default" message="Loading game..." />;
  }

  return <App />;
}
```

## View and session hooks

### `useGameView()`

Reads the full reducer-projected view for the controlling seat.

```ts
const view = useGameView();
```

Use this when the component genuinely needs the whole view object. Otherwise,
prefer `useGameSelector(...)`.

### `useGameSelector(selector, equalityFn?)`

Reads one derived slice from the projected reducer view and only re-renders
when that slice changes according to `equalityFn`.

```ts
const legalCardIds = useGameSelector(
  (view) => new Set(view.legalCardIds),
  (left, right) =>
    left.size === right.size && [...left].every((cardId) => right.has(cardId)),
);
```

Use selector hooks for:

- compact status text
- legal-target hints
- small card or resource subsets
- board-specific render inputs

### `usePluginSession()`

Returns runtime session metadata for the current plugin.

| Field                   | Type                   | Notes                         |
| ----------------------- | ---------------------- | ----------------------------- |
| `status`                | `"loading" \| "ready"` | Session initialization status |
| `sessionId`             | `string \| null`       | Current session ID            |
| `controllablePlayerIds` | `string[]`             | Seats the user can control    |
| `controllingPlayerId`   | `string \| null`       | Currently selected seat       |
| `userId`                | `string \| null`       | Current user ID               |

```ts
const { controllingPlayerId, controllablePlayerIds, status } =
  usePluginSession();
```

### `useLobby()`

Returns the current lobby snapshot from state-sync.

```ts
const lobby = useLobby();
const seatCount = lobby.seats.length;
```

Use this for seat order, display names, colours, and host markers.

### `useMe()`

Returns the player currently being controlled by this user.

```ts
const me = useMe();
// me.playerId
// me.name
// me.color
```

This throws if there is no controlling player, so it is for playable seats, not
spectator-only UI.

### `useIsMyTurn()`

Returns whether the currently controlled player is one of the engine-tracked
active players for the current gameplay snapshot.

```ts
const isMyTurn = useIsMyTurn();
```

Use this instead of projecting `isMyTurn` through your reducer view.

### `usePlayerInfo()`

Builds a `Map<PlayerId, Player>` from the current lobby snapshot.

```ts
const players = usePlayerInfo();
const judge = players.get("player-1");
```

Use it when the reducer view contains player IDs and the UI needs labels,
colours, or host markers.

## Actions, prompts, and windows

### `useActions()`

`useActions()` is the typed reducer action surface for the current phase.

| Field                                 | Notes                                                |
| ------------------------------------- | ---------------------------------------------------- |
| `phase`                               | Current runtime phase                                |
| `commands`                            | Typed reducer action factories for the current phase |
| `availableActions`                    | `ReadonlySet` of currently available action names    |
| `can(name)`                           | Whether an action is currently available             |
| `dispatch(command)`                   | Submit one action                                    |
| `validate(command)`                   | Validate one action without submitting it            |
| `respondToPrompt(prompt, response)`   | Submit a prompt response                             |
| `submitWindowAction(window, command)` | Submit a gameplay-window action                      |

```ts
const phase = useActions();

if (phase.phase === "placeThing") {
  await phase.dispatch(
    phase.commands.placeThing({
      cardId: "a-dog",
      ringId: "ring-1",
    }),
  );
}
```

Use `phase.commands.<action>(...)` instead of hand-writing `{ type, params }`
objects. The command and phase types come from the generated UI contract.

`dispatch(...)`, `validate(...)`, `respondToPrompt(...)`, and
`submitWindowAction(...)` reject when runtime validation or submission fails.

### `usePrompt(promptId)`

Returns one active prompt family as a singular handle.

| Field               | Notes                                |
| ------------------- | ------------------------------------ |
| `prompt`            | Active prompt instance or `null`     |
| `isOpen`            | Whether that prompt family is active |
| `respond(response)` | Submit one typed prompt response     |

Use it when the UI only cares about one prompt at a time and you do not want
to index into `useGameplayPrompts(...)[0]`.

```tsx
import type { PromptResponse } from "@dreamboard/ui-contract";
import { usePrompt } from "@dreamboard/ui-sdk";

export function JudgeNotePrompt() {
  const notePrompt = usePrompt("judge-note");

  if (!notePrompt.prompt) {
    return null;
  }

  const submit = async () => {
    const response: PromptResponse<"judge-note"> = {
      note: "Blocked by another piece.",
    };
    await notePrompt.respond(response);
  };

  return <button onClick={() => void submit()}>Submit note</button>;
}
```

### `useChoicePrompt(promptId)`

Returns one active choice prompt family plus the typed submit helper and active
runtime options.

| Field              | Notes                                |
| ------------------ | ------------------------------------ |
| `prompt`           | Active prompt instance or `null`     |
| `isOpen`           | Whether that prompt family is active |
| `options`          | Active runtime options               |
| `choose(response)` | Submit one typed choice response     |

Use it for the common reducer prompt flow where one player chooses from a
single list of options.

```tsx
import type { PromptResponse } from "@dreamboard/ui-contract";
import { useChoicePrompt } from "@dreamboard/ui-sdk";

export function JudgePlacementPrompt() {
  const placement = useChoicePrompt("judge-placement");

  if (!placement.prompt) {
    return null;
  }

  const choose = async (ringId: PromptResponse<"judge-placement">) => {
    await placement.choose(ringId);
  };

  return (
    <>
      {placement.options.map((option) => (
        <button key={option.id} onClick={() => void choose(option.id)}>
          {option.label}
        </button>
      ))}
    </>
  );
}
```

### `useGameplayPrompts(promptId?)`

Returns active prompts for the controlling seat. Pass a prompt ID to narrow the
result to one prompt family.

```ts
const judgePrompts = useGameplayPrompts("judge-placement");

if (judgePrompts[0]) {
  await phase.respondToPrompt(judgePrompts[0], "ring-2");
}
```

Use prompts for reducer-owned deferred input, not ad hoc local modal state.

Prefer `usePrompt(...)` or `useChoicePrompt(...)` when the UI owns a single
prompt family. Keep `useGameplayPrompts(...)` for prompt trays, generic prompt
renderers, or flows that need to handle multiple active prompt instances.

Typed prompt response example:

```tsx
import type { PromptResponse } from "@dreamboard/ui-contract";
import { useActions, useGameplayPrompts } from "@dreamboard/ui-sdk";

export function JudgePromptActions() {
  const phase = useActions();
  const prompts = useGameplayPrompts("judge-placement");
  const activePrompt = prompts[0];

  if (!activePrompt) {
    return null;
  }

  const chooseRing = async (ringId: "ring-1" | "ring-2" | "ring-3") => {
    const response: PromptResponse<"judge-placement"> = ringId;
    await phase.respondToPrompt(activePrompt, response);
  };

  return (
    <>
      <button onClick={() => void chooseRing("ring-1")}>Ring 1</button>
      <button onClick={() => void chooseRing("ring-2")}>Ring 2</button>
      <button onClick={() => void chooseRing("ring-3")}>Ring 3</button>
    </>
  );
}
```

### `useGameplayWindows(windowId?)`

Returns active gameplay windows for the controlling seat. Pass a window ID to
filter the result.

```ts
const tradeWindows = useGameplayWindows("trade-offer");

if (tradeWindows[0]) {
  await phase.submitWindowAction(tradeWindows[0], {
    type: "acceptTrade",
  });
}
```

Window actions are still reducer-defined and typed from the generated contract.

Typed window action example:

```tsx
import { windowCommands } from "../shared/generated/ui-contract";
import { useActions, useGameplayWindows } from "@dreamboard/ui-sdk";

export function TradeWindowActions() {
  const phase = useActions();
  const windows = useGameplayWindows("trade-offer");
  const activeWindow = windows[0];

  if (!activeWindow) {
    return null;
  }

  const acceptTrade = async () => {
    await phase.submitWindowAction(
      activeWindow,
      windowCommands["trade-offer"].acceptTrade({
        offerId: "offer-1",
      }),
    );
  };

  const declineTrade = async () => {
    await phase.submitWindowAction(
      activeWindow,
      windowCommands["trade-offer"].declineTrade(),
    );
  };

  return (
    <>
      <button onClick={() => void acceptTrade()}>Accept</button>
      <button onClick={() => void declineTrade()}>Decline</button>
    </>
  );
}
```

Import `windowCommands` from your workspace's generated
`shared/generated/ui-contract.ts` file.

## Presentational primitives

These components are presentational. Feed them from reducer view data and
explicit props.

| Export                        | Use it for                                            |
| ----------------------------- | ----------------------------------------------------- |
| `Card`                        | One authored card face                                |
| `Hand`                        | Responsive hand layout with render props              |
| `PlayArea`                    | Shared played-card or centre-table region             |
| `PlayerInfo`                  | Player badges, scores, and active-seat markers        |
| `ActionButton`                | One action with availability, loading, and cost state |
| `ActionPanel` / `ActionGroup` | Grouped action regions                                |
| `ResourceCounter`             | Resource totals                                       |
| `CostDisplay`                 | Cost breakdowns                                       |
| `PhaseIndicator`              | Current phase or step status                          |
| `GameEndDisplay`              | Final rankings and scores                             |
| `DiceRoller`                  | Reducer-driven dice results                           |
| `Drawer` and related exports  | Mobile overflow or detail panels                      |

`DiceRoller` is display-only. In reducer-native games, dice values are
typically driven by authored die state updated through reducer runtime effects
such as `fx.rollDie(...)`.

### `Card`

`Card` renders one `ViewCard`. Use `renderContent` when the default face is not
enough.

```tsx
<Card
  card={card}
  selected={selectedIds.includes(card.id)}
  onCardClick={(cardId) => setSelectedIds([cardId])}
  renderContent={(item) => <ThingCardFace card={item} />}
/>
```

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `card` | `CardItem` | Yes | `card` value |
| `selected` | `boolean` | No | `selected` value |
| `disabled` | `boolean` | No | `disabled` value |
| `size` | `'sm' \| 'md' \| 'lg'` | No | `size` value |
| `faceDown` | `boolean` | No | `faceDown` value |
| `renderContent` | `(card: CardItem) => React.ReactNode` | No | `renderContent` value |
| `onCardClick` | `(cardId: string) => void` | No | `onCardClick` value |

### `Hand`

`Hand` is a render-prop primitive. You supply `renderCard`, `renderDrawer`, and
`renderEmpty`.

```tsx
<Hand
  cards={view.handCards}
  selectedIds={selectedIds}
  renderCard={({ card, x, y, zIndex, isSelected }) => (
    <div
      key={card.id}
      style={{
        position: "absolute",
        left: x,
        transform: `translateY(${y}px)`,
        zIndex,
      }}
    >
      <Card
        card={card}
        selected={isSelected}
        onCardClick={(cardId) => setSelectedIds([cardId])}
      />
    </div>
  )}
  renderDrawer={({ cards }) => <button>View {cards.length} cards</button>}
  renderEmpty={() => <p>No cards in hand</p>}
/>
```

Use `Hand` when you want SDK layout behaviour but game-specific card faces.

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `cards` | `readonly CardItem[]` | Yes | `cards` value |
| `selectedIds` | `readonly string[]` | No | `selectedIds` value |
| `disabled` | `boolean` | No | `disabled` value |
| `cardSize` | `CardSize` | No | `cardSize` value |
| `layout` | `HandLayout` | No | `layout` value |
| `renderCard` | `(props: HandCardRenderProps) => ReactNode` | Yes | `renderCard` value |
| `renderDrawer` | `(props: HandDrawerRenderProps) => ReactNode` | Yes | Render function for drawer mode (when cards don't fit on small screens) |
| `renderEmpty` | `(props: HandEmptyRenderProps) => ReactNode` | Yes | `renderEmpty` value |
| `renderContainer` | `(props: HandContainerRenderProps) => ReactNode` | No | `renderContainer` value |
| `className` | `string` | No | `className` value |

### `PlayArea`

`PlayArea` renders a shared card region from an array of `ViewCard` values.
`Hand` and `PlayArea` both accept readonly card arrays directly, so reducer
views can pass `readonly ViewCard[]` without copying.

```tsx
<PlayArea
  cards={view.trickCards}
  layout="row"
  renderCard={(card) => <ThingCardFace card={card} />}
/>
```

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `cards` | `readonly CardItem[]` | Yes | `cards` value |
| `filter` | `(card: CardItem) => boolean` | No | `filter` value |
| `cardSize` | `CardProps['size']` | No | `cardSize` value |
| `renderCard` | `CardProps['renderContent']` | No | `renderCard` value |
| `layout` | `'grid' \| 'row'` | No | `layout` value |
| `interactive` | `boolean` | No | `interactive` value |
| `onCardClick` | `(cardId: string) => void` | No | `onCardClick` value |
| `className` | `string` | No | `className` value |

### Card collections

Reducer views should expose card data as a `CardCollection`, typically from
`createTableQueries(...).zone.playerCardCollection(...)` or
`sharedCardCollection(...)`. `useCards(...)` then materializes the ordered
`ViewCard[]` array for `Hand`, `PlayArea`, or custom layouts.

```tsx
import { useCards, useGameView } from "@dreamboard/ui-sdk";
import { Hand } from "./components/dreamboard";

function HarborHand() {
  const view = useGameView();
  const cards = useCards(view.hand);

  return (
    <Hand
      cards={cards}
      renderCard={() => null}
      renderDrawer={() => null}
      renderEmpty={() => null}
    />
  );
}
```

- `useCards(collection)` reads a reducer-view `CardCollection` and returns the
  ordered `ViewCard[]`.
- The canonical reducer-native shape is
  `{ cardIds, cardsById }: CardCollection`.
- UI code should not remap `cardType` to `type`.

### `ActionButton`

Use `ActionButton` for one reducer action. It can reflect availability,
resource affordability, and loading state. Prefer `children` for the visible
label. Keep `label` when you need an explicit accessible name for non-text
children.

```tsx
<ActionButton
  cost={{ brick: 1, lumber: 1 }}
  currentResources={view.resources}
  resourceDefs={resourceDefs}
  available={phase.can("buildRoad")}
  onClick={() => phase.dispatch(phase.commands.buildRoad())}
>
  Build road
</ActionButton>
```

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `label` | `string` | No | `label` value |
| `children` | `ReactNode` | No | `children` value |
| `description` | `string` | No | `description` value |
| `cost` | `Record<string, number>` | No | `cost` value |
| `currentResources` | `Record<string, number>` | No | `currentResources` value |
| `resourceDefs` | `ResourceDefinition[]` | No | `resourceDefs` value |
| `available` | `boolean` | No | `available` value |
| `disabledReason` | `string` | No | Shown as tooltip when disabled |
| `loading` | `boolean` | No | `loading` value |
| `icon` | `ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: string; }>` | No | `icon` value |
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'success'` | No | `variant` value |
| `size` | `'sm' \| 'md' \| 'lg'` | No | `size` value |
| `onClick` | `() => void` | Yes | `onClick` value |
| `className` | `string` | No | `className` value |

### `ActionPanel` and `ActionGroup`

Use these to keep the action surface grouped by phase or intent.

```tsx
<ActionPanel title="Your turn" state={phase.phase}>
  <ActionGroup title="Build">
    <ActionButton
      available={phase.can("buildRoad")}
      onClick={() => phase.dispatch(phase.commands.buildRoad())}
    >
      Build road
    </ActionButton>
  </ActionGroup>
</ActionPanel>
```

**`ActionPanel` props**

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | No | `title` value |
| `state` | `string` | No | Current game state/phase for context display |
| `stateLabels` | `Record<string, string>` | No | Human-readable state labels |
| `collapsible` | `boolean` | No | `collapsible` value |
| `defaultExpanded` | `boolean` | No | `defaultExpanded` value |
| `children` | `ReactNode` | Yes | `children` value |
| `className` | `string` | No | `className` value |

**`ActionGroup` props**

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | Yes | `title` value |
| `description` | `string` | No | `description` value |
| `visible` | `boolean` | No | `visible` value |
| `variant` | `'default' \| 'warning' \| 'danger' \| 'success'` | No | Highlight style for special phases |
| `children` | `ReactNode` | Yes | `children` value |
| `className` | `string` | No | `className` value |

### `PlayerInfo`

`PlayerInfo` is a display component. Pass display-ready values, not raw lobby
records.

```tsx
<PlayerInfo
  playerId={me.playerId}
  name={me.name}
  color={me.color}
  isCurrentPlayer
  isActive={view.activePlayerId === me.playerId}
  score={view.scores[me.playerId] ?? 0}
/>
```

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `playerId` | `PlayerId` | Yes | `playerId` value |
| `name` | `string` | No | `name` value |
| `isActive` | `boolean` | No | `isActive` value |
| `isCurrentPlayer` | `boolean` | No | `isCurrentPlayer` value |
| `isHost` | `boolean` | No | `isHost` value |
| `color` | `string` | No | Used for avatar background |
| `score` | `number` | No | `score` value |
| `metadata` | `Record<string, unknown>` | No | `metadata` value |
| `size` | `'sm' \| 'md' \| 'lg'` | No | `size` value |
| `orientation` | `'horizontal' \| 'vertical'` | No | `orientation` value |
| `avatar` | `React.ReactNode` | No | `avatar` value |
| `className` | `string` | No | `className` value |

### `DiceRoller`

`DiceRoller` is display-only. Project die results into the reducer view and
pass those values in. The roll action itself is still dispatched through the
normal action surface.

```tsx
const view = useGameView();
const values = view.lastRoll == null ? [] : [view.lastRoll];

<DiceRoller
  values={values}
  render={({ values, sum }) => (
    <div className="text-4xl font-bold">{values[0] ?? sum ?? "?"}</div>
  )}
/>;
```

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `values` | `Array<number \| undefined>` | No | `values` value |
| `diceCount` | `number` | No | Used when values not provided |
| `render` | `(props: DiceRollerRenderProps) => ReactNode` | Yes | `render` value |
| `className` | `string` | No | `className` value |

### `PhaseIndicator`

Use `PhaseIndicator` to show the current reducer phase and whose turn it is.
Pass `phaseLabels` to display human-readable names instead of raw phase keys.

```tsx
const isMyTurn = useIsMyTurn();

<PhaseIndicator
  currentPhase={view.currentPhase}
  phaseLabels={{ takeTurn: "Your turn", setup: "Setting up" }}
  isMyTurn={isMyTurn}
  activePlayerNames={[players.get(view.activePlayerId)?.name ?? ""]}
/>;
```

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `currentPhase` | `string` | Yes | `currentPhase` value |
| `phaseLabels` | `Record<string, string>` | No | `phaseLabels` value |
| `isMyTurn` | `boolean` | No | `isMyTurn` value |
| `activePlayerNames` | `string[]` | No | `activePlayerNames` value |
| `variant` | `'badge' \| 'bar' \| 'minimal'` | No | `variant` value |
| `className` | `string` | No | `className` value |

### `GameEndDisplay`

`GameEndDisplay` renders a full-screen overlay when the game is over. Pass
`isGameOver` from the reducer view so the overlay appears automatically.

```tsx
<GameEndDisplay
  isGameOver={!!view.winnerPlayerId}
  scores={sortedPlayers.map((p) => ({
    playerId: p.playerId,
    name: players.get(p.playerId)?.name ?? p.playerId,
    score: view.scores[p.playerId] ?? 0,
    isWinner: p.playerId === view.winnerPlayerId,
  }))}
  onReturnToLobby={() => void phase.dispatch(phase.commands.returnToLobby())}
/>
```

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `isGameOver` | `boolean` | Yes | `isGameOver` value |
| `scores` | `PlayerScore[]` | Yes | Sorted by rank |
| `winnerMessage` | `string` | No | `winnerMessage` value |
| `showDetails` | `boolean` | No | `showDetails` value |
| `onReturnToLobby` | `() => void` | No | `onReturnToLobby` value |
| `className` | `string` | No | `className` value |

## Board primitives

Use board primitives when the reducer view already contains render-ready board
data.

| Export         | Use it for                                  |
| -------------- | ------------------------------------------- |
| `TrackBoard`   | Linear, circular, or branching tracks       |
| `SquareGrid`   | Chess-like or tile-grid boards              |
| `HexGrid`      | Hex maps with tiles, edges, and vertices    |
| `NetworkGraph` | Nodes, connections, and route graphs        |
| `ZoneMap`      | Region or area control boards               |
| `SlotSystem`   | Worker-placement and slot occupancy layouts |

```tsx
<TrackBoard
  spaces={view.track.spaces}
  pieces={view.track.pieces}
  type="circular"
  renderSpace={(space, pieces) => (
    <g aria-label={space.name ?? space.id}>
      <circle cx={space.position.x} cy={space.position.y} r={24} />
      <text x={space.position.x} y={space.position.y}>
        {pieces.length}
      </text>
    </g>
  )}
/>
```

Board renderers are still UI code. The reducer should provide:

- legal targets
- ownership markers
- highlight states
- labels and annotations
- grouped piece and card data in the shape the component expects

### Reducer view contract

Project these shapes directly into the reducer view instead of rebuilding them
in React:

| Local component | Project into the reducer view                   | Notes                                                                                                                                                    |
| --------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HexGrid`       | `view.board` as a generated hex board record    | `spaces` drive tile rendering. Include `edges` and `vertices` when you want visible roads, settlements, cities, or interactive edge and vertex overlays. |
| `SquareGrid`    | `view.board` as a generated square board record | `spaces` drive cell rendering. Include `edges` and `vertices` when you want walls, borders, corners, or interactive edge and vertex overlays.            |
| `TrackBoard`    | `view.track = { spaces, pieces }`               | `TrackBoard` is the explicit presentation adapter. Use `toTrackBoardData(view.board, { pieces, layout })` when your reducer source is a generic board.   |
| `NetworkGraph`  | `view.graph = { nodes, edges, pieces }`         | Project display-ready node positions and piece placement in the reducer view.                                                                            |
| `ZoneMap`       | `view.map = { zones, pieces }`                  | Project region polygons and piece assignments in the reducer view.                                                                                       |
| `SlotSystem`    | `view.slots` and `view.occupants`               | Prefer reducer-native `ViewSlotOccupant[]` from slot queries. Flatten keyed query results before rendering.                                              |

`HexGrid`, `SquareGrid`, `useBoardTopology(...)`, `useHexBoard(...)`, and
`useSquareBoard(...)` now accept generated tiled board-state records directly.
Pass the reducer-projected board object without remapping `spaces` into
`tiles` or `cells`. These inputs are also readonly-friendly, so `readonly`
edge, vertex, card, slot, and occupant arrays work without cloning first.

For `HexGrid` and `SquareGrid`, keep legal target IDs beside the board in the
view:

```ts
return {
  board: q.board.tiled("arena"),
  legalEdgeIds: state.publicState.legalEdgeIds,
  legalVertexIds: state.publicState.legalVertexIds,
};
```

That lets the UI keep board rendering declarative while still checking
game-specific legality:

```tsx
<HexGrid
  board={view.board}
  interactiveEdges={true}
  interactiveVertices={true}
  onInteractiveEdgeClick={(edge) => {
    if (!view.legalEdgeIds.includes(edge.id)) return;
    onEdgeClick(edge.id);
  }}
  onInteractiveVertexClick={(vertex) => {
    if (!view.legalVertexIds.includes(vertex.id)) return;
    onVertexClick(vertex.id);
  }}
/>
```

### Board topology hooks

Use the headless topology hooks when a component needs adjacency, distance, or
edge and vertex lookups in UI code.

| Hook                      | Use it for                                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `useBoardTopology(board)` | Shared hex and square queries such as adjacency, incidence, and occupancy lookups                           |
| `useHexBoard(board)`      | Hex coordinate helpers such as `getTileAt(...)`, neighbors, and range checks                                |
| `useSquareBoard(board)`   | Square coordinate helpers such as `getCellAt(...)`, orthogonal or diagonal neighbors, and distance variants |

Reducer views should project board data plus legal or highlighted target IDs.
The UI should then:

- render `HexGrid` or `SquareGrid`
- wire `interactiveEdges` and `interactiveVertices` to click handlers
- use the topology hook for UI-local geometry questions

```tsx
import { useSquareBoard } from "@dreamboard/ui-sdk";
import { SquareGrid } from "./components/dreamboard";

function ArenaBoard({ board, onEdgeClick, onVertexClick }) {
  const topology = useSquareBoard(board);

  return (
    <SquareGrid
      {...board}
      pieces={board.pieces}
      interactiveEdges={true}
      interactiveVertices={true}
      onInteractiveEdgeClick={(edge) => onEdgeClick(edge.id)}
      onInteractiveVertexClick={(vertex) => onVertexClick(vertex.id)}
      renderCell={(row, col) => {
        const cell = topology.getCellAt(row, col);
        return <Cell ownerId={cell?.owner ?? null} />;
      }}
      renderPiece={(piece) => <Piece piece={piece} />}
    />
  );
}
```

The same interaction pattern works with `HexGrid` and `useHexBoard(...)`.

`SquareGrid` supports the same edge and vertex interaction callbacks as
`HexGrid`, including:

- `interactiveEdges`
- `interactiveVertices`
- `onInteractiveEdgeClick`
- `onInteractiveVertexClick`
- matching enter, leave, and custom render callbacks

### `TrackBoard` props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `spaces` | `TrackSpace[]` | Yes | `spaces` value |
| `pieces` | `TrackPiece[]` | Yes | `pieces` value |
| `type` | `'linear' \| 'circular' \| 'branching'` | No | `type` value |
| `renderSpace` | `(space: TrackSpace, pieces: TrackPiece[]) => ReactNode` | Yes | `renderSpace` value |
| `renderConnection` | `(from: { x: number; y: number }, to: { x: number; y: number }, fromSpace: TrackSpace, toSpace: TrackSpace) => ReactNode` | No | `renderConnection` value |
| `renderJump` | `(from: { x: number; y: number }, to: { x: number; y: number }, fromSpace: TrackSpace, toSpace: TrackSpace, isUp: boolean) => ReactNode` | No | `renderJump` value |
| `width` | `number \| string` | No | `width` value |
| `height` | `number \| string` | No | `height` value |
| `enablePanZoom` | `boolean` | No | `enablePanZoom` value |
| `initialZoom` | `number` | No | `initialZoom` value |
| `minZoom` | `number` | No | `minZoom` value |
| `maxZoom` | `number` | No | `maxZoom` value |
| `className` | `string` | No | `className` value |

### `SquareGrid` props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `rows` | `number` | No | `rows` value |
| `cols` | `number` | No | `cols` value |
| `cells` | `readonly GridCell[]` | No | `cells` value |
| `spaces` | `Readonly<Record<string, GeneratedSquareSpaceStateLike>>` | No | `spaces` value |
| `pieces` | `readonly GridPiece[]` | No | `pieces` value |
| `edges` | `readonly SquareGridEdge[]` | No | `edges` value |
| `vertices` | `readonly SquareGridVertex[]` | No | `vertices` value |
| `cellSize` | `number` | No | `cellSize` value |
| `renderCell` | `(row: number, col: number) => ReactNode` | Yes | Receives row/col with transform centered at cell position |
| `renderPiece` | `(piece: GridPiece) => ReactNode` | Yes | Receives piece with transform centered at cell center |
| `renderEdge` | `(edge: SquareGridEdge, position: SquareEdgePosition) => ReactNode` | No | `renderEdge` value |
| `renderVertex` | `(vertex: SquareGridVertex, position: SquareVertexPosition) => ReactNode` | No | `renderVertex` value |
| `showCoordinates` | `boolean` | No | `showCoordinates` value |
| `coordinateStyle` | `'algebraic' \| 'numeric' \| 'none'` | No | `coordinateStyle` value |
| `width` | `number \| string` | No | `width` value |
| `height` | `number \| string` | No | `height` value |
| `enablePanZoom` | `boolean` | No | `enablePanZoom` value |
| `initialZoom` | `number` | No | `initialZoom` value |
| `minZoom` | `number` | No | `minZoom` value |
| `maxZoom` | `number` | No | `maxZoom` value |
| `className` | `string` | No | `className` value |
| `interactiveEdges` | `boolean` | No | `interactiveEdges` value |
| `interactiveVertices` | `boolean` | No | `interactiveVertices` value |
| `onInteractiveEdgeClick` | `(edge: InteractiveSquareEdge) => void` | No | `onInteractiveEdgeClick` value |
| `onInteractiveEdgeEnter` | `(edge: InteractiveSquareEdge) => void` | No | `onInteractiveEdgeEnter` value |
| `onInteractiveEdgeLeave` | `(edge: InteractiveSquareEdge) => void` | No | `onInteractiveEdgeLeave` value |
| `onInteractiveVertexClick` | `(vertex: InteractiveSquareVertex) => void` | No | `onInteractiveVertexClick` value |
| `onInteractiveVertexEnter` | `(vertex: InteractiveSquareVertex) => void` | No | `onInteractiveVertexEnter` value |
| `onInteractiveVertexLeave` | `(vertex: InteractiveSquareVertex) => void` | No | `onInteractiveVertexLeave` value |
| `renderInteractiveEdge` | `(edge: InteractiveSquareEdge, isHovered: boolean) => ReactNode` | No | `renderInteractiveEdge` value |
| `renderInteractiveVertex` | `(vertex: InteractiveSquareVertex, isHovered: boolean) => ReactNode` | No | `renderInteractiveVertex` value |

### `HexGrid` props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `tiles` | `readonly HexTileState[]` | No | `tiles` value |
| `spaces` | `Readonly<Record<string, GeneratedHexSpaceStateLike>>` | No | `spaces` value |
| `edges` | `readonly (HexEdgeState \| GeneratedTiledEdgeStateLike)[]` | No | `edges` value |
| `vertices` | `readonly (HexVertexState \| GeneratedTiledVertexStateLike)[]` | No | `vertices` value |
| `orientation` | `HexOrientation` | No | `orientation` value |
| `hexSize` | `number` | No | Hex radius in pixels |
| `renderTile` | `(tile: HexTileState) => ReactNode` | Yes | Receives tile data centered at (0,0) |
| `renderEdge` | `(edge: HexEdgeState, position: EdgePosition) => ReactNode` | Yes | Receives edge geometry in absolute SVG coordinates. Use `position.edgeAngle` to align artwork with the visible edge. |
| `renderVertex` | `(vertex: HexVertexState, position: { x: number; y: number }) => ReactNode` | Yes | `renderVertex` value |
| `width` | `number \| string` | No | `width` value |
| `height` | `number \| string` | No | `height` value |
| `enablePanZoom` | `boolean` | No | `enablePanZoom` value |
| `initialZoom` | `number` | No | `initialZoom` value |
| `minZoom` | `number` | No | `minZoom` value |
| `maxZoom` | `number` | No | `maxZoom` value |
| `className` | `string` | No | `className` value |
| `interactiveVertices` | `boolean` | No | Auto-generates clickable vertex points (deduplicated where tiles meet) |
| `interactiveEdges` | `boolean` | No | Auto-generates clickable edges (deduplicated where tiles meet) |
| `onInteractiveVertexClick` | `(vertex: InteractiveVertex) => void` | No | `onInteractiveVertexClick` value |
| `onInteractiveVertexEnter` | `(vertex: InteractiveVertex) => void` | No | `onInteractiveVertexEnter` value |
| `onInteractiveVertexLeave` | `(vertex: InteractiveVertex) => void` | No | `onInteractiveVertexLeave` value |
| `onInteractiveEdgeClick` | `(edge: InteractiveEdge) => void` | No | `onInteractiveEdgeClick` value |
| `onInteractiveEdgeEnter` | `(edge: InteractiveEdge) => void` | No | `onInteractiveEdgeEnter` value |
| `onInteractiveEdgeLeave` | `(edge: InteractiveEdge) => void` | No | `onInteractiveEdgeLeave` value |
| `renderInteractiveVertex` | `(vertex: InteractiveVertex, position: { x: number; y: number }, isHovered: boolean) => ReactNode` | No | Receives vertex geometry in absolute SVG coordinates. |
| `renderInteractiveEdge` | `(edge: InteractiveEdge, position: EdgePosition, isHovered: boolean) => ReactNode` | No | Receives edge geometry in the same absolute SVG coordinates as `renderEdge`. |
| `interactiveVertexSize` | `number` | No | `interactiveVertexSize` value |
| `interactiveEdgeSize` | `number` | No | `interactiveEdgeSize` value |

#### `HexGrid` coordinate model

<Info>
  `HexGrid` uses one coordinate model for edges and vertices. `renderEdge`,
  `renderInteractiveEdge`, `renderVertex`, and `renderInteractiveVertex` all
  receive absolute SVG coordinates. Only `renderTile` stays local to a tile and
  renders with the tile centered at `(0, 0)`.
</Info>

For edge geometry:

- `position.edgeAngle` follows the visible edge line.
- `position.centerAngle` follows the line from one adjacent hex center to the
  other.

```tsx
<HexGrid
  board={view.board}
  interactiveEdges={true}
  renderInteractiveEdge={(edge, position, isHovered) => (
    <rect
      x={position.midX - 18}
      y={position.midY - 4}
      width={36}
      height={8}
      rx={4}
      fill={isHovered ? "#f97316" : "#cbd5e1"}
      transform={`rotate(${position.edgeAngle} ${position.midX} ${position.midY})`}
    />
  )}
/>
```

### `NetworkGraph` props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `nodes` | `NetworkNode[]` | Yes | `nodes` value |
| `edges` | `NetworkEdge[]` | Yes | `edges` value |
| `pieces` | `NetworkPiece[]` | Yes | `pieces` value |
| `renderNode` | `(node: NetworkNode, pieces: NetworkPiece[]) => ReactNode` | Yes | Receives node centered at its position |
| `renderEdge` | `(edge: NetworkEdge, fromNode: NetworkNode, toNode: NetworkNode) => ReactNode` | Yes | `renderEdge` value |
| `renderPiece` | `(piece: NetworkPiece, position: { x: number; y: number }) => ReactNode` | Yes | `renderPiece` value |
| `width` | `number \| string` | No | `width` value |
| `height` | `number \| string` | No | `height` value |
| `nodeRadius` | `number` | No | `nodeRadius` value |
| `enablePanZoom` | `boolean` | No | `enablePanZoom` value |
| `initialZoom` | `number` | No | `initialZoom` value |
| `minZoom` | `number` | No | `minZoom` value |
| `maxZoom` | `number` | No | `maxZoom` value |
| `padding` | `number` | No | `padding` value |
| `className` | `string` | No | `className` value |

### `ZoneMap` props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `zones` | `ZoneDefinition[]` | Yes | `zones` value |
| `pieces` | `ZonePiece[]` | Yes | `pieces` value |
| `renderZone` | `(zone: ZoneDefinition, pieces: ZonePiece[]) => ReactNode` | Yes | `renderZone` value |
| `backgroundImage` | `string` | No | `backgroundImage` value |
| `width` | `number \| string` | No | `width` value |
| `height` | `number \| string` | No | `height` value |
| `enablePanZoom` | `boolean` | No | `enablePanZoom` value |
| `initialZoom` | `number` | No | `initialZoom` value |
| `minZoom` | `number` | No | `minZoom` value |
| `maxZoom` | `number` | No | `maxZoom` value |
| `className` | `string` | No | `className` value |

### `SlotSystem` props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `slots` | `readonly SlotDefinition[]` | Yes | `slots` value |
| `occupants` | `readonly SlotOccupant[]` | Yes | `occupants` value |
| `renderSlot` | `(slot: SlotDefinition, occupants: SlotOccupant[]) => ReactNode` | Yes | `renderSlot` value |
| `layout` | `'grid' \| 'list' \| 'grouped'` | No | `layout` value |
| `width` | `number \| string` | No | `width` value |
| `height` | `number \| string` | No | `height` value |
| `minSlotWidth` | `number` | No | Minimum slot width for responsive grid |
| `className` | `string` | No | `className` value |

### Rendering strict manifest slots

When reducer state projects strict slot placements, use the slot queries from
`createTableQueries(...)` and feed the returned `ViewSlotOccupant[]` values
directly into `SlotSystem`.

Project one host's slots into the reducer view:

```ts
import { z } from "zod";
import { createTableQueries, defineView } from "@dreamboard/app-sdk/reducer";
import type { GameContract } from "./game-contract";

export const playerView = defineView<GameContract>()({
  schema: z.object({
    matOccupantsBySlotId: z.record(
      z.string(),
      z.array(
        z.object({
          pieceId: z.string(),
          playerId: z.string().nullable(),
          slotId: z.string(),
          data: z.record(z.string(), z.unknown()).optional(),
        }),
      ),
    ),
  }),
  project({ state }) {
    const q = createTableQueries(state.table);

    return {
      matOccupantsBySlotId: q.slot.pieceOccupantsByHost("mat-alpha"),
    };
  },
});
```

Then render those occupants directly:

```tsx
import { type SlotDefinition, useGameView } from "@dreamboard/ui-sdk";
import { SlotSystem } from "./components/dreamboard";

const playerMatSlots: SlotDefinition[] = [
  {
    id: "mat-alpha:worker-rest",
    name: "Worker Rest",
    owner: "player-1",
    capacity: 1,
    group: "player-1",
  },
];

export function PlayerMatSlots() {
  const view = useGameView();
  const occupants = Object.values(view.matOccupantsBySlotId).flat();

  return (
    <SlotSystem
      slots={playerMatSlots}
      occupants={occupants}
      renderSlot={(slot, slotOccupants) => (
        <div>
          <strong>{slot.name}</strong>
          <div>
            {slotOccupants.map((entry) => entry.pieceId).join(", ") || "Empty"}
          </div>
        </div>
      )}
    />
  );
}
```

If you need one `SlotSystem` to render multiple hosts at once, project a view
shape with composite `slotId`s such as `${hostId}:${slotId}`. For a single
host, the query result is already in the right reducer-native shape.

## Board primitive data shapes

The board primitive prop tables reference value types such as `HexTileState[]`
and `SquarePieceState[]`. Those are root exports from `@dreamboard/ui-sdk`, so
CLI-only authors can import and construct them directly.

| Type                                                                          | Use it for                                                |
| ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| `HexTileState`, `HexEdgeState`, `HexVertexState`, `HexOrientation`            | `HexGrid` input data                                      |
| `SquareCellState`, `SquarePieceState`, `SquareEdgeState`, `SquareVertexState` | `SquareGrid` input data                                   |
| `InteractiveHexEdge`, `InteractiveHexVertex`                                  | `HexGrid` interactive overlay callbacks                   |
| `InteractiveSquareEdge`, `InteractiveSquareVertex`                            | `SquareGrid` interactive overlay callbacks                |
| `TrackSpace`, `TrackPiece`                                                    | `TrackBoard` input data                                   |
| `NetworkNode`, `NetworkEdge`, `NetworkPiece`                                  | `NetworkGraph` input data                                 |
| `ZoneDefinition`, `ZonePiece`, `ZoneShape`                                    | `ZoneMap` input data                                      |
| `SlotDefinition`, `ViewSlotOccupant`                                          | `SlotSystem` input data                                   |
| `ViewCard`, `CardCollection`                                                  | reducer-native card collections for `Hand` and `PlayArea` |

### `HexGrid` data

`HexGrid` expects reducer-projected or manually-authored hex topology records.

| Type             | Core fields                    | Notes                                                                           |
| ---------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| `HexTileState`   | `id`, `q`, `r`                 | Optional `typeId`, `label`, `owner`, `properties`                               |
| `HexEdgeState`   | `id`, `hex1`, `hex2`           | Optional `typeId`, `owner`, `properties`                                        |
| `HexVertexState` | `id`, `hexes`                  | `hexes` is the touching tile ID tuple; optional `typeId`, `owner`, `properties` |
| `HexOrientation` | `"pointy-top"` or `"flat-top"` | Matches your authored board orientation                                         |

```ts
import type {
  HexEdgeState,
  HexTileState,
  HexVertexState,
} from "@dreamboard/ui-sdk";

const tiles: HexTileState[] = [
  { id: "tile-a", q: 0, r: 0, label: "A" },
  { id: "tile-b", q: 1, r: 0, label: "B" },
];

const edges: HexEdgeState[] = [
  { id: "edge-a-b", hex1: "tile-a", hex2: "tile-b" },
];
const vertices: HexVertexState[] = [
  { id: "vertex-a-b-c", hexes: ["tile-a", "tile-b", "tile-c"] },
];
```

### `SquareGrid` data

| Type                      | Core fields                  | Notes                                             |
| ------------------------- | ---------------------------- | ------------------------------------------------- |
| `SquareCellState`         | `id`, `row`, `col`           | Optional `typeId`, `label`, `owner`, `properties` |
| `SquarePieceState`        | `id`, `row`, `col`           | Optional `typeId`, `owner`, `properties`          |
| `SquareEdgeState`         | `id`, `spaceIds`             | Optional `typeId`, `owner`, `label`, `properties` |
| `SquareVertexState`       | `id`, `spaceIds`             | Optional `typeId`, `owner`, `label`, `properties` |
| `InteractiveSquareEdge`   | `id`, `spaceIds`, `position` | Delivered to interactive edge callbacks           |
| `InteractiveSquareVertex` | `id`, `spaceIds`, `position` | Delivered to interactive vertex callbacks         |

### `TrackBoard` data

| Type         | Core fields               | Notes                                                   |
| ------------ | ------------------------- | ------------------------------------------------------- |
| `TrackSpace` | `id`, `index`, `position` | Optional `name`, `type`, `nextSpaces`, `jumpTo`, `data` |
| `TrackPiece` | `id`, `spaceId`, `owner`  | Optional `type`, `data`                                 |

### `NetworkGraph` data

| Type           | Core fields        | Notes                                     |
| -------------- | ------------------ | ----------------------------------------- |
| `NetworkNode`  | `id`, `position`   | Optional `label`, `type`, `data`          |
| `NetworkEdge`  | `id`, `from`, `to` | Optional `label`, `owner`, `type`, `data` |
| `NetworkPiece` | `id`, `nodeId`     | Optional `owner`, `type`, `data`          |

### `ZoneMap` data

| Type             | Core fields                | Notes                                                         |
| ---------------- | -------------------------- | ------------------------------------------------------------- |
| `ZoneShape`      | `type`                     | Use polygon `points`, SVG `path`, or circle `center`/`radius` |
| `ZoneDefinition` | `id`, `name`, `adjacentTo` | Optional `shape`, `value`, `type`, `data`                     |
| `ZonePiece`      | `id`, `zoneId`, `type`     | Optional `owner`, `count`, `data`                             |

### `SlotSystem` data

| Type               | Core fields                     | Notes                                                                                               |
| ------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------- |
| `SlotDefinition`   | `id`, `name`, `capacity`        | Optional `description`, `exclusive`, `owner`, `group`, `cost`, `reward`, `type`, `position`, `data` |
| `ViewSlotOccupant` | `pieceId`, `playerId`, `slotId` | Optional `data`; `playerId` may be `null` for shared or unowned occupants                           |

## Exported types

All of the types below are root exports from `@dreamboard/ui-sdk`.

### Gameplay/runtime exports

Use these when the UI needs to type reducer-owned runtime data.

| Type                     | Meaning                                                |
| ------------------------ | ------------------------------------------------------ |
| `PhaseActions<Phase>`    | Current phase action API returned by `useActions()`    |
| `ActionDefinition`       | One available action from gameplay state               |
| `GameplayPromptInstance` | One typed active prompt instance                       |
| `GameplayWindowInstance` | One typed active window instance                       |
| `GameplaySnapshot`       | Transport state that sits alongside the projected view |
| `PluginStateSnapshot`    | Complete state-sync payload delivered to the plugin    |
| `LobbyState`             | Current lobby seats and host metadata                  |
| `Player`                 | Simplified player metadata from the lobby              |

### Board/UI exports

Use these when the UI constructs board data manually or wants strong typing for
render callbacks and helper components.

| Type                                                                                               | Meaning                                    |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `HexTileState`, `HexEdgeState`, `HexVertexState`, `HexOrientation`                                 | `HexGrid` value types                      |
| `SquareCellState`, `SquarePieceState`, `SquareEdgeState`, `SquareVertexState`                      | `SquareGrid` value types                   |
| `InteractiveHexVertex`, `InteractiveHexEdge`                                                       | `HexGrid` interactive callback payloads    |
| `InteractiveSquareEdge`, `InteractiveSquareVertex`                                                 | `SquareGrid` interactive callback payloads |
| `TrackSpace`, `TrackPiece`                                                                         | `TrackBoard` value types                   |
| `NetworkNode`, `NetworkEdge`, `NetworkPiece`                                                       | `NetworkGraph` value types                 |
| `ZoneDefinition`, `ZonePiece`, `ZoneShape`, `ZoneHighlightType`                                    | `ZoneMap` value types                      |
| `SlotDefinition`, `SlotOccupant`, `ViewSlotOccupant`                                               | `SlotSystem` value types                   |
| `ViewCard`, `CardCollection`                                                                       | reducer-native card view types             |
| `HandCardRenderProps`, `HandDrawerRenderProps`, `HandEmptyRenderProps`, `HandContainerRenderProps` | `Hand` render callback payloads            |
| `DiceRollerRenderProps`                                                                            | `DiceRoller` render callback payload       |

### Root hook exports

These hooks are also available from the root package when you need runtime
state selectors or reducer-native board helpers without importing internal
paths.

| Export                                              | Meaning                                                                     |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| `useBoardTopology`, `useHexBoard`, `useSquareBoard` | Query reducer-projected tiled boards without widening board IDs to `string` |
| `useCards`                                          | Materialize ordered `ViewCard[]` from a reducer-native `CardCollection`     |
| `toTrackBoardData`                                  | Convert reducer-projected generic boards into `TrackBoard` props            |
