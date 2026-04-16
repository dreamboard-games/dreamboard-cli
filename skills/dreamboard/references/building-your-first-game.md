# Building your first game

Tutorial: build a complete Dreamboard game from rule to tests.

This tutorial walks through a deliberately small Dreamboard game so you can see
the whole authoring loop once: rules, manifest, reducer, UI, and tests.

The example game is `Race to Ten`.

- 2 players
- one shared d6
- each turn, the active player rolls the die and adds the result to their score
- the first player to reach 10 points wins

For tutorial stability, the main walkthrough uses a deterministic die sequence
`1, 2, 3, 4, 5, 6, ...` instead of true randomness. The important part is how a
die component, a `rollDie` action, reducer state, UI, and tests fit together.
This is also consistent with the reducer model: reducers stay pure, and
runtime-owned effects handle live randomness.

## What you will build

By the end of the tutorial you will have:

- a `rule.md` that explains the game
- a `manifest.ts` with a shared die
- reducer code in `app/`
- a playable `ui/App.tsx`
- a base and scenario under `test/`

## Prerequisites

- Dreamboard CLI installed: `npm install -g dreamboard`
- authenticated with `dreamboard login`

## 1. Create the workspace

```bash
dreamboard new race-to-ten --description "A tiny scoring game with one shared die"
cd race-to-ten
```

The scaffold gives you the files you will edit next:

- `rule.md`
- `manifest.ts`
- `app/game-contract.ts`
- `app/game.ts`
- `app/phases/*`
- `ui/App.tsx`
- `test/bases/*`
- `test/scenarios/*`

## 2. Write `rule.md`

```md
# Race to Ten

## Overview

- Players: 2
- Objective: be the first player to reach 10 points
- Duration: 3 to 5 minutes

## Components

- 1 shared six-sided die
- visible score totals for each player
- no hidden information

## Setup

1. Seat two players.
2. Set both scores to 0.
3. Clear the die value.
4. Player 1 takes the first turn.

## Gameplay

### Phase 1: takeTurn

- Acting player: the current player only
- Allowed actions: `rollDie`
- Validation: only the active player may act, and no actions are legal after a winner exists
- Completion:
  - `rollDie` sets the shared die to a new value
  - the acting player adds that value to their score
  - if the acting player reaches 10 points, the game ends immediately
  - otherwise the turn passes to the other player

## Scoring and progression

- `rollDie` increases the acting player's score by the rolled value

## Winning conditions

- End trigger: a player reaches 10 points
- Winner determination: the player who reached 10 points wins
- Tie-breaker: not applicable because turns resolve one at a time

## Special rules and edge cases

- Actions after game end are illegal
- Out-of-turn actions are illegal
- For this tutorial implementation, the die value cycles deterministically from 1 to 6 so the example stays reproducible
```

For a fuller reference, see [Rule authoring](./rule-authoring.md).

## 3. Write `manifest.ts`

This game needs player-count metadata and one shared die.

```ts
import { defineTopologyManifest } from "@dreamboard/sdk-types";

export default defineTopologyManifest({
  players: {
    minPlayers: 2,
    maxPlayers: 2,
    optimalPlayers: 2,
  },
  dieTypes: [
    {
      id: "standard-d6",
      name: "Standard d6",
      sides: 6,
    },
  ],
  dieSeeds: [
    {
      id: "turn-die",
      name: "Turn die",
      typeId: "standard-d6",
    },
  ],
});
```

Run:

```bash
dreamboard sync
dreamboard compile
```

`dreamboard sync` refreshes generated contracts from authored files.
It also prepares workspace dependencies after `package.json` changes.
If sync reports missing dependency tooling, see
[Dependency setup](/docs/reference/dependency-setup).
`dreamboard compile` builds the current authored head.

## 4. Define the reducer contract

Open `app/game-contract.ts` and replace the empty schemas with the state the
rules require.

```ts
import { z } from "zod";
import * as manifestContract from "../shared/manifest-contract";
import {
  defineGameContract,
  type GameStateOf,
} from "@dreamboard/app-sdk/reducer";

const playerId = manifestContract.ids.playerId;

const publicStateSchema = z.object({
  currentPlayerId: playerId,
  winnerPlayerId: playerId.nullable(),
  lastRoll: z.number().int().min(1).max(6).nullable(),
  scores: z.record(playerId, z.number().int().nonnegative()),
});

const privateStateSchema = z.object({});

const hiddenStateSchema = z.object({
  rollCount: z.number().int().nonnegative(),
});

export const gameContract = defineGameContract({
  manifest: manifestContract.manifestContract,
  state: {
    public: publicStateSchema,
    private: privateStateSchema,
    hidden: hiddenStateSchema,
  },
});

export type GameContract = typeof gameContract;
export type GameState = GameStateOf<GameContract>;
```

The public state holds player-visible game progress. The hidden state tracks the
deterministic roll index so the test can stay reproducible.

## 5. Add a player view

Create `app/player-view.ts`:

```ts
import { z } from "zod";
import { defineView } from "@dreamboard/app-sdk/reducer";
import type { GameContract } from "./game-contract";

export const playerView = defineView<GameContract>()({
  schema: z.object({
    currentPlayerId: z.string(),
    winnerPlayerId: z.string().nullable(),
    lastRoll: z.number().nullable(),
    scores: z.record(z.string(), z.number()),
    targetScore: z.number(),
    turnDieId: z.string(),
  }),
  project({ state, playerId }) {
    return {
      currentPlayerId: state.publicState.currentPlayerId,
      winnerPlayerId: state.publicState.winnerPlayerId,
      lastRoll: state.publicState.lastRoll,
      scores: state.publicState.scores,
      targetScore: 10,
      turnDieId: "turn-die",
    };
  },
});
```

The UI will read this view instead of reconstructing game logic in React.

## 6. Implement the phase and action

Create `app/phases/take-turn.ts`:

```ts
import { z } from "zod";
import { defineAction, definePhase } from "@dreamboard/app-sdk/reducer";
import type { GameContract } from "../game-contract";
import { ops, pipe } from "../reducer-support";

const TARGET_SCORE = 10;
const TURN_DIE_ID = "turn-die" as const;

const rollDie = defineAction<GameContract>()({
  params: z.object({}),
  validate({ state, input }) {
    if (state.publicState.winnerPlayerId) {
      return {
        errorCode: "GAME_ALREADY_ENDED",
        message: "The game has already ended.",
      };
    }

    if (input.playerId !== state.publicState.currentPlayerId) {
      return {
        errorCode: "NOT_YOUR_TURN",
        message: "It is not your turn.",
      };
    }

    return null;
  },
  reduce({ state, input, accept }) {
    const nextRoll = (state.hiddenState.rollCount % 6) + 1;
    const nextScore = state.publicState.scores[input.playerId] + nextRoll;
    const nextScores = {
      ...state.publicState.scores,
      [input.playerId]: nextScore,
    };

    const nextPlayerId =
      input.playerId === "player-1" ? "player-2" : "player-1";

    const nextTable = {
      ...state.table,
      dice: {
        ...state.table.dice,
        [TURN_DIE_ID]: {
          ...state.table.dice[TURN_DIE_ID],
          value: nextRoll,
        },
      },
    };

    const nextState = {
      ...state,
      table: nextTable,
      publicState: {
        ...state.publicState,
        currentPlayerId:
          nextScore >= TARGET_SCORE ? input.playerId : nextPlayerId,
        winnerPlayerId: nextScore >= TARGET_SCORE ? input.playerId : null,
        lastRoll: nextRoll,
        scores: nextScores,
      },
      hiddenState: {
        ...state.hiddenState,
        rollCount: state.hiddenState.rollCount + 1,
      },
    };

    return accept(
      pipe(
        nextState,
        ops.setActivePlayers(
          nextScore >= TARGET_SCORE ? [] : [nextPlayerId],
        ),
      ),
    );
  },
});

export const takeTurn = definePhase<GameContract>()({
  kind: "player",
  state: z.object({}),
  initialState: () => ({}),
  enter({ state, accept }) {
    if (state.publicState.winnerPlayerId) {
      return accept(state);
    }

    return accept(
      pipe(state, ops.setActivePlayers([state.publicState.currentPlayerId])),
    );
  },
  actions: {
    rollDie,
  },
});
```

`enter(...)` sets the first active player when the phase starts. After that,
the phase stays in `takeTurn`, so `rollDie.reduce(...)` must also call
`ops.setActivePlayers(...)` when it changes `currentPlayerId`. Updating
`publicState.currentPlayerId` alone does not update Dreamboard's action
routing.

`ops` and `pipe` come from the scaffolded `app/reducer-support.ts`, which is
the canonical location for the `createReducerOps<GameState>()` factory and a
re-export of `pipe` from `@dreamboard/app-sdk/reducer`.

Then update `app/phases/index.ts`:

```ts
import { takeTurn } from "./take-turn";

export const phases = {
  takeTurn,
};
```

## 7. Register the game

Update `app/game.ts`:

```ts
import { defineGame } from "@dreamboard/app-sdk/reducer";
import { records } from "../shared/manifest-contract";
import { gameContract } from "./game-contract";
import { phases } from "./phases";
import { playerView } from "./player-view";

export default defineGame({
  contract: gameContract,
  initial: {
    public: ({ playerIds }) => ({
      currentPlayerId: playerIds[0],
      winnerPlayerId: null,
      lastRoll: null,
      scores: records.playerIds(0),
    }),
    private: () => ({}),
    hidden: () => ({
      rollCount: 0,
    }),
  },
  initialPhase: "takeTurn",
  phases,
  views: {
    player: playerView,
  },
});
```

At this point the rules exist, but the UI is still the scaffold placeholder.

## 8. Build the UI

Update `ui/App.tsx`:

```tsx
import {
  useActions,
  useGameView,
  useIsMyTurn,
} from "@dreamboard/ui-sdk";
import { DiceRoller } from "./components/dreamboard";

export default function App() {
  const view = useGameView();
  const isMyTurn = useIsMyTurn();
  const phase = useActions();
  const diceValues = view.lastRoll == null ? [] : [view.lastRoll];

  const rollDie = async () => {
    if (phase.phase !== "takeTurn") {
      return;
    }

    await phase.dispatch(phase.commands.rollDie());
  };

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Race to Ten</h1>
      <p>First to {view.targetScore} points wins.</p>

      <DiceRoller
        values={diceValues}
        diceCount={1}
        render={({ values }) => (
          <div style={{ fontSize: 32, marginBottom: 16 }}>
            Die: {values?.[0] ?? "?"}
          </div>
        )}
      />

      <ul>
        {Object.entries(view.scores).map(([playerId, score]) => (
          <li key={playerId}>
            {playerId}: {score}
            {view.currentPlayerId === playerId ? " <- current player" : ""}
          </li>
        ))}
      </ul>

      <p>Last roll: {view.lastRoll ?? "not rolled yet"}</p>

      {view.winnerPlayerId ? (
        <p>Winner: {view.winnerPlayerId}</p>
      ) : (
        <button onClick={() => void rollDie()} disabled={!isMyTurn}>
          Roll die
        </button>
      )}
    </main>
  );
}
```

The important part is that:

- the die exists in authored game structure
- the reducer updates the die value and the score together
- the UI reads projected view data and the die state from the runtime
- actions still go through `useActions()`

For authored reducer reads, prefer `const q = createTableQueries(state.table)`
and then `q.board.*`, `q.zone.*`, `q.card.*`, or `q.component.*`. The die
update above is a low-level table write because there is not yet a dedicated
die mutation helper.

## 9. Add a base and a scenario

Replace `test/bases/initial-turn.base.ts`:

```ts
import { defineBase } from "../testing-types";

export default defineBase({
  id: "initial-turn",
  seed: 1337,
  players: 2,
  setup: async ({ game }) => {
    await game.start();
  },
});
```

Create `test/scenarios/player-two-wins.scenario.ts`:

```ts
import { defineScenario } from "../testing-types";

export default defineScenario({
  id: "player-two-wins",
  description: "The deterministic roll sequence lets player 2 reach ten first",
  from: "initial-turn",
  when: async ({ game }) => {
    await game.action("player-1", "rollDie");
    await game.action("player-2", "rollDie");
    await game.action("player-1", "rollDie");
    await game.action("player-2", "rollDie");
    await game.action("player-1", "rollDie");
    await game.action("player-2", "rollDie");
  },
  then: ({ state, view, expect }) => {
    expect(state()).toBe("takeTurn");
    expect(view("player-1").scores["player-1"]).toBe(9);
    expect(view("player-2").scores["player-2"]).toBe(12);
    expect(view("player-2").winnerPlayerId).toBe("player-2");
    expect(view("player-1").lastRoll).toBe(6);
  },
});
```

Generate artifacts and run the test suite:

```bash
dreamboard test generate
dreamboard test run
```

## 10. Run the game locally

Start the local dev server to play the game in the browser:

```bash
dreamboard dev
```

If you edit `rule.md` or `manifest.ts`, run `dreamboard sync` again before
continuing.

## Where to go next

This tutorial uses the smallest die-based loop that still touches authored
components, reducer state, UI, and tests. The next layer of depth is:

- add setup profiles or setup options
- add richer reducer state and more than one phase
- replace the plain button UI with grouped action panels and richer views
- add rejection-path tests such as out-of-turn actions

If you need live randomness in authored reducer logic, do not call
`Math.random()` inside reducers. Use runtime-owned effects instead:

- `fx.rollDie(...)` when the runtime only needs to update an authored die
- `fx.randomInt(...)` when reducer logic needs the sampled value back

The main walkthrough stays deterministic so the rule, reducer, UI, and test
snippets all line up exactly. See [Reducer](./reducer.md) for the
runtime-random versions.
