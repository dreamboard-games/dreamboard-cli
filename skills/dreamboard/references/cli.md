# CLI

Reference for Dreamboard CLI workflows and commands.

Dreamboard CLI manages the authored workspace loop: authenticate, create or
clone a game, sync authored changes, compile, develop, and test.

## Responsibility

Use the CLI for:

- authenticating the current machine
- creating or cloning game workspaces
- syncing authored files to the remote authoring head
- compiling the current authored head
- inspecting local versus remote state
- pulling remote authored changes into the workspace
- starting a local dev server to play the game in the browser
- generating and running reducer-native tests

## Install targets

Use the published package for normal game work:

```bash
npm install -g dreamboard
dreamboard login
```

## Command flow

Use this sequence for the normal authored loop:

1. `dreamboard login`
2. `dreamboard new ...` or `dreamboard clone ...`
3. edit `rule.md`, `manifest.ts`, and authored source files
4. `dreamboard sync`
5. `dreamboard compile`
6. `dreamboard dev` (play in browser) or `dreamboard test run` (automated tests)
7. `dreamboard test generate` (after reducer/manifest shape changes)
8. `dreamboard test run`

When the remote authored head moves first, run `dreamboard pull` before the
next sync or compile. Use `dreamboard status` to decide whether the workspace is
ahead, behind, or diverged.

## Workspace commands

| Command | Use it for |
| --- | --- |
| `dreamboard login` | Open browser login and store a refreshable session |
| `dreamboard new <slug> --description "..."` | Create a new game and scaffold a local workspace |
| `dreamboard clone <slug>` | Clone an existing game into a new local workspace |
| `dreamboard sync` | Upload authored changes and refresh scaffolded files |
| `dreamboard compile` | Compile the current remote authored head |
| `dreamboard status` | Compare local authored and compile state with remote |
| `dreamboard pull` | Reconcile remote authored changes into the workspace |

```bash
dreamboard new race-to-ten --description "A tiny scoring game"
dreamboard sync
dreamboard compile
dreamboard status --json
```

`dreamboard sync` also reconciles local workspace dependencies when `package.json`
changes, so users should not run a separate install command as part of the
normal authored workflow. If `dreamboard sync` reports missing dependency
tooling, see [Dependency setup](/docs/reference/dependency-setup).

The CLI materializes `.dreamboard/generated/manifest.json` from `manifest.ts`
for local tooling. Treat that file as generated output, not authored source.

## Dev server

Start a local server to play the compiled game in the browser:

```bash
dreamboard dev
```

## Test commands

Use the scaffolded reducer-native test workspace for repeatable game assertions.

```bash
dreamboard test generate
dreamboard test run
dreamboard test run --scenario test/scenarios/player-two-wins.scenario.ts
```

See [Testing](./testing.md) for the scenario and base-file format.
