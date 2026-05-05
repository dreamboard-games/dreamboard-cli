# Core concepts

Learn Dreamboard's authoring vocabulary: manifest, contract, phase, interaction, target, view, surface, and scenario.

Dreamboard uses a small set of concepts consistently across reducer code, UI code, generated contracts, and tests.

## Manifest

The manifest is the static table model authored in `manifest.ts` with `defineTopologyManifest`. It declares players, card sets, zones, boards, pieces, dice, resources, setup options, and setup profiles.

The manifest is not just metadata. `dreamboard sync` turns it into generated ID unions, Zod schemas, runtime table types, setup helpers, and typed UI/test contracts.

## Game contract

The game contract is authored with `defineGameContract`. It binds the generated manifest contract to reducer state schemas and phase names.

The contract is the reducer's type root. If a phase name, player id, card id, zone id, board id, or state field changes, code that depends on the old shape should fail to compile.

## Game definition

The game definition is authored with `defineGame`. It assembles initial state, setup profiles, phases, views, and the optional static view into one reducer definition.

The generated UI and testing contracts read from this definition, so registered phases and interactions become typed UI/test surfaces automatically.

## Phase

A phase is a named slice of game flow authored with `definePhase`. A phase owns:

- its local phase-state schema
- an optional `enter` hook
- actor selection
- interactions
- card actions
- effects
- stages
- zones

Use phases for real game-flow states: setup, turn, discard, resolve prompt, round cleanup, end game.

## Interaction

An interaction is a player-submitted command or prompt authored with `defineInteraction`.

Interactions declare:

- the UI surface where they appear
- typed input collectors
- optional availability and validation
- reducer logic
- labels and rendering hints

The trusted runtime authorizes actors, validates target collectors, parses params, and only then calls the reducer.

## Card action

A card action is a hand-oriented interaction authored with `defineCardAction`. It is tied to a `cardType` and a `playFrom` zone. The runtime adds the selected `cardId` to reducer params and generated hand surfaces can render playable cards without local card-action wiring.

Use `defineCardAction` for "play this card from hand" mechanics. Use `defineInteraction` for actions that are not fundamentally card-instance plays.

## Input collector

An input collector describes one parameter for an interaction. Examples:

- `boardInput.vertex({ target })`
- `cardInput({ target })`
- `promptInput({ schema, target })`
- `formInput.choice(...)`
- `rngInput.d6(2)`

Collectors are the source of both reducer parameter types and client-facing metadata. Engine-sampled collectors such as `rngInput.*` appear in reducer params but are omitted from client-submitted params.

## Target rule

A target rule is a finite eligibility rule built with `boardTarget`, `cardTarget`, or `choiceTarget`.

The same target rule should drive UI hints, submit validation, and tests. This avoids duplicating "which space/card/choice is legal?" in the UI and reducer.

## View

A view is a dynamic player-facing projection authored with `defineView`. It receives state, `playerId`, runtime helpers, and `q`. The UI reads views; it should not read raw reducer state.

## Static view

A static view is a session-scoped projection authored with `defineStaticView`. It receives only the manifest and static queries. Use it for immutable payloads such as board topology, labels, and precomputed decoration derived from the manifest.

## Derived value

A derived value is a pure reusable computation authored with `defineDerived`. It is memoized for one state snapshot. Use derived values for expensive or shared calculations; keep source facts in state and compute aggregates from them.

## Surface

A surface is a UI routing hint on interactions. Common surfaces are `panel`, `hand`, `inbox`, `board-vertex`, `board-edge`, `board-space`, `blocker`, and `chrome`.

Generated UI contracts group interaction keys by surface, so UI code can render typed surface-specific controls.

## Scenario

A scenario is a reducer-native test authored with `defineScenario`. It starts from a base, submits interactions, handles prompts/effects, and asserts on state, views, or available interactions.

Scenarios verify the same reducer bundle that `dreamboard dev` runs.
