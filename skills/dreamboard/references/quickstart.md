# Quickstart

Install Dreamboard CLI, create a game, and iterate on manifest-driven scaffolding.

## Requirements

- Node 20+

## Install Dreamboard

Install the CLI:

```bash
npm install -g dreamboard
```

Log in:

```bash
dreamboard login
```

Create a game:

```bash
dreamboard new my-game --description "A trick-taking card game"
cd my-game
```

Edit `rule.md` and `manifest.ts`. Use
[CLI](./cli.md) for command behavior,
[Rule authoring](./rule-authoring.md) for the rules document and
[Manifest authoring](./manifest-authoring.md) for the manifest
schema.

Regenerate scaffolded files from your authored source:

```bash
dreamboard sync
```

`dreamboard sync` also prepares workspace dependencies after `package.json`
changes.

Compile the current authored head:

```bash
dreamboard compile
```

Start a local server to play the compiled game

```bash
dreamboard dev
```

Useful follow-up commands:

- `dreamboard pull` reconciles authored changes when the remote has advanced.
- `dreamboard status` compares local and remote state.
- `dreamboard clone <game-slug>` pulls an existing game into a local workspace.

If `dreamboard sync` reports missing dependency tooling, see
[Dependency setup](/docs/reference/dependency-setup).

For a concise command reference, see [CLI](./cli.md).

For a full walkthrough, continue with
[Building your first game](./building-your-first-game.md).
