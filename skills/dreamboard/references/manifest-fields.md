# Manifest fields

Reference manifest schemas, component homes, visibility, slot hosts, and setup fields.

Manifest fields let you attach typed static data to cards, pieces, dice, boards, spaces, edges, vertices, relations, and containers.

## Field schemas

Schemas use Dreamboard's manifest property schema format, not Zod. The generated manifest contract turns these into typed values.

```ts
cardSets: [
  {
    type: "manual",
    id: "contracts",
    name: "Contracts",
    cardSchema: {
      properties: {
        rewardCoins: { type: "integer" },
        route: { type: "enum", enums: ["market", "river", "trail"] },
        targetBoard: { type: "boardId" },
        targetSpace: { type: "spaceId" },
        bonusResource: { type: "resourceId", optional: true },
      },
    },
    cards: [
      {
        type: "ferry-charter",
        name: "Ferry Charter",
        count: 2,
        properties: {
          rewardCoins: 2,
          route: "river",
          targetBoard: "frontier-map",
          targetSpace: "ford",
          bonusResource: "provisions",
        },
      },
    ],
  },
];
```

Reference fields by their manifest ids instead of plain strings. `defineTopologyManifest` rejects values that do not match the current manifest.

## Component homes

Cards, pieces, and dice can start in zones, board spaces, board containers, tiled edges, tiled vertices, or slots.

```ts
pieceSeeds: [
  {
    id: "worker-1",
    typeId: "worker",
    ownerId: "player-1",
    home: {
      type: "slot",
      host: { kind: "piece", id: "mat-player-1" },
      slotId: "farm",
    },
  },
];
```

Use `ownerId` for player-owned seeds. For per-player board or zone homes, include enough ownership data for the runtime to resolve the actual player-scoped container.

## Visibility

Visibility belongs in the manifest when it is a static property of a component or zone.

Common patterns:

| Visibility | Use for |
| --- | --- |
| `public` | Shared face-up information. |
| `hidden` | Decks or piles where contents/order are not public. |
| `ownerOnly` | Per-player hands or private player areas. |
| `{ faceUp: false }` | Manual cards that should start face down. |

Runtime secrecy still belongs in state and projections. A card being in an owner-only zone does not mean every view should expose all secret data about that card.

## Slots

Slots model fixed attachment points on pieces or dice. They are useful for worker mats, die trays, upgrade sockets, or other component-hosted positions.

```ts
pieceTypes: [
  {
    id: "player-mat",
    name: "Player Mat",
    slots: [
      { id: "farm", name: "Farm" },
      { id: "market", name: "Market" },
    ],
  },
];
```

Slots are static topology. Runtime occupancy is read through `q.slot.*` and moved through table operations.

## Setup options and profiles

Use `setupOptions` for knobs that change game setup. Use `setupProfiles` for named presets.

```ts
setupOptions: [
  {
    id: "map-size",
    name: "Map size",
    choices: [
      { id: "small", name: "Small" },
      { id: "wide", name: "Wide" },
    ],
  },
],
setupProfiles: [
  {
    id: "default",
    name: "Default",
    optionValues: { "map-size": "small" },
  },
],
```

The generated setup profile helper keeps authored `optionValues` aligned with the available setup option and choice ids.

## When not to use fields

Do not use manifest fields to mirror mutable state. Examples that should be reducer state or table state:

- current resource balances
- whether a card has been played this turn
- which player owns a temporary claim
- current turn step
- pending selected target

The manifest should describe what can exist. The reducer state and table describe what is currently true.
