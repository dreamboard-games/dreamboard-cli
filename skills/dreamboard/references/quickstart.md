# Quickstart

Install Dreamboard CLI, create a game, and iterate on manifest-driven scaffolding.

## Requirements

- Node 20+

<Tip>
  New to Dreamboard? Read [Core concepts](/docs/concepts) alongside this
  page for the mental model and a glossary of the terms used in the CLI
  output and the rest of the docs.
</Tip>

## Install Dreamboard

Install the CLI:

```bash
npm install -g dreamboard
```

Log in:

```bash
dreamboard login
```

A browser window opens for authentication. When it completes, the CLI prints
your logged-in email and returns to the shell.

Create a game:

```bash
dreamboard new my-game --description "A trick-taking card game"
cd my-game
```

`dreamboard new` creates a `./my-game/` workspace and finishes with `Created
new game in ./my-game`, followed by a hint to run `dreamboard sync` and
`dreamboard compile` next.

Edit `rule.md` and `manifest.ts`. Use
[CLI](./cli.md) for command behavior,
[Rule authoring](./rule-authoring.md) for the rules document and
[Manifest authoring](./manifest-authoring.md) for the manifest
schema.

Regenerate scaffolded files from your authored source:

```bash
dreamboard sync
```

`dreamboard sync` regenerates scaffolded files and prints `Synced authored
state <id>` when it finishes. It also prepares workspace dependencies after
`package.json` changes.

Compile the current authored head:

```bash
dreamboard compile
```

A successful compile prints `Local typecheck passed` and `Compiled <id> for
authored state <id>`. If there are diagnostics, fix them and run the command
again.

Start a local server to play the compiled game:

```bash
dreamboard dev
```

The CLI prints `Dreamboard dev host ready at <url>` along with the local URL
and backend session id. Open the URL in a browser to play the game; stop the
server with `Ctrl+C`.

Useful follow-up commands:

- `dreamboard pull` reconciles authored changes when the remote has advanced.
- `dreamboard status` compares local and remote state.
- `dreamboard clone <game-slug>` pulls an existing game into a local workspace.

For a concise command reference, see [CLI](./cli.md).

For a full walkthrough, continue with
[Building your first game](./building-your-first-game.md).
