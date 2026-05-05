# Card actions

Use defineCardAction for first-class actions that play a card from a hand zone.

Use `defineCardAction` when the player action starts from a concrete card in a hand or card zone: play an action card, reveal a tactic, discard a reaction, trigger a card ability.

```ts
import { cardTypes, zones } from "../shared/manifest-contract";

const playBoost = defineCardAction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  cardType: cardTypes.boost,
  playFrom: zones.actionHand,
  label: "Play boost",
  step: "main",
  inputs: {
    selectedSpaceId: boardInput.space<GameState, SpaceId>({
      target: selectableSpaceTarget,
    }),
    stealFromPlayerId: formInput(ids.playerId.nullable()),
  },
  validate({ state }) {
    return validateCanPlayActionCard(state);
  },
  reduce({ state, input, accept, ops }) {
    return accept(
      pipe(
        state,
        ops.moveCardFromPlayerZoneToSharedZone({
          playerId: input.playerId,
          fromZoneId: zones.actionHand,
          toZoneId: zones.playedCards,
          cardId: input.params.cardId,
          playedBy: input.playerId,
        }),
        ops.patchPublicState({ selectedSpaceId: input.params.selectedSpaceId }),
      ),
    );
  },
});
```

## How it differs from defineInteraction

`defineCardAction` supplies the card-specific contract:

| Field | Meaning |
| --- | --- |
| `cardType` | Manifest card type that can trigger this action. |
| `playFrom` | Manifest player zone id the card must be playable from. |
| `inputs` | Additional params besides the selected card. |
| `step` / `steps` | Optional phase-step gates, typed from `state.phase.step` when your phase state schema declares a string literal union. |
| `reduce` | Receives `input.params.cardId` automatically. |

The generated interaction surface treats card actions as hand interactions. UI hand surfaces can show a playable card and collect additional inputs without each workspace inventing local card-action plumbing.

Card actions do not take `surface` or `group`. They are always card-anchored hand interactions. Use `defineInteraction` for panel commands and panel grouping.

## Zone-backed rendering

Declare the hand zone once in the phase:

```ts
zones: [zones.actionHand],
cardActions: {
  playBoost,
  playDrawCards,
  playBuildPath,
},
```

The reducer projection is keyed by the manifest zone id, such as `action-hand`. Import `zones` and `cardTypes` from the generated manifest contract so authoring code uses typed handles instead of raw string ids. The generated UI contract exposes the JS-friendly renderer key `actionHand` for `WorkspaceGameShell` hand surfaces. Cards come from the listed manifest player zone; playable descriptors are derived from `cardActions` whose `playFrom` matches that zone.

## Validation

Target validation still runs before authored `validate`. Use authored `validate` for card-specific business rules: once per turn, bought this turn, enough resources, correct phase step, or no pending trade.

Move the card in `reduce`. `defineCardAction` makes the card id available; it does not decide whether the card should be discarded, trashed, returned, tucked, or left in play.

## When to use defineInteraction instead

Use `defineInteraction` when:

- the action is not tied to a card instance
- the player chooses from a board target, form, or panel button first
- a prompt asks for a response
- the card is only one optional input among several unrelated choices

Use `defineCardAction` when the card is the object being played.
