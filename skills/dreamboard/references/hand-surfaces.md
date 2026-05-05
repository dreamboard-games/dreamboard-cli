# Hand surfaces

Render card zones and playable hand actions.

Hand surfaces render manifest player card zones. They are designed for
`defineCardAction`; each action attaches to a hand zone through `playFrom`.

There are two modes:

| Mode | Use when |
| --- | --- |
| Zone mode | You have a manifest zone and want to render a real hand of cards. |
| Descriptor mode | You have hand-surface descriptors that are not tied to one rendered zone. |

For card games and deck games, zone mode should be the default.

## Authoring shape

Declare a hand zone once in the phase:

```ts
zones: [zones.actionHand],
cardActions: {
  playBoost,
  playDrawCards,
  playBuildPath,
},
```

Import `zones` from the generated manifest contract so reducer code uses typed
handles such as `zones.actionHand`. The generated UI contract exposes the
JS-friendly zone key `actionHand` while the runtime projection is keyed by the
manifest zone id `action-hand`. Cards come from that manifest player zone, and
playable actions are derived from `cardActions` whose `playFrom` is also
`zones.actionHand`.

## Zone mode in WorkspaceGameShell

```tsx
import { WorkspaceGameShell } from "@dreamboard/ui-contract";

<WorkspaceGameShell
  surfaces={{
    hand: {
      zones: {
        actionHand: {
          renderCardContent: (card, ctx) => (
            <div data-playable={!ctx.disabled}>
              <strong>{card.name ?? card.id}</strong>
              {ctx.interactions[0]?.label ? (
                <span>{ctx.interactions[0].label}</span>
              ) : null}
            </div>
          ),
        },
      },
    },
  }}
/>;
```

`WorkspaceGameShell` owns the default hand layout, card click routing,
disabled state, keyboard behavior, and follow-up input flow. Use
`renderCardContent` when you only need to customize the card face.

Each card context contains:

| Field | Meaning |
| --- | --- |
| `card` | The rendered card. |
| `interactions` | Available hand descriptors that target this card. |
| `play` | A convenience submit function when exactly one interaction can be played directly. |
| `disabled` | True when no available interaction can be played from this card. |

`play` is `null` when the card needs disambiguation or follow-up inputs. The
default zone renderer handles common follow-up flows for you. Use a full-hand
renderer only when the default `<Hand>` fan is wrong for your game, such as a
tableau, grid, or custom drag surface.

## Default zone rendering

If the default card face is enough, you can use the lower-level component:

```tsx
import { HandSurface } from "@dreamboard/ui-sdk/components";

<HandSurface
  zoneId="dev-hand"
  renderCardContent={(card) => <span>{card.name ?? card.id}</span>}
/>;
```

`WorkspaceGameShell` normally handles zone id translation for you. Prefer
`surfaces.hand.zones` in authored workspace UI unless you are composing a custom
shell.

## Descriptor mode

Descriptor mode renders one item per hand-surface descriptor:

```tsx
<WorkspaceGameShell
  surfaces={{
    hand: {
      interactions: {
        "placeThing.placeThingCard": (descriptor, handle) => (
          <HandRow descriptor={descriptor} handle={handle} />
        ),
      },
    },
  }}
/>;
```

Use this when the interaction is card-adjacent but the screen is not a normal
card hand. For example, a deduction game might let the player select a card from
a custom horizontal strip and choose a board zone in a separate board panel.

## Follow-up inputs

Card actions often start with a card and then need another input: a board space,
resource choice, target player, or amount.

Let the built-in zone renderer handle the normal path: it stores the selected
card id, arms board targets when needed, and opens the default follow-up form
for form inputs.

Star Settlers uses this for tech cards. One card asks for a board space plus a
target player; another asks for two resource choices:

```ts
export const playPatrol = defineCardAction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  cardType: cardTypes.patrol,
  playFrom: zones.techHand,
  inputs: {
    raiderSpaceId: boardInput.space<GameState, SpaceId>({
      target: raiderSpaceTarget,
    }),
    stealFromPlayerId: raiderSeizeTargetInput(),
  },
  reduce({ input }) {
    // input.params.cardId is supplied by the selected hand card.
    // input.params.raiderSpaceId is collected by the board surface.
    // input.params.stealFromPlayerId is collected as a follow-up input.
  },
});

export const playBountySurvey = defineCardAction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  cardType: cardTypes.bountySurvey,
  playFrom: zones.techHand,
  inputs: {
    resource1: formInput.choice<ResourceId>({ choices: "resourceMap" }),
    resource2: formInput.choice<ResourceId>({ choices: "resourceMap" }),
  },
});
```

The UI still only customizes the card face:

```tsx
<WorkspaceGameShell
  surfaces={{
    hand: {
      zones: {
        techHand: {
          label: "Tech cards",
          renderCardContent: (card) => <TechCardFace card={card} />,
        },
      },
    },
  }}
/>;
```

For the full implementation, read the synced Star Settlers source:
[tech card actions](https://github.com/dreamboard-games/dreamboard-cli/blob/main/examples/star-settlers/app/phases/player-turn/tech-cards.ts)
and
[hand surface UI](https://github.com/dreamboard-games/dreamboard-cli/blob/main/examples/star-settlers/ui/App.tsx).

## Avoid duplicate rendering

When `WorkspaceGameShell` receives a zone renderer, it passes the zone ids to the
fallback descriptor-mode hand surface as excluded zones. This prevents a card
zone from rendering once as a real hand and again as a row of default buttons.

If you compose `HandSurface` yourself, pass `excludeZoneIds` when mixing zone
mode and descriptor mode:

```tsx
<>
  <HandSurface zoneId="dev-hand" renderHand={renderDevHand} />
  <HandSurface excludeZoneIds={["dev-hand"]} render={handRenderers} />
</>
```

## Use card actions for card-first commands

Use [Card actions](./card-actions.md) when the selected card is the
object being played. It gives the UI enough metadata to connect zones, playable
cards, and hand surfaces without local plumbing.
