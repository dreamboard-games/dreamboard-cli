# Quickstart

Install Dreamboard, create a workspace, sync generated contracts, compile, and run locally.

## Requirements

- Node 20 or newer

## Install

```bash
npm install -g dreamboard
dreamboard login
```

`dreamboard login` opens a browser for authentication.

## Create a workspace

```bash
dreamboard new my-deck-builder --description "An exciting deck builder for 4 players"
cd my-deck-builder
```

The generated workspace contains generated contracts, a React UI, and reducer-native tests. Read [Workspace layout](./workspace-layout.md) before changing generated files.

## Sync generated files

Run sync after changing `manifest.ts`, reducer definitions, testing contracts, or scaffold-owned files:

```bash
dreamboard sync
```

`sync` regenerates local contracts from authored source and upload the source files to Dreamboard server for compilation. 

```bash
pnpm install
```

## Compile

```bash
dreamboard compile
```

Compile runs local checks, builds the reducer bundle, and uploads the compiled artifact to Dreamboard server.

## Run locally

```bash
dreamboard dev
```

Starts a local Vite server for playtesting the game. It runs the UI locally but connects to Dreamboard server for streaming game state. Open the printed URL to play the current compiled game.

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
