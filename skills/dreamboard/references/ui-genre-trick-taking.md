# UI Guide: Trick-Taking Games

Patterns for Hearts, Spades, Bridge, Big Two, and similar card-based trick-taking games.

## Game characteristics

- Players hold a **hand of cards** and play them to a shared **trick area**.
- One trick is resolved at a time; the winner collects cards.
- Turn order matters — typically clockwise from the trick leader.
- Key UI signals: whose turn it is, which cards are legal to play, current trick, scores.

## Recommended SDK components

### Primary

| Component    | Usage                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------- |
| `Hand`       | Display the current player's hand. Use `renderCard` to highlight playable cards.                    |
| `Card`       | Render individual cards in the hand and trick area. Use `renderContent` for custom suit/rank faces. |
| `PlayArea`   | Display the current trick — cards played by each player. Use `layout="row"`.                        |
| `PlayerInfo` | Show each player's name, score, and turn indicator around the table.                                |

### Supporting

| Component        | Usage                                                       |
| ---------------- | ----------------------------------------------------------- |
| `PhaseIndicator` | Show current phase (dealing, passing, playing, scoring).    |
| `GameEndDisplay` | Final scoreboard at game end.                               |
| `useToast`       | Feedback for invalid plays (e.g., "Must follow suit").      |
| `Drawer`         | Overflow drawer when the hand has too many cards on mobile. |

### Hooks

| Hook                 | Usage                                                                      |
| -------------------- | -------------------------------------------------------------------------- |
| `useMyHand(handId)`  | Get the current player's cards.                                            |
| `useCard / useCards` | Resolve card data for display.                                             |
| `useGameState`       | Get `currentPlayerIds`, `isMyTurn`, `currentState`.                        |
| `useAction`          | Submit play-card action.                                                   |
| `useUIArgs`          | Get phase-specific data (e.g., legal card IDs, trick cards, trick winner). |
| `usePlayerInfo`      | Map player IDs to names for trick display.                                 |

## Key patterns

### Card selection for play

```tsx
const [selectedCards, setSelectedCards] = useState<string[]>([]);
const { playCards } = useUIArgs();
const legalCardIds = new Set(playCards?.legalCardIds ?? []);

<Hand
  cards={myCards}
  selectedIds={selectedCards}
  renderCard={({ card, isSelected, ...pos }) => (
    <Card
      card={card}
      selected={isSelected}
      disabled={!legalCardIds.has(card.id)}
      onCardClick={(id) => toggleSelection(id)}
      style={{
        position: "absolute",
        left: pos.x,
        transform: `translateY(${pos.y}px)`,
        zIndex: pos.zIndex,
      }}
    />
  )}
  renderDrawer={({ cards }) => <DrawerContent cards={cards} />}
  renderEmpty={() => <p>No cards</p>}
/>;
```

### Trick display with player labels

```tsx
const playerInfo = usePlayerInfo();
const { playCards } = useUIArgs();
const trickCards = playCards?.trickCards ?? []; // { cardId, playerId }[]

<PlayArea
  cards={resolvedCards}
  layout="row"
  renderCard={(card) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-slate-400">
        {playerInfo[card.properties?.playedBy]?.name}
      </span>
      <SuitRankCard card={card} />
    </div>
  )}
/>;
```

## UIArgs recommendations

```typescript
// shared/ui-args.ts
export interface PlayCardsUIArgs {
  legalCardIds: string[]; // Cards the player can legally play
  trickCards: { cardId: string; playerId: string }[]; // Cards in the current trick
  trickLeader: string | null; // Who led the trick
  trumpSuit?: string; // Trump suit if applicable
}

export interface ScoringUIArgs {
  roundScores: Record<string, number>;
  totalScores: Record<string, number>;
}
```
