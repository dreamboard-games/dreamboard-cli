# Star Settlers

## Overview

- Players: 3–4
- Objective: be the first player to reach 10 relic caches
- Duration: 60–120 minutes

## Components

- 1 shared hex sector board (19 terrain hexes)
- 5 terrain types: carbonCloud, alloyField, waterWorld, fiberGrove, crystalBelt (plus deadZone)
- Resource types: carbon, alloy, water, fiber, crystal
- 25 tech cards: patrol (14), jump gate (2), bounty survey (2), signalLock (2), relic cache (5)
- Per player: 15 routes, 5 outposts, 4 hubs
- 2 six-sided dice
- 1 raider piece (starts on the deadZone)

## Setup

1. Assemble the sector: 19 terrain hexes in the standard Star Settlers layout.
2. Place number tokens on non-deadZone hexes.
3. Place the raider on the deadZone hex.
4. Shuffle the tech card deck.
5. Initial placement (snake order): each player places 2 outposts and 2 routes.
   - After placing their second outpost, each player collects 1 resource for each adjacent terrain hex.
6. Player 1 goes first.

## Gameplay

### Phase: setup

Players take turns in snake order to place starting outposts and routes.
Each player places outpost then route twice (1→2→3→4→4→3→2→1).

### Phase: playerTurn

On each turn the active player:

1. **Roll dice** (`rollDice`): roll 2d6.
   - Sum of 7 → raider sequence.
   - Otherwise → produce resources from matching hexes.
2. **Take actions** (any order, optional):
   - `buildRoute`: spend 1 carbon + 1 alloy.
   - `buildOutpost`: spend 1 carbon + 1 alloy + 1 water + 1 fiber.
   - `upgradeToHub`: spend 2 water + 3 crystal; replaces an outpost.
   - `buyTechCard`: spend 1 water + 1 fiber + 1 crystal.
   - `playDevCard`: play one tech card (patrol, jump gate, bounty survey, signalLock, relic cache).
   - `tradeWithBank`: 4:1 exchange (or 3:1 / 2:1 with relays).
3. **End turn** (`endTurn`).

### Raider sequence (on 7)

1. Players with > 7 cards discard half.
2. Active player moves raider (`moveRaider`).
3. Active player seizes from an adjacent opponent (`seizeSupply`).

## Scoring

| Item                          | INF     |
| ----------------------------- | ------ |
| Outpost                    | 1      |
| Hub                          | 2      |
| Longest Route (≥ 5 continuous) | 2      |
| Fleet Command (≥ 3 patrols)    | 2      |
| Relic Cache tech card        | 1 each |

## Winning conditions

- First player to reach 10 INF at the end of their turn wins.

## Special rules

- Distance rule: outposts must be at least 2 edges apart from any other outpost or hub.
- Routes may not pass through an opponent's outpost or hub.
- Longest Route and Fleet Command can transfer between players.
- Relic Cache tech cards are revealed only when claiming victory.
