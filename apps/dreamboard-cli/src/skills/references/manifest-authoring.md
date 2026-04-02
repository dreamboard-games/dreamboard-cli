# Manifest Authoring Guide

Use this guide when editing `manifest.json`.

`manifest.json` is a typed topology catalog. It declares:

- supported player counts
- card sets and zones
- boards, spaces, relations, and board containers
- piece and die types plus seeded inventory
- resources
- setup option axes and curated setup profiles

It does **not** declare reducer phases, player actions, transitions, or
gameplay rules. Reducer code in `app/game.ts` and `app/phases/*.ts` owns those.

## After Editing

Run:

```bash
dreamboard sync
```

That regenerates files such as:

- `shared/manifest-contract.ts`
- `shared/generated/ui-contract.ts`

## Top-Level Shape

```json
{
  "players": { "...": "..." },
  "cardSets": [{ "...": "..." }],
  "zones": [{ "...": "..." }],
  "boardTemplates": [{ "...": "..." }],
  "boards": [{ "...": "..." }],
  "pieceTypes": [{ "...": "..." }],
  "pieceSeeds": [{ "...": "..." }],
  "dieTypes": [{ "...": "..." }],
  "dieSeeds": [{ "...": "..." }],
  "resources": [{ "...": "..." }],
  "setupOptions": [{ "...": "..." }],
  "setupProfiles": [{ "...": "..." }]
}
```

## Core Rules

- Only use documented schema fields. Unknown top-level keys are rejected.
- Optional list fields should be omitted or set to `[]`, never `null`.
- Keep the manifest about durable topology and authored data, not UI
  presentation or gameplay flow.
- Use stable IDs everywhere. Codegen turns them into literal TypeScript unions.

## Typed Authored Data

Use `PropertySchema` inside:

- `cardSchema`
- `boardFieldsSchema`
- `spaceFieldsSchema`
- `relationFieldsSchema`
- `containerFieldsSchema`
- `tileFieldsSchema`
- `portFieldsSchema`
- `pieceType.fieldsSchema`
- `dieType.fieldsSchema`

`properties` and `fields` values are JSON-valued authored data. Keep them
consistent with the schema you declare.

## Topology Model

### Zones

Use `zones` for shared piles and per-player containers.

- `scope` is `shared` or `perPlayer`
- `allowedCardSetIds` is enforced for cards moved into the zone
- `visibility` controls the default topology visibility

Zones no longer carry policy-only fields like `kind`, `order`, `maxCapacity`, or
free-form `tags`.

### Boards

Boards and board templates have two separate concepts:

- `layout`: engine-level structure, either `"generic"` or `"hex"`
- `typeId`: optional authored category the reducer can branch on, such as
  `"track"`, `"map"`, or `"tableau"`

Generic boards use:

- `spaces`
- `relations`
- `containers`

Hex boards use:

- `tiles`
- `ports`
- `orientation`

### Spaces, Relations, and Containers

- `BoardSpaceSpec.typeId` is an authored space category such as `"corner"` or
  `"property"`
- `BoardRelationSpec.typeId` is an authored relation category such as
  `"adjacent"` or `"next"`
- `BoardSpaceSpec.occupiable` tells the engine to materialize the space as a
  board location
- `BoardContainerSpec.host` attaches a container to the board or to one space

The reducer decides what movement is legal. The manifest only gives the reducer
typed references and authored categories.

## Component Homes

Cards, piece seeds, and die seeds can start in one of these places:

- `detached`
- `zone`
- `boardSpace`
- `boardContainer`

`spaceContainer` and `hostedSlot` are not part of the manifest model.

## Setup Metadata

`setupOptions` and `setupProfiles` are metadata for setup selection and UI.

- `setupOptions` define option axes and named choices
- `setupProfiles` define curated presets
- `setupProfiles.optionValues` maps option ids to choice ids

Session/runtime selection is still by `setupProfileId`. Reducer-owned
`app/setup-profiles.ts` is the operational setup catalog.

## Recommended Authoring Order

1. Start from `rule.md`.
2. Define card sets, zones, and seeded inventory.
3. Define boards, spaces, relations, and containers.
4. Add typed authored `fields` only where reducer or UI code will read them.
5. Add setup metadata for curated presets if the game needs multiple setups.

If you are deciding between shared zones and per-player zones, see
[hands-vs-decks.md](hands-vs-decks.md).
