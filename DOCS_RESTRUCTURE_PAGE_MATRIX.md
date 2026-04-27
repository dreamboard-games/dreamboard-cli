# Dreamboard public docs restructure page matrix

This is a planning artifact for the next public docs redesign. It is not part
of the Mintlify navigation yet.

## Goals

- Organize docs around author decisions, not historical package boundaries.
- Give every top-level authoring primitive a clear home.
- Keep one canonical path per task and call out escape hatches explicitly.
- Split reference material from pattern tutorials.
- Make genre tutorials original enough to avoid cloning protected themes, text,
  art, names, or exact rule expression.

## Proposed navigation

```text
Documentation
├─ Start
│  ├─ Overview
│  ├─ Quickstart
│  ├─ Workspace layout
│  ├─ Core concepts
│  └─ Authoring lifecycle
├─ Authoring
│  ├─ Manifest
│  ├─ Game contract
│  ├─ Game definition
│  ├─ Phases
│  ├─ Interactions
│  ├─ Card actions
│  ├─ Effects
│  ├─ Views
│  ├─ Static views
│  ├─ Derived values
│  ├─ Stages and zones
│  ├─ Inputs and targets
│  ├─ Setup bootstrap
│  └─ Table queries and ops
├─ UI
│  ├─ UI architecture
│  ├─ GameShell
│  ├─ Board surfaces
│  ├─ Hand surfaces
│  ├─ Prompts and choices
│  ├─ Custom renderers
│  └─ UI components
├─ Testing
│  ├─ Testing overview
│  ├─ Bases
│  ├─ Scenarios
│  ├─ Runtime assertions
│  ├─ UI tests
│  └─ Generated testing contracts
├─ Tutorials
│  ├─ First game
│  ├─ Hex trading and expansion
│  ├─ Worker placement
│  ├─ Deck-builder market
│  ├─ Trick-taking card game
│  ├─ Area control
│  └─ Route building
└─ Reference
   ├─ CLI
   ├─ Rule authoring
   ├─ Tiled board topology
   ├─ Public package surfaces
   └─ Troubleshooting
```

## Start pages

| Page | Proposed path | Current source | Purpose | Treatment |
| --- | --- | --- | --- | --- |
| Overview | `docs/index.mdx` | `docs/index.mdx` | Explain what Dreamboard is and show the smallest credible game loop. | Rewrite around the current manifest/contract/reducer/UI/testing lifecycle. |
| Quickstart | `docs/start/quickstart.mdx` | `docs/quickstart.mdx`, `docs/tutorials/building-your-first-game.mdx` | Get a new author from install to a running game. | Keep procedural, shorter than the current first-game tutorial. |
| Workspace layout | `docs/start/workspace-layout.mdx` | Current quickstart/tutorial fragments, scaffold files | Explain `manifest.ts`, `app/`, `ui/`, `test/`, generated contracts, and `rule.md`. | New page. |
| Core concepts | `docs/start/core-concepts.mdx` | `docs/concepts.mdx` | Define manifest, contract, phase, interaction, target, view, static view, derived, surface, scenario. | Rewrite glossary around current SDK vocabulary. |
| Authoring lifecycle | `docs/start/authoring-lifecycle.mdx` | `docs/index.mdx`, `docs/concepts.mdx` | Show the data flow from authored files to generated contracts and runtime messages. | New page with one diagram. |

## Authoring pages

| Page | Proposed path | Primary API | Current source | Purpose | Treatment |
| --- | --- | --- | --- | --- | --- |
| Manifest | `docs/authoring/manifest.mdx` | `defineTopologyManifest` | `docs/reference/manifest-authoring.mdx` | Define table topology, players, cards, zones, resources, boards, pieces, dice, and setup options. | Split the current long manifest page; keep this page as the concept and top-level shape. |
| Manifest fields | `docs/authoring/manifest-fields.mdx` | `defineTopologyManifest` field schemas | `docs/reference/manifest-authoring.mdx` | Reference field schemas, property maps, component homes, visibility, strict slots. | New split page. |
| Boards and topology | `docs/authoring/boards-and-topology.mdx` | board templates, boards, board refs | `docs/reference/manifest-authoring.mdx`, `docs/reference/tiled-board-topology.mdx` | Explain static board topology and authored IDs. | Split from topology reference; keep deep ID rules in Reference. |
| Game contract | `docs/authoring/game-contract.mdx` | `defineGameContract` | `docs/reference/reducer.mdx` | Declare state schemas, phase names, manifest-backed schemas, and generated contract ownership. | New focused page. |
| Game definition | `docs/authoring/game-definition.mdx` | `defineGame` | `docs/reference/reducer.mdx` | Register phases, views, setup profiles, static view, and initial phase. | New focused page. |
| Phases | `docs/authoring/phases.mdx` | `definePhase` | `docs/reference/reducer.mdx` | Explain phase state, interactions, effects, zones, card actions, and turn flow ownership. | New focused page. |
| Interactions | `docs/authoring/interactions.mdx` | `defineInteraction` | `docs/reference/reducer.mdx` | Author player commands, prompts, command surfaces, validation, and reducer callbacks. | Replace old `defineAction` / `defineFlow` language. |
| Card actions | `docs/authoring/card-actions.mdx` | `defineCardAction` | Current SDK, Catan migration notes | Explain first-class hand-play interactions, card targeting, zone rendering, and follow-up inputs. | New page; this deserves its own top-level page. |
| Effects | `docs/authoring/effects.mdx` | `defineEffect`, `fx.effect` | `docs/reference/reducer.mdx` | Explain engine-side continuations such as die rolls and shared-zone shuffles. | New page; explicitly separate prompts from effects. |
| Views | `docs/authoring/views.mdx` | `defineView` | `docs/reference/reducer.mdx` | Project seat-specific dynamic state for UI and API consumers. | Split from derived. |
| Static views | `docs/authoring/static-views.mdx` | `defineStaticView`, static board queries | Current SDK, Catan static-board work | Project session-scoped immutable data such as decorated topology. | New page; do not bury under views. |
| Derived values | `docs/authoring/derived-values.mdx` | `defineDerived` | `docs/reference/reducer.mdx` | Reusable pure computations over state and table queries. | Split from views; include anti-pattern against cached mirrors in `publicState`. |
| Stages and zones | `docs/authoring/stages-and-zones.mdx` | `defineStage`, `definePhaseStage`, `defineZone` | Current SDK, generated contract docs | Explain stage grouping and zone declarations. | New page, likely shorter. |
| Inputs and targets | `docs/authoring/inputs-and-targets.mdx` | `boardTarget`, `cardTarget`, `choiceTarget`, `promptInput`, `cardInput`, `formInput`, `rngInput` | Current SDK, target-rule migration notes | Explain finite eligibility, metadata, generated schemas, UI routing, and validation. | New page; central enough to stand alone. |
| Setup bootstrap | `docs/authoring/setup-bootstrap.mdx` | `applySetupBootstrap`, setup helpers | `docs/reference/reducer.mdx`, manifest setup sections | Explain profile-driven initial table setup. | New focused page. |
| Table queries and ops | `docs/authoring/table-queries-and-ops.mdx` | injected `q`, `ops`, `pipe` | `docs/reference/reducer.mdx` | Explain canonical table reads and writes inside reducers/views/derived values. | New page; remove old flat-helper framing. |

## UI pages

| Page | Proposed path | Primary API | Current source | Purpose | Treatment |
| --- | --- | --- | --- | --- | --- |
| UI architecture | `docs/ui/architecture.mdx` | generated `ui-contract`, UI SDK, host runtime | `docs/reference/ui-library.mdx` | Explain what generated workspace types own versus generic UI components. | New page. |
| GameShell | `docs/ui/game-shell.mdx` | `GameShell` | Current scaffold and UI contract | Explain the canonical game shell and expected surface configuration. | New page. |
| Board surfaces | `docs/ui/board-surfaces.mdx` | `BoardSurface`, board interactions | Current scaffold, `HexGrid`, `SquareGrid` docs | Explain board rendering, target routing, and custom space/edge/vertex renderers. | New page. |
| Hand surfaces | `docs/ui/hand-surfaces.mdx` | `HandSurface`, `HandZoneRenderer` | Current card-action/hand-zone work | Explain zone-backed hands, playable cards, custom zone renderers, and `excludeZoneIds`. | New page. |
| Prompts and choices | `docs/ui/prompts-and-choices.mdx` | `usePrompt`, `useChoicePrompt`, prompt surfaces | `docs/reference/ui-library.mdx` | Explain prompt inbox UX and higher-level hooks. | New page; keep `useGameplayPrompts` as lower-level escape hatch. |
| Custom renderers | `docs/ui/custom-renderers.mdx` | surface render props, component overrides | UI library page | Explain when to override rendering without forking scaffold plumbing. | New page. |
| UI components | `docs/ui/components.mdx` | `Card`, `Hand`, `HexGrid`, `SquareGrid`, `DiceRoller`, etc. | `docs/reference/ui-library.mdx`, generated prop snippets | Component catalog backed by generated prop snippets. | Keep generated snippet flow; split from runtime shell docs. |

## Testing pages

| Page | Proposed path | Primary API | Current source | Purpose | Treatment |
| --- | --- | --- | --- | --- | --- |
| Testing overview | `docs/testing/index.mdx` | `dreamboard test generate`, `dreamboard test run` | `docs/reference/testing.mdx` | Explain the generated testing model and command flow. | Rewrite current page opening. |
| Bases | `docs/testing/bases.mdx` | `defineBase` | `docs/reference/testing.mdx`, generated `testing-types.ts` | Explain reusable initial states and setup profiles. | Split from current testing page. |
| Scenarios | `docs/testing/scenarios.mdx` | `defineScenario` | `docs/reference/testing.mdx` | Explain action sequences, prompts, effects, and rejection paths. | Split from current testing page. |
| Runtime assertions | `docs/testing/runtime-assertions.mdx` | generated `expect`, scenario context | `docs/reference/testing.mdx` | Explain state helpers and matchers. | New focused page. |
| UI tests | `docs/testing/ui-tests.mdx` | `createTestRuntime`, `RuntimeProvider`, `PluginStateProvider` | Repo guidance and examples | Explain reducer-native UI tests for workspace UI. | New page. |
| Generated testing contracts | `docs/testing/generated-contracts.mdx` | `test/generated/testing-contract.ts` | `docs/reference/testing.mdx` | Explain regeneration, staleness failures, and what not to hand edit. | New focused page. |

## Tutorial pages

| Page | Proposed path | Source example | Mechanics taught | Copyright posture | Treatment |
| --- | --- | --- | --- | --- | --- |
| First game | `docs/tutorials/first-game.mdx` | Existing Race to Ten tutorial | Minimal manifest, one phase, one interaction, one view, simple UI, one scenario. | Original toy game. | Keep but shorten and modernize. |
| Hex trading and expansion | `docs/tutorials/hex-trading-expansion.mdx` | `examples/published/catan` | Dice production, hex topology, robber-like disruption, routes/buildings, action cards, hand surfaces. | Retheme and alter rules; avoid names, exact resource set, exact scoring, and board expression. | First full pattern tutorial to write. |
| Worker placement | `docs/tutorials/worker-placement.mdx` | TBD, likely `slot-worker-mat` plus new example | Worker slots, placement restrictions, round cleanup, card/resource rewards. | Original setting and worker economy. | Needs example or probe first. |
| Deck-builder market | `docs/tutorials/deck-builder-market.mdx` | TBD | Decks, discard, shuffle effects, market row, card actions, cleanup phase. | Original cards and economy. | Needs example first. |
| Trick-taking card game | `docs/tutorials/trick-taking-card-game.mdx` | TBD | Hands, following suit, trick winner, round scoring, hidden information. | Original scoring and theme. | Needs example first. |
| Area control | `docs/tutorials/area-control.mdx` | TBD | Board adjacency, majority scoring, conflict resolution, end-round scoring. | Original map and rules. | Candidate after core tutorials. |
| Route building | `docs/tutorials/route-building.mdx` | TBD | Network graph or board edges, connectivity derived values, route scoring. | Original map and tickets/contracts. | Candidate after topology docs. |

## Reference pages

| Page | Proposed path | Current source | Purpose | Treatment |
| --- | --- | --- | --- | --- |
| CLI | `docs/reference/cli.mdx` | `docs/reference/cli.mdx` | Command reference for install, auth, sync, compile, run, test, dev. | Keep as reference, update links to new task pages. |
| Rule authoring | `docs/reference/rule-authoring.mdx` | `docs/reference/rule-authoring.mdx` | `rule.md` structure and authoring guidance. | Keep; link from quickstart and tutorials. |
| Tiled board topology | `docs/reference/tiled-board-topology.mdx` | Existing topology reference | Deep ID semantics for hex/square spaces, edges, vertices, and traversal. | Keep as deep reference, not the first board authoring page. |
| Public package surfaces | `docs/reference/package-surfaces.mdx` | Current package exports | Explain public package imports and what is intentionally internal. | New page. |
| Troubleshooting | `docs/reference/troubleshooting.mdx` | Testing/CLI failure sections | Common stale generated files, auth, compile, local dev, typecheck failures. | New page. |

## Existing page migration

| Current page | Migration |
| --- | --- |
| `docs/index.mdx` | Rewrite as overview; move lifecycle details to `docs/start/authoring-lifecycle.mdx`. |
| `docs/quickstart.mdx` | Move to `docs/start/quickstart.mdx`; expand enough to run a game, but keep it shorter than a tutorial. |
| `docs/concepts.mdx` | Move to `docs/start/core-concepts.mdx`; update terms for current target/card-action/static-view model. |
| `docs/tutorials/building-your-first-game.mdx` | Rename to `docs/tutorials/first-game.mdx`; modernize code and link to reference pages. |
| `docs/reference/manifest-authoring.mdx` | Split into manifest, manifest fields, boards/topology, and setup bootstrap pages. |
| `docs/reference/reducer.mdx` | Split into contract, game definition, phases, interactions, effects, views, static views, derived values, inputs/targets, setup bootstrap, and table queries/ops. |
| `docs/reference/ui-library.mdx` | Split into UI architecture, GameShell, surfaces, prompts, custom renderers, and component catalog. |
| `docs/reference/testing.mdx` | Split into testing overview, bases, scenarios, runtime assertions, UI tests, and generated testing contracts. |
| `docs/reference/tiled-board-topology.mdx` | Keep as a deep reference; link from boards/topology and board surfaces. |
| `docs/reference/rule-authoring.mdx` | Keep mostly intact; retune examples and cross-links. |
| `docs/reference/cli.mdx` | Keep as command reference; link commands to task-oriented pages. |

## Suggested implementation order

1. Agree on this matrix and rename any pages that feel wrong.
2. Patch `docs.json` to the new navigation with placeholder pages.
3. Move/split Start and Authoring pages first, because all tutorials link into them.
4. Split UI pages next, especially `GameShell`, board surfaces, and hand surfaces.
5. Split Testing pages.
6. Rewrite the first-game tutorial against the new links.
7. Write the hex trading and expansion tutorial from the rethemed Catan pattern.
8. Run `pnpm docs:gen-props`, `pnpm skills:sync-docs`,
   `mise exec node@20 -- pnpm docs:validate`, and
   `mise exec node@20 -- pnpm docs:broken-links`.
