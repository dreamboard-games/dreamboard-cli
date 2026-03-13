/**
 * Card component fixtures
 * Demonstrates various card states and interactions
 */
import React, { useState } from "react";
import { Card, type CardItem } from "../Card.js";

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-8 flex items-center justify-center">
      {children}
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
];

// Custom card renderer showing suit and rank
function PlayingCardRenderer({ card }: { card: CardItem }) {
  const props = card.properties as { suit: string; rank: string };
  const isRed = props.suit === "♥" || props.suit === "♦";

  return (
    <div className="flex flex-col items-center justify-center h-full p-2">
      <span
        className={`text-2xl font-bold ${isRed ? "text-red-500" : "text-slate-800"}`}
      >
        {props.rank}
      </span>
      <span className={`text-3xl ${isRed ? "text-red-500" : "text-slate-800"}`}>
        {props.suit}
      </span>
    </div>
  );
}

// Interactive demo with selection
function InteractiveDemo() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Container>
      <div className="space-y-8">
        <h2 className="text-xl font-bold text-white text-center">
          Click to Select
        </h2>
        <div className="flex gap-4 flex-wrap justify-center">
          {SAMPLE_CARDS.map((card) => (
            <Card
              key={card.id}
              card={card}
              selected={selectedId === card.id}
              onCardClick={(id) => setSelectedId(selectedId === id ? null : id)}
              renderContent={(c) => <PlayingCardRenderer card={c} />}
            />
          ))}
        </div>
        <p className="text-white/70 text-center">
          Selected: {selectedId || "None"}
        </p>
      </div>
    </Container>
  );
}

export default {
  default: (
    <Container>
      <Card card={SAMPLE_CARDS[0]} />
    </Container>
  ),

  withCustomRenderer: (
    <Container>
      <Card
        card={SAMPLE_CARDS[0]}
        renderContent={(card) => <PlayingCardRenderer card={card} />}
      />
    </Container>
  ),

  selected: (
    <Container>
      <Card
        card={SAMPLE_CARDS[1]}
        selected={true}
        renderContent={(card) => <PlayingCardRenderer card={card} />}
      />
    </Container>
  ),

  disabled: (
    <Container>
      <Card
        card={SAMPLE_CARDS[2]}
        disabled={true}
        renderContent={(card) => <PlayingCardRenderer card={card} />}
      />
    </Container>
  ),

  faceDown: (
    <Container>
      <Card card={SAMPLE_CARDS[0]} faceDown={true} />
    </Container>
  ),

  sizes: (
    <Container>
      <div className="flex items-end gap-6">
        <div className="text-center">
          <Card
            card={SAMPLE_CARDS[0]}
            size="sm"
            renderContent={(card) => <PlayingCardRenderer card={card} />}
          />
          <p className="text-white/70 mt-2 text-sm">Small</p>
        </div>
        <div className="text-center">
          <Card
            card={SAMPLE_CARDS[1]}
            size="md"
            renderContent={(card) => <PlayingCardRenderer card={card} />}
          />
          <p className="text-white/70 mt-2 text-sm">Medium</p>
        </div>
        <div className="text-center">
          <Card
            card={SAMPLE_CARDS[2]}
            size="lg"
            renderContent={(card) => <PlayingCardRenderer card={card} />}
          />
          <p className="text-white/70 mt-2 text-sm">Large</p>
        </div>
      </div>
    </Container>
  ),

  interactive: <InteractiveDemo />,

  allCards: (
    <Container>
      <div className="grid grid-cols-4 gap-4">
        {SAMPLE_CARDS.map((card) => (
          <Card
            key={card.id}
            card={card}
            renderContent={(c) => <PlayingCardRenderer card={c} />}
            onCardClick={(id) => console.log("Clicked:", id)}
          />
        ))}
      </div>
    </Container>
  ),
};
