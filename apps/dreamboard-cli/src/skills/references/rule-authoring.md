# Rule Authoring Guide

`rule.md` is the source of truth for game intent. A strong rule document leads to better manifest generation, better phase scaffolding, and fewer logic bugs.

## Recommended Document Structure

Use this section order in `rule.md`.

1. **Overview**

   - Game premise and objective.
   - Player count (min/max/optimal).
   - Match length target (for example 15-25 minutes).

2. **Components**

   - Cards, decks, hands, tokens, dice, boards, resources.
   - Public vs hidden information.
   - Limits (deck sizes, hand limits, token caps).

3. **Setup**

   - Initial board/deck/resource setup.
   - Starting player and initial turn order.
   - Initial cards/resources per player.

4. **Gameplay**

   - Turn or phase loop in order.
   - Available actions per phase.
   - Validation constraints for actions.
   - Transition conditions between phases.

5. **Scoring and Progression**

   - How points/resources/progress are gained or lost.
   - When scoring occurs (per action, end of round, end of game).
   - Tie-breakers.

6. **Winning Conditions**

   - Exact end-game triggers.
   - Winner resolution rules, including ties.

7. **Special Rules and Edge Cases**
   - Simultaneous actions.
   - Empty deck behavior.
   - Invalid/no-op action handling.
   - What happens when a player cannot act.

## Authoring Rules That Map Cleanly to Engine Concepts

Write rules in a way that maps directly to Dreamboard systems:

- **Phase model**

  - State whether a phase is automatic, single-player, or all-players.
  - State completion criteria for each phase.

- **Action model**

  - Define each action by name, intent, and required inputs.
  - Include action constraints ("must", "cannot", min/max quantities).

- **State model**

  - Separate persistent state from derived state.
  - Prefer explicit counters/flags over vague conditions.

- **Visibility model**

  - Specify what each player can see at all times.
  - Explicitly call out hidden hands, private choices, and reveal timing.

- **Determinism**
  - Resolve "if multiple options apply" with priority order.
  - Define random events precisely (shuffle, draw count, tie randomization).

## Writing Style Requirements

- Use explicit modal language:
  - Use "must" for mandatory behavior.
  - Use "may" only for optional player choices.
- Define terms once and reuse them exactly.
- Avoid UI instructions ("click", "drag") in rule logic.

## High-Signal Template

Use this template when creating or rewriting `rule.md`:

```markdown
# <Game Name>

## Overview

- Players: <min-max> (optimal: <n>)
- Objective: <how to win>
- Duration: <target minutes>

## Components

- Decks:
- Player hands:
- Shared zones:
- Resources/tokens/dice:
- Public vs hidden info:

## Setup

1. ...
2. ...
3. ...

## Gameplay

### Phase 1: <name> (<AUTO|SINGLE_PLAYER|ALL_PLAYERS>)

- Entry:
- Allowed actions:
- Validation:
- Completion -> Next phase:

### Phase 2: <name> ...

## Scoring and Progression

- ...

## Winning Conditions

- End trigger:
- Winner determination:
- Tie-breaker:
```

## Iteration Workflow

1. Edit `rule.md` first.
2. Align `manifest.json` to the updated rules.
3. Run `dreamboard update` to regenerate scaffolding.
4. Implement/refine `app/phases/*.ts`.
5. Validate flow with `dreamboard run`.
