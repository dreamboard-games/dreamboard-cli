/**
 * PlayArea component fixtures
 * Demonstrates the central game board area with various layouts
 */
import React from "react";
import { PlayArea } from "../PlayArea.js";
import type { CardItem } from "../Card.js";

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">{children}</div>
    </div>
  );
}

// Sample card data for fixtures
const SAMPLE_CARDS: CardItem[] = [
  {
    id: "card-spade-A",
    type: "standard",
    cardName: "Ace of Spades",
    description: "The highest card",
    properties: { suit: "♠", rank: "A", value: 14 },
  },
  {
    id: "card-heart-K",
    type: "standard",
    cardName: "King of Hearts",
    description: "A royal card",
    properties: { suit: "♥", rank: "K", value: 13 },
  },
  {
    id: "card-diamond-Q",
    type: "standard",
    cardName: "Queen of Diamonds",
    description: "A royal card",
    properties: { suit: "♦", rank: "Q", value: 12 },
  },
  {
    id: "card-club-J",
    type: "standard",
    cardName: "Jack of Clubs",
    description: "A royal card",
    properties: { suit: "♣", rank: "J", value: 11 },
  },
  {
    id: "card-spade-10",
    type: "standard",
    cardName: "10 of Spades",
    description: "A number card",
    properties: { suit: "♠", rank: "10", value: 10 },
  },
  {
    id: "card-heart-9",
    type: "standard",
    cardName: "9 of Hearts",
    description: "A number card",
    properties: { suit: "♥", rank: "9", value: 9 },
  },
  {
    id: "card-diamond-8",
    type: "standard",
    cardName: "8 of Diamonds",
    description: "A number card",
    properties: { suit: "♦", rank: "8", value: 8 },
  },
  {
    id: "card-club-7",
    type: "standard",
    cardName: "7 of Clubs",
    description: "A number card",
    properties: { suit: "♣", rank: "7", value: 7 },
  },
];

// Custom card renderer
function PlayingCardRenderer({ card }: { card: CardItem }) {
  const props = card.properties as { suit: string; rank: string };
  const isRed = props.suit === "♥" || props.suit === "♦";

  return (
    <div className="flex flex-col items-center justify-center h-full p-2">
      <span
        className={`text-xl font-bold ${isRed ? "text-red-500" : "text-slate-800"}`}
      >
        {props.rank}
      </span>
      <span className={`text-2xl ${isRed ? "text-red-500" : "text-slate-800"}`}>
        {props.suit}
      </span>
    </div>
  );
}

export default {
  rowLayout: (
    <Container>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Row Layout (Default)</h2>
        <p className="text-white/70">Cards displayed in a horizontal row</p>
        <PlayArea
          cards={SAMPLE_CARDS.slice(0, 4)}
          layout="row"
          renderCard={(card) => <PlayingCardRenderer card={card} />}
        />
      </div>
    </Container>
  ),

  gridLayout: (
    <Container>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Grid Layout</h2>
        <p className="text-white/70">Cards displayed in a responsive grid</p>
        <PlayArea
          cards={SAMPLE_CARDS}
          layout="grid"
          renderCard={(card) => <PlayingCardRenderer card={card} />}
        />
      </div>
    </Container>
  ),

  emptyState: (
    <Container>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Empty State</h2>
        <p className="text-white/70">No cards in the play area</p>
        <PlayArea
          cards={[]}
          layout="row"
          renderCard={(card) => <PlayingCardRenderer card={card} />}
        />
      </div>
    </Container>
  ),

  interactive: (
    <Container>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Interactive Cards</h2>
        <p className="text-white/70">Click on cards to interact</p>
        <PlayArea
          cards={SAMPLE_CARDS.slice(0, 4)}
          layout="row"
          interactive={true}
          renderCard={(card) => <PlayingCardRenderer card={card} />}
          onCardClick={(id) => console.log("Card clicked:", id)}
        />
      </div>
    </Container>
  ),

  singleCard: (
    <Container>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">
          Single Card (Trick Winner)
        </h2>
        <p className="text-white/70">Displaying a winning card</p>
        <PlayArea
          cards={[SAMPLE_CARDS[0]]}
          layout="row"
          cardSize="lg"
          renderCard={(card) => <PlayingCardRenderer card={card} />}
        />
      </div>
    </Container>
  ),

  trickInProgress: (
    <Container>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Trick In Progress</h2>
        <p className="text-white/70">Current trick with 4 played cards</p>
        <PlayArea
          cards={SAMPLE_CARDS.slice(0, 4)}
          layout="row"
          cardSize="lg"
          renderCard={(card) => <PlayingCardRenderer card={card} />}
          aria-label="Current trick"
        />
      </div>
    </Container>
  ),

  sizes: (
    <Container>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Small Cards</h3>
          <PlayArea
            cards={SAMPLE_CARDS.slice(0, 4)}
            layout="row"
            cardSize="sm"
            renderCard={(card) => <PlayingCardRenderer card={card} />}
          />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Medium Cards</h3>
          <PlayArea
            cards={SAMPLE_CARDS.slice(0, 4)}
            layout="row"
            cardSize="md"
            renderCard={(card) => <PlayingCardRenderer card={card} />}
          />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Large Cards</h3>
          <PlayArea
            cards={SAMPLE_CARDS.slice(0, 4)}
            layout="row"
            cardSize="lg"
            renderCard={(card) => <PlayingCardRenderer card={card} />}
          />
        </div>
      </div>
    </Container>
  ),
};
