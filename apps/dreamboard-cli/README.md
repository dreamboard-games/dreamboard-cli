# Dreamboard CLI

Dreamboard CLI supports three main workflows:

- Authoring: `dreamboard sync`, `dreamboard compile`, `dreamboard pull`
- Interactive verification: `dreamboard dev`
- Scripted verification: `dreamboard test generate`, `dreamboard test run`

## Install

```bash
npm install -g dreamboard
dreamboard login
```

## Create a game

```bash
dreamboard new my-game --description "A short game description"
cd my-game
```

## Iterate

```bash
dreamboard sync
dreamboard compile
dreamboard dev
```

`dreamboard dev` starts the local iframe host for the current project while gameplay continues on the backend.

## Test

```bash
dreamboard test generate
dreamboard test run
dreamboard test run --scenario test/scenarios/example.scenario.ts
```

Scenario assertions must use the projection-only API from `test/testing-types.ts`:

- `players()`
- `state()`
- `view(playerId)`
- `expect`

## Scaffold ownership

Framework-owned static scaffold files are restored by `dreamboard sync`. Generated projects no longer expose wire-format message typings.
