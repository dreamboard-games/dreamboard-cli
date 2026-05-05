---
name: dreamboard-join
description: Use this skill when Codex needs to run an automation or bot client against an existing Dreamboard game session with `dreamboard join`, consume JSONL gameplay events, inspect available actions, validate actions, and submit moves for a scoped player.
---

# Dreamboard Join

## Purpose

Use `dreamboard join` as a headless bot transport for an already-created
Dreamboard game session. It is for automation, not human play: keep stdout as
JSONL, read diagnostics from stderr, and let the backend validate every move.

## Start The Client

Run from a shell session you can keep open:

```bash
dreamboard join --session <sessionId> --player <playerId>
```

Use `--env local` when targeting a local backend. If running inside a
Dreamboard project that has `.dreamboard/dev/session.json`, `--session` may be
omitted and the CLI will use that dev session. Numeric players such as
`--player 1` are normalized to `player-1`.

The process reads one JSON request per stdin line and writes one JSON response
or event per stdout line. Do not mix logs with stdout; treat stderr as
diagnostics only.

## JSONL Envelope

Every request needs a unique in-flight `id`:

```json
{"id":"1","method":"actions.list","params":{}}
```

Responses:

```json
{"id":"1","result":{...}}
{"id":"1","error":{"code":"INVALID_PARAMS","message":"...","details":{}}}
```

Async events:

```json
{"type":"event","event":{"type":"gameplay.bootstrap","gameplay":{...}}}
{"type":"event","event":{"type":"gameplay.updated","gameplay":{...}}}
{"type":"error","error":{"code":"EVENT_STREAM_ERROR","message":"..."}}
```

Event and result payloads use the shared API shapes. Do not invent compact
client-side shapes. In particular, action inputs are sent as `inputs`, not a
nested `params` object.

## Bot Loop

1. Start `dreamboard join`.
2. Wait for `event.type === "gameplay.bootstrap"` before calling action methods.
3. Store the latest scoped `gameplay.version`, `gameplay.actionSetVersion`, and
   `gameplay.playerId`.
4. Call `actions.list` to get the current available actions for this player.
5. For a candidate action, call `actions.describe` for the full descriptor.
6. For target-backed inputs, call `actions.targets` to get eligible values.
7. Build an `inputs` object and call `actions.validate`.
8. If valid, call `actions.submit`.
9. If submit returns `result.gameplay`, apply it immediately as the latest
   state for this bot. Later SSE echoes with the same or older version can be
   ignored.
10. Repeat from `actions.list` after each accepted move or gameplay update.

Always treat backend validation and submit responses as authoritative. Do not
hard-code game-specific resource limits or board legality in the bot.

## Methods

List actions:

```json
{"id":"list-1","method":"actions.list","params":{}}
```

Describe an action:

```json
{"id":"desc-1","method":"actions.describe","params":{"interactionId":"buildRoad"}}
```

Get eligible targets for one target-backed input:

```json
{"id":"targets-1","method":"actions.targets","params":{"interactionId":"buildRoad","inputKey":"edgeId"}}
```

Validate:

```json
{"id":"validate-1","method":"actions.validate","params":{"interactionId":"buildRoad","expectedVersion":12,"actionSetVersion":"12:abcd","inputs":{"edgeId":"edge-3"}}}
```

Submit:

```json
{"id":"submit-1","method":"actions.submit","params":{"interactionId":"buildRoad","expectedVersion":12,"actionSetVersion":"12:abcd","inputs":{"edgeId":"edge-3"}}}
```

For no-input actions, send `inputs:{}`.

## Action Selection Guidance

- Use `actions.list` as the overview. It returns server-authored descriptors
  already scoped to the joined player.
- Use `actions.describe` when the action has multiple inputs, unclear labels,
  costs, choices, or availability details.
- Use `actions.targets` only for target-backed inputs. If it returns
  `INPUT_HAS_NO_TARGETS`, use `actions.describe` plus `actions.validate`.
- For forms such as trades, build candidate `inputs` from descriptor metadata
  and current gameplay state, then validate. Do not duplicate reducer logic.
- If `ACTION_SET_STALE` or stale-version errors occur, refresh from the latest
  gameplay event or call `actions.list` again before retrying.

## State And Privacy

`dreamboard join` is scoped to the requested player. Do not assume access to
other players' private views, zones, or actions. `boardStatic` is bootstrap-only;
submit responses and gameplay updates carry dynamic gameplay state for fast
feedback without resending static topology.

## Failure Handling

- `NOT_READY`: wait for `gameplay.bootstrap`.
- `DUPLICATE_IN_FLIGHT_ID`: choose a new request id or wait for the earlier
  request to finish.
- `EVENT_STREAM_ERROR`: stop the bot loop and restart the join process after
  checking stderr.
- Backend validation errors are game-authoritative. Revise `inputs` or choose a
  different action rather than forcing submit.
