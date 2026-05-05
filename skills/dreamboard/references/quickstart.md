# Quickstart

Install Dreamboard, create a workspace, sync generated contracts, compile, and run locally.

Use this page to create and run a workspace. It intentionally stops before a full game implementation; use the tutorials for real mechanics.

## Requirements

- Node 20 or newer
- A terminal that can run the Dreamboard CLI

## Install

```bash
npm install -g dreamboard
dreamboard login
```

`dreamboard login` opens a browser for authentication, then writes the CLI session locally.

## Create a workspace

```bash
dreamboard new ring-arena --description "A compact card-and-zone deduction game"
cd ring-arena
```

The generated workspace contains authored files, generated contracts, a React UI, and reducer-native tests. Read [Workspace layout](./workspace-layout.md) before changing generated files.

## Sync generated files

Run sync after changing `manifest.ts`, reducer definitions, testing contracts, or scaffold-owned files:

```bash
dreamboard sync
```

`sync` regenerates local contracts from authored source. If `sync` updates `package.json`, install dependencies before continuing:

```bash
pnpm install
```

## Compile

```bash
dreamboard compile
```

Compile runs local checks, builds the reducer bundle, and uploads the compiled artifact for the authored head. Fix type errors before moving to `dev`; type errors usually mean one of the generated contracts no longer matches the authored manifest or reducer.

## Run locally

```bash
dreamboard dev
```

Open the printed URL to play the current compiled game. Stop the dev host with `Ctrl+C`.

## Add test coverage

```bash
dreamboard test generate
dreamboard test run
```

`test generate` writes workspace-specific testing wrappers and generated contracts. `test run` replays scenario files under `test/scenarios`.

## Next steps

- [Manifest](./manifest.md) explains the static table model.
- [Game contract](./game-contract.md) explains state and phase names.
- [Interactions](./interactions.md) explains player commands and prompts.
- [CLI](./cli.md) is the command reference.
