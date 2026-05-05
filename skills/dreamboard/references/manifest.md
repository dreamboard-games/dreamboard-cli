# Manifest

Use defineTopologyManifest to declare the static table model for a Dreamboard game.

The manifest is the static source of truth for a game. It names the objects that the reducer, UI, tests, and setup code should agree on: players, card sets, zones, boards, pieces, dice, resources, setup options, and setup profiles.

Author it in `manifest.ts`:

```ts
import { defineTopologyManifest } from "@dreamboard/sdk-types";

export default defineTopologyManifest({
  players: {
    minPlayers: 2,
    maxPlayers: 4,
    optimalPlayers: 3,
  },
  cardSets: [],
  zones: [],
  boards: [],
});
```

`defineTopologyManifest` returns the manifest unchanged at runtime, but it gives TypeScript enough information to reject invalid IDs and incompatible component locations while you author.

## What belongs in the manifest

Put static, setup-time structure in the manifest:

| Manifest section | Use for |
| --- | --- |
| `players` | Player count bounds and generated player ids. |
| `cardSets` | Manual or preset card sets, card schemas, card counts, starting homes. |
| `zones` | Shared piles and per-player hands. |
| `boardTemplates` | Reusable board definitions. |
| `boards` | Shared or per-player board instances. |
| `pieceTypes` and `pieceSeeds` | Piece schemas, slots, starting pieces, ownership, starting homes. |
| `dieTypes` and `dieSeeds` | Dice, dice fields, starting dice, ownership, starting homes. |
| `resources` | Player resource ids and labels. |
| `setupOptions` | User-selectable setup knobs. |
| `setupProfiles` | Named setup presets that choose setup-option values. |

Do not put runtime facts in the manifest. Current scores, active turn, pending prompts, drawn card ids, resource balances, and temporary decisions belong in reducer state or the runtime table.

## Generated contract

After changing the manifest, run:

```bash
dreamboard sync
```

The generated `shared/manifest-contract.ts` exposes:

- `literals`, including ids such as `playerIds`, `cardIds`, `zoneIds`, and `setupProfileIds`
- `ids`, a Zod schema namespace for manifest-backed ids
- `manifestContract`, the object passed into `defineGameContract`
- runtime table types such as `TableState`
- setup profile helpers
- typed helper constructors for setup bootstrap steps

Use generated exports instead of duplicating string unions:

```ts
import { ids, literals, manifestContract } from "../shared/manifest-contract";

const playerIdSchema = ids.playerId;
const knownZones = literals.zoneIds;
```

## Canonical authoring rule

If a thing has an identity that the reducer, UI, or tests need to agree on, define that identity in the manifest. Let generated types carry that identity forward.

Avoid local parallel lists such as `const ZONES = [...]` unless they are derived from, or intentionally narrower than, manifest-generated ids.

## Related pages

- [Manifest fields](./manifest-fields.md) for schemas, homes, visibility, and strict slots.
- [Boards and topology](./boards-and-topology.md) for board layouts and tiled IDs.
- [Game contract](./game-contract.md) for binding the manifest into reducer state.
