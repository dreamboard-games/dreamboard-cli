# Dreamboard

Build rule-enforced multiplayer board games with a typed authoring SDK, generated contracts, and reusable UI surfaces.

Dreamboard is a local-first authoring framework for rule-enforced multiplayer board games. You describe the game in ordinary project files, Dreamboard generates typed contracts from that structure, and the runtime enforces the rules through a reducer bundle.

The important promise is alignment. The manifest, reducer, UI, and tests all compile against the same generated contract, so renaming a zone, adding a card type, changing an interaction, or moving state between table data and projected views produces useful type errors instead of silent drift.

## The authoring loop

Most work happens in five files or folders:

| Layer | File or folder | Owns |
| --- | --- | --- |
| Intent | `rule.md` | Human-readable game rules and design decisions. |
| Topology | `manifest.ts` | Players, boards, cards, zones, pieces, dice, resources, setup choices. |
| Rules | `app/` | State schemas, phases, interactions, card actions, effects, views. |
| Interface | `ui/` | Typed React UI built from generated view and interaction contracts. |
| Verification | `test/` | Bases, scenarios, reducer runs, and UI tests. |

The CLI ties those files together:

```bash
dreamboard sync
dreamboard compile
dreamboard dev
dreamboard test generate
dreamboard test run
```

`sync` regenerates workspace contracts, `compile` builds the reducer bundle, `dev` runs a playable local session, and `test` replays scenarios against the same reducer definition.

## A small example

In `manifest.ts`, define the static table shape:

```ts
import { defineTopologyManifest } from "@dreamboard/sdk-types";

export default defineTopologyManifest({
  players: { minPlayers: 2, maxPlayers: 4, optimalPlayers: 3 },
  cardSets: [
    {
      type: "manual",
      id: "things",
      name: "Things",
      cardSchema: { properties: { label: { type: "string" } } },
      cards: [
        { type: "moon", name: "Moon", count: 1, properties: { label: "Moon" } },
      ],
    },
  ],
  zones: [
    { id: "draw", name: "Draw", scope: "shared", allowedCardSetIds: ["things"] },
    { id: "hand", name: "Hand", scope: "perPlayer", allowedCardSetIds: ["things"] },
  ],
  boards: [],
});
```

In `app/game-contract.ts`, bind generated manifest types to reducer state:

```ts
import { z } from "zod";
import { ids, manifestContract } from "../shared/manifest-contract";
import { defineGameContract } from "@dreamboard/app-sdk/reducer";

export const gameContract = defineGameContract({
  manifest: manifestContract,
  phaseNames: ["play"] as const,
  state: {
    public: z.object({ winnerPlayerId: ids.playerId.nullable() }),
    private: z.object({}),
    hidden: z.object({}),
  },
});
```

In a phase, declare typed interactions. The reducer stays authoritative; the UI receives typed descriptors and eligible targets from the same definition.

```ts
import { z } from "zod";
import {
  defineInteraction,
  definePhase,
  pipe,
} from "@dreamboard/app-sdk/reducer";

const play = definePhase<GameContract>()({
  kind: "player",
  state: z.object({}),
  initialState: () => ({}),
  actor: ({ state }) => state.flow.activePlayers,
  interactions: {
    endTurn: defineInteraction<GameContract>()({
      surface: "panel",
      label: "End turn",
      inputs: {},
      reduce({ state, accept, fx, ops }) {
        return accept(pipe(state, ops.advanceActivePlayer()));
      },
    }),
  },
});
```

## What to read next

- [Quickstart](./quickstart.md) gets a fresh workspace running.
- [Workspace layout](./workspace-layout.md) explains generated and authored files.
- [Core concepts](./core-concepts.md) defines the vocabulary used across the docs.
- [Manifest](./manifest.md) and [Game contract](./game-contract.md) are the first two authoring references.
