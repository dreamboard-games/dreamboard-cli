# WorkspaceGameShell

Use the generated workspace shell for reducer-native React UI.

`WorkspaceGameShell` is the canonical starting point for authored Dreamboard
React UI. It is generated for the current workspace, so its surface render maps,
hand-zone keys, interaction keys, and client param schemas are narrowed to the
game you authored.

```tsx
import { WorkspaceGameShell } from "@dreamboard/ui-contract";
```

Use the generic `GameShell` from `@dreamboard/ui-sdk` only for framework-level
components or a custom shell that deliberately bypasses generated workspace
typing.

## What it wires

`WorkspaceGameShell` composes the SDK surfaces around your board renderer:

- `panel` actions
- `inbox` prompt interactions
- `hand` zones and card actions
- `blocker` modal interactions
- `chrome` interactions and primary action chrome
- board-surface descriptors exposed to the `board` render prop

The generated shell also forwards `clientParamSchemas`, translates generated
hand-zone keys such as `devHand` back to manifest zone ids such as `dev-hand`,
and defaults `chrome.primaryAction` to `"auto"` when you do not supply one.

## Minimal shell

```tsx
import { useGameView } from "@dreamboard/ui-sdk";
import { WorkspaceGameShell } from "@dreamboard/ui-contract";

export default function App() {
  const view = useGameView();

  return (
    <WorkspaceGameShell
      title="Ring Arena"
      board={() => <RingBoard zones={view.zones} />}
    />
  );
}
```

With no `surfaces` overrides, the SDK default renderers keep every projected
interaction reachable.

## Board slot

The `board` prop receives a reducer-aware board interaction context. For simple
boards, use the typed `select.<kind>` helpers:

```tsx
<WorkspaceGameShell
  board={({ eligible, select }) => (
    <HexGrid
      board={view.board}
      interactiveVertices={{
        eligible: eligible.vertex,
        selectTargetId: (id) => select.vertex(id),
      }}
      interactiveEdges={{
        eligible: eligible.edge,
        selectTargetId: (id) => select.edge(id),
      }}
    />
  )}
/>
```

For board-heavy games, keep board rendering in a local component and call the
generated `useBoardInteractions()` wrapper inside that component. That is the
Catan-class pattern because several build, robber, setup, and card follow-up
interactions can all be live on the same geometry.

## Surface overrides

Use `surfaces` when a default renderer is not enough:

```tsx
<WorkspaceGameShell
  surfaces={{
    panel: {
      "playerTurn.tradeWithBank": (descriptor, handle) => (
        <BankTradeCard descriptor={descriptor} handle={handle} />
      ),
    },
    inbox: {
      "playerTurn.respondToTrade": (descriptor, handle) => (
        <TradeResponsePrompt descriptor={descriptor} handle={handle} />
      ),
    },
    blocker: {
      "playerTurn.discardCards": (descriptor, handle) => (
        <DiscardResourcesDialog descriptor={descriptor} handle={handle} />
      ),
    },
  }}
/>
```

The generated contract constrains each bucket to the interactions authored for
that surface. A typo or a panel interaction placed under `inbox` is a type
error.

## Hand zones

Hand zones use generated JS-friendly keys:

```tsx
<WorkspaceGameShell
  surfaces={{
    hand: {
      zones: {
        devHand: (cards, contexts) => (
          <DevelopmentHand cards={cards} contexts={contexts} />
        ),
      },
    },
  }}
/>
```

`zones` renders a generated zone once as a real hand. `interactions` handles
descriptor-level hand interactions that are not covered by a zone renderer.
When a zone renderer is present, the shell suppresses fallback buttons for
descriptors in that zone so cards do not render twice.

## Chrome and HUD

Use `chrome` for persistent shell chrome around the board:

```tsx
<WorkspaceGameShell
  chrome={{
    primaryAction: "auto",
    resources: <ResourceCounter resources={resources} counts={view.myResources} />,
  }}
/>
```

`primaryAction: "auto"` lets the shell pick the most appropriate currently
available primary descriptor, using reducer-authored metadata such as
`emphasis`, `salience`, and `presentation`.

Use `hud` when the game needs a richer board-game layout with opponent rail,
self playmat, and a status banner:

```tsx
<WorkspaceGameShell
  hud={{
    self,
    opponents,
    status: {
      phase: gameplayPhase ?? "setup",
      phaseLabels: { setup: "Setup", playerTurn: "Player turn" },
      isMyTurn,
      waitingFor,
      tip: view.diceRolled ? "Build, trade, or end your turn." : "Roll first.",
    },
  }}
/>
```

`hud` owns identity and status chrome. `chrome.primaryAction` and
`chrome.resources` still work alongside it.

## Layout and theme

`layout` is structural. `theme` and `themeOverride` control theme tokens:

```tsx
<WorkspaceGameShell
  theme="tabletop"
  themeOverride={{
    radius: { md: "10px" },
  }}
  layout={{
    maxWidth: "min(1400px, calc(100vw - 24px))",
    boardFrame: "none",
  }}
/>
```

## When to skip it

Skip `WorkspaceGameShell` only when the whole screen layout is custom. In that
case, compose `PanelSurface`, `InboxSurface`, `HandSurface`, `BoardSurface`,
`BlockerSurface`, and `ChromeSurface` directly, but keep using the generated
`useInteractionByKey` and `useBoardInteractions` wrappers for typed
submission.
