# UI architecture

Understand the generated UI contract, UI SDK, and host runtime boundaries.

Dreamboard UI is reducer-driven. The reducer bundle projects the current
player's view and available interactions; the React UI renders those projected
descriptors and submits typed params back to the runtime.

The important rule: do not reimplement legality in React. UI code may choose
layout, labels, highlights, and controls, but availability, eligible targets,
prompt options, and submitted param shapes should come from authored contracts
and generated types.

## Layers

| Layer | Import path | Owns |
| --- | --- | --- |
| Workspace UI contract | `@dreamboard/ui-contract` | Game-specific `WorkspaceGameShell`, `useInteractionByKey`, `useBoardInteractions`, interaction key unions, param types, zone keys, and client param schemas. |
| UI SDK | `@dreamboard/ui-sdk` and `@dreamboard/ui-sdk/components` | Generic React contexts, hooks, surfaces, board primitives, card primitives, and default interaction renderers. |
| Host runtime | Provided by the dev/play host | Session state, state-sync snapshots, interaction submission, validation RPCs, player switching, history restore, and host-only feedback. |

Most authored UIs should import the generated contract first:

```tsx
import {
  WorkspaceGameShell,
  useBoardInteractions,
  useInteractionByKey,
  type InteractionParamsOf,
} from "@dreamboard/ui-contract";
```

Use `@dreamboard/ui-sdk` directly for generic view/session hooks and generic
components:

```tsx
import {
  useGameView,
  useMe,
  usePlayerInfo,
  usePluginSession,
} from "@dreamboard/ui-sdk";
import { Card, Hand, HexGrid } from "@dreamboard/ui-sdk/components";
```

## Data flow

1. Authoring files declare manifest objects, phases, interactions, card
   actions, inputs, targets, and views.
2. `dreamboard sync` generates workspace contracts, including
   `@dreamboard/ui-contract`.
3. The trusted bundle evaluates the current seat and projects
   `availableInteractions` into plugin state.
4. Surfaces read those descriptors with `useSeatInbox`, `WorkspaceGameShell`, or typed
   hooks.
5. UI submits through an `InteractionHandle`, never by constructing runtime
   calls by hand.

The descriptor is the UI contract. It carries `interactionKey`, `interactionId`,
`surface`, `label`, `shortLabel`, `description`, `icon`, `emphasis`, `group`,
`available`, `unavailableReason`, target eligibility, prompt options, phase
metadata, and zone metadata when available.

## Generated UI contract

The generated contract specializes generic SDK helpers to the workspace:

```tsx
import {
  WorkspaceGameShell,
  useInteractionByKey,
  type InteractionParamsOf,
} from "@dreamboard/ui-contract";

const handle = useInteractionByKey("playerTurn.tradeWithBank");
type TradeParams = InteractionParamsOf<"playerTurn.tradeWithBank">;
```

This gives you compile-time checks that:

- the interaction key exists
- the interaction lives on the surface you render it from
- `handle.submit`, `handle.setInput`, and `handle.draft` use the declared input
  shape
- hand zone keys use JS-friendly generated names such as `devHand` instead of
  hand-written string translations

The generated `WorkspaceGameShell` also forwards generated client param schemas into the
SDK shell, so `submitDraft` can validate drafted params before submission.

## Root runtime

A workspace root normally mounts the app inside runtime and error boundaries:

```tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary, PluginRuntime } from "./components/dreamboard";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <PluginRuntime>
      <App />
    </PluginRuntime>
  </ErrorBoundary>,
);
```

Inside `App`, read the projected game view and render a shell:

```tsx
import { useGameView } from "@dreamboard/ui-sdk";
import { WorkspaceGameShell } from "@dreamboard/ui-contract";

export default function App() {
  const view = useGameView();

  return (
    <WorkspaceGameShell
      title={view.title}
      board={() => <Board view={view} />}
    />
  );
}
```

## Boundaries

Keep these boundaries strict:

| Put it here | Examples |
| --- | --- |
| Reducer authoring | Turn order, actor rules, prompt recipients, target eligibility, costs, validation, state transitions. |
| Generated UI contract | Interaction keys, phase-qualified param types, surface unions, workspace zone keys. |
| Authored React UI | Layout, styling, board geometry, card faces, component composition, selected draft inputs. |
| Host runtime | Player switching, session chrome, state-sync, submission transport, host-only notifications. |

Do not mirror host-only concepts into authored reducer state just to make UI
chrome easier. Do not copy target predicates into React just to enable or
disable a board element. If React needs a highlight, expose it through a target
collector or derived view.

## Choosing the right API

Use the highest-level API that fits:

| Need | Use |
| --- | --- |
| Standard mobile-first layout | [WorkspaceGameShell](./game-shell.md) |
| Custom board geometry with board target clicks | [Board surfaces](./board-surfaces.md) |
| Card hand or card action rendering | [Hand surfaces](./hand-surfaces.md) |
| Prompt or choice rendering | [Prompts and choices](./prompts-and-choices.md) |
| One-off visual override for an interaction | [Custom renderers](./custom-renderers.md) |
| Presentational cards, hands, grids, dice, players, and phase UI | [UI components](./ui-components.md) |

Bypass `WorkspaceGameShell` only when the whole screen layout is custom. Even then,
compose the same surfaces and typed hooks instead of reading
`availableInteractions` manually.
