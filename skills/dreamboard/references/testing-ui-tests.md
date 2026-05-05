# UI tests

Test workspace UI with reducer-native runtime providers.

Use `createTestRuntime` for backend-free React tests that need real
Dreamboard runtime context. It creates an in-memory runtime from a generated
base state, drives the same reducer bundle as scenarios, and feeds snapshots
through the UI host runtime store.

This is for UI logic tests, not browser end-to-end tests.

## Generate first

UI tests depend on generated base states:

```bash
dreamboard test generate
```

If the base state is missing or stale, regenerate before debugging React.

## Basic harness

```tsx
import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  PluginStateProvider,
  RuntimeProvider,
  useGameView,
  useIsMyTurn,
} from "@dreamboard/ui-sdk";
import { useInteractionByKey } from "../shared/generated/ui-contract";
import { createTestRuntime } from "../test/testing-types";

function Probe() {
  const view = useGameView();
  const placeThing = useInteractionByKey("placeThing.placeThingCard");
  const isMyTurn = useIsMyTurn();

  return (
    <div
      data-is-my-turn={isMyTurn ? "true" : "false"}
      data-surface={placeThing?.descriptor.surface ?? "missing"}
      data-hand-size={view.handCards.length}
    />
  );
}

function renderTree(runtime: ReturnType<typeof createTestRuntime>) {
  return renderToStaticMarkup(
    <RuntimeProvider runtime={runtime.runtime}>
      <PluginStateProvider>
        <Probe />
      </PluginStateProvider>
    </RuntimeProvider>,
  );
}

test("renders the initial playable hand", () => {
  const runtime = createTestRuntime({
    baseId: "initial-turn",
    phase: "placeThing",
    controllingPlayerId: "player-2",
  });

  const markup = renderTree(runtime);

  assert.match(markup, /data-is-my-turn="true"/);
  assert.match(markup, /data-surface="hand"/);
  assert.match(markup, /data-hand-size="5"/);
});
```

The important providers are:

| Provider | Purpose |
| --- | --- |
| `RuntimeProvider` | Supplies the in-memory `RuntimeAPI`. |
| `PluginStateProvider` | Supplies reducer-projected plugin state to UI hooks. |

## Runtime options

```ts
const runtime = createTestRuntime({
  baseId: "initial-turn",
  phase: "placeThing",
  controllingPlayerId: "player-2",
  userId: "test-user",
});
```

Options:

| Option | Meaning |
| --- | --- |
| `baseId` | Generated base state id. Required. |
| `phase` | Optional expected phase for the initial snapshot. |
| `controllingPlayerId` | Seat controlled by the rendered UI. |
| `userId` | Test user id; defaults to `"test-user"`. |

`baseId` is typed to generated `BASE_STATES`, so misspelled bases fail at
compile time.

## Submitting interactions

`createTestRuntime` returns helpers for driving state:

```tsx
const runtime = createTestRuntime({
  baseId: "initial-turn",
  phase: "placeThing",
  controllingPlayerId: "player-2",
});

await runtime.submit(runtime.seat(1), "placeThingCard", {
  cardId: "a-diamond",
  ringId: "ring-1",
});

const after = renderTree(runtime);
assert.match(after, /data-hand-size="4"/);
```

Submission validates input, dispatches through the reducer bundle, applies a
fresh gameplay snapshot, and notifies UI subscribers.

## Switching seats

Use `setControllingPlayer` to test player-specific views:

```tsx
runtime.setControllingPlayer("player-3");

const markup = renderTree(runtime);
assert.match(markup, /data-is-my-turn="false"/);
```

This exercises the same session-store path used by host player switching.

## What to test here

Good UI runtime tests:

- hooks see the expected phase, view, and available interactions
- `useIsMyTurn` and controlling-player changes behave correctly
- custom `WorkspaceGameShell` surface renderers receive descriptors
- card hands update after reducer submissions
- prompt or blocker UI appears for the addressed seat only

Avoid testing browser-only layout here. Use the local dev host or browser runner
for screenshots, pointer events, and CSS layout issues.

## TSX runtime config

Reducer-native UI tests that import React components from workspace or SDK
sources may need a TSX-specific test tsconfig that enables the React JSX
transform for those sources. Keep that config separate from the normal
`test/tsconfig.json`; broadening the normal typecheck include can pull SDK
fixtures into `tsc --noEmit`.
