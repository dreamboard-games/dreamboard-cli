# @dreamboard/ui-sdk

Reducer-native UI SDK for Dreamboard game workspaces.

## Authored API

Game UIs should import authored hooks from `@dreamboard/ui-sdk`. The default
UI component files now scaffold into local game workspaces under
`ui/components/dreamboard`.

Supported authored hooks:

- `useGameView()`
- `useGameSelector(selector)`
- `useActions()`
- `useGameplayPrompts()`
- `useGameplayWindows()`
- `usePluginSession()`
- `useLobby()`
- `useMe()`
- `usePlayerInfo()`

Scaffolded local components include:

- `PluginRuntime`
- `ErrorBoundary`
- `ToastProvider`
- `GameSkeleton`
- `Card`
- `Hand`
- `PlayArea`
- `PlayerInfo`
- `HexGrid`
- `TrackBoard`
- `NetworkGraph`
- `SquareGrid`
- `ZoneMap`
- `SlotSystem`
- action/status primitives such as `ActionButton`, `ActionPanel`,
  `PhaseIndicator`, `ResourceCounter`, and `CostDisplay`

Raw gameplay state hooks, raw board hooks, and runtime bootstrap internals are
not part of the authored surface anymore.

## Data Model

Reducer-native plugins receive:

- player-facing reducer view data
- current phase
- available actions
- prompts
- windows
- lobby/session metadata

They do not receive raw table-state snapshots.

## Example

```tsx
import { useActions, useGameView, usePluginSession } from "@dreamboard/ui-sdk";
import { createRoot } from "react-dom/client";
import {
  ErrorBoundary,
  GameSkeleton,
  PluginRuntime,
  ToastProvider,
} from "./components/dreamboard";

function AppLoader() {
  const { status } = usePluginSession();

  if (status === "loading") {
    return <GameSkeleton variant="default" message="Loading game..." />;
  }

  return <App />;
}

function App() {
  const phase = useActions();
  const view = useGameView();

  return (
    <main>
      <h1>Phase: {phase.phase}</h1>
      <pre>{JSON.stringify(view, null, 2)}</pre>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <PluginRuntime>
      <ToastProvider>
        <AppLoader />
      </ToastProvider>
    </PluginRuntime>
  </ErrorBoundary>,
);
```

## Authoring Rules

1. Put durable game logic in reducers under `app/`.
2. Put player-facing derived data in reducer views.
3. Read that data in React with `useGameView()` or `useGameSelector(...)`.
4. Submit gameplay through `useActions()`.
5. Feed board/card/resource components from reducer view data, not from raw
   engine state.

## References

- Workspace reference:
  `/Users/kevintang/code/exp/examples/things-in-rings`
- Use `examples/things-in-rings` and scaffolded workspace UI files as the
  canonical reducer-native reference implementation.
