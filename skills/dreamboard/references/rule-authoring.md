# Rule Authoring Guide

Use this guide when creating or rewriting `rule.md`.

`rule.md` should explain how the game works in plain language. It is the source of intent for the game. `manifest.json` comes later and turns that intent into runtime structure.

Keep the jobs separate:

- `rule.md` explains the rules
- `manifest.json` defines the runtime model
- `app/phases/*.ts` implements the rules

If you need schema details, use [manifest-authoring.md](manifest-authoring.md). If you need help deciding between hands and decks, use [hands-vs-decks.md](hands-vs-decks.md).

## Recommended Document Structure

Use this section order in `rule.md`.

1. **Overview**

   - Game premise and objective
   - Player count
   - Match length target

2. **Components**

   - Cards, hands, decks, tokens, dice, boards, resources
   - Public vs hidden information
   - Limits such as hand size or token caps

3. **Setup**

   - Starting layout
   - Starting player and turn order
   - Initial cards, resources, and other player state

4. **Gameplay**

   - Turn or phase loop in order
   - Available actions in each phase
   - Validation constraints
   - Transition conditions between phases

5. **Scoring and Progression**

   - How points or progress are gained or lost
   - When scoring happens
   - Tie-breakers

6. **Winning Conditions**

   - Exact end-game triggers
   - Winner resolution rules

7. **Special Rules and Edge Cases**

   - Simultaneous actions
   - Empty deck behavior
   - Invalid or no-op actions
   - What happens when a player cannot act

## Writing Rules That Map Cleanly To The Engine

- **Phase model**
  State whether a phase is automatic, single-player, or all-players, and say how it ends.
- **Action model**
  Name each action, say what it does, and list required inputs and constraints.
- **State model**
  Separate stored state from derived state. If something can be computed from cards, resources, or the current phase, call that out.
- **Visibility model**
  Say who can see what, when hidden information becomes public, and when reveals happen.
- **Determinism**
  Resolve ambiguous cases with explicit priority order. Define random events precisely.

## Writing Style

- Use `must` for mandatory behavior.
- Use `may` only for optional player choices.
- Define terms once, then reuse the same words consistently.
- Avoid UI-specific verbs such as "click" or "drag".

## High-Signal Template

Use this template when creating or rewriting `rule.md`:

```markdown
# <Game Name>

## Overview

- Players: <min-max> (optimal: <n>)
- Objective: <how to win>
- Duration: <target minutes>

## Components

- Card sets:
- Shared decks:
- Player hands:
- Boards:
- Resources, tokens, or dice:
- Public vs hidden information:

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

### Phase 2: <name>

- ...

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
3. Run `dreamboard sync`.
4. Implement or refine `app/phases/*.ts`.
5. Validate the flow with `dreamboard run`, `dreamboard test generate`, and `dreamboard test run` as needed.
