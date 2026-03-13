/**
 * Hand component fixtures
 * Demonstrates player hand display with render props pattern
 */
import React, { useState } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import {
  Hand,
  useHandLayout,
  type HandCardRenderProps,
  type HandDrawerRenderProps,
} from "../Hand.js";
import { Card, type CardItem } from "../Card.js";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../Drawer.js";

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-8">
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

// Custom playing card renderer
function PlayingCardContent({ card }: { card: CardItem }) {
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

// Default card render function
function DefaultCardRender({
  card,
  index: _index,
  isHovered: _isHovered,
  isSelected,
  x,
  y,
  zIndex,
}: HandCardRenderProps & {
  onCardClick?: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      key={card.id}
      className="absolute bottom-0 transition-all duration-150 ease-out"
      style={{
        left: x,
        zIndex,
        transform: `translateY(${y}px)`,
      }}
    >
      <Card
        card={card}
        selected={isSelected}
        size="md"
        renderContent={(c) => <PlayingCardContent card={c} />}
      />
    </div>
  );
}

// Default drawer render function
function DefaultDrawerRender({
  cards,
  selectedIds,
  cardCount,
  selectedCount,
  disabled,
}: HandDrawerRenderProps & { onCardClick?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const buttonLabel = `View ${cardCount} card${cardCount !== 1 ? "s" : ""}${selectedCount > 0 ? ` (${selectedCount} selected)` : ""}`;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className={clsx(
            "relative flex items-center gap-3 px-4 py-3 rounded-xl",
            "bg-gradient-to-r from-slate-800 to-slate-700",
            "text-white font-medium text-sm",
            "shadow-lg shadow-slate-900/20",
            "hover:from-slate-700 hover:to-slate-600",
            "active:scale-95 transition-all duration-150",
          )}
        >
          {/* Mini card stack preview */}
          <div className="relative w-8 h-10 flex-shrink-0">
            {cards.slice(0, 3).map((_, idx) => (
              <div
                key={idx}
                className="absolute bg-white rounded shadow-sm"
                style={{
                  width: 24,
                  height: 32,
                  left: idx * 3,
                  top: idx * 2,
                  zIndex: 3 - idx,
                  transform: `rotate(${(idx - 1) * 5}deg)`,
                }}
              />
            ))}
          </div>
          <span>{buttonLabel}</span>
          {selectedCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-xs font-bold">
              {selectedCount}
            </span>
          )}
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Your Hand</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 justify-items-center">
            {cards.map((card) => {
              const isSelected = selectedIds.includes(card.id);
              return (
                <Card
                  key={card.id}
                  card={card}
                  selected={isSelected}
                  disabled={disabled}
                  size="sm"
                  renderContent={(c) => <PlayingCardContent card={c} />}
                />
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// Interactive demo with selection
function InteractiveDemo() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleCardClick = (cardId: string) => {
    setSelectedIds((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : prev.length < 3
          ? [...prev, cardId]
          : prev,
    );
  };

  return (
    <Container>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            Select Up to 3 Cards
          </h2>
          <p className="text-white/70">Selected: {selectedIds.length}/3</p>
        </div>
        <Hand
          cards={SAMPLE_CARDS}
          selectedIds={selectedIds}
          layout="overlap"
          renderCard={(props) => (
            <div
              key={props.card.id}
              className="absolute bottom-0 transition-all duration-150 ease-out"
              style={{
                left: props.x,
                zIndex: props.zIndex,
                transform: `translateY(${props.y}px)`,
              }}
            >
              <Card
                card={props.card}
                selected={props.isSelected}
                size="md"
                onCardClick={handleCardClick}
                renderContent={(c) => <PlayingCardContent card={c} />}
              />
            </div>
          )}
          renderDrawer={(props) => (
            <DefaultDrawerRender {...props} onCardClick={handleCardClick} />
          )}
          renderEmpty={() => (
            <div className="text-gray-400 text-sm">No cards in hand</div>
          )}
        />
        {selectedIds.length === 3 && (
          <div className="text-center">
            <button
              onClick={() => {
                console.log("Passing cards:", selectedIds);
                setSelectedIds([]);
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Pass Cards
            </button>
          </div>
        )}
      </div>
    </Container>
  );
}

// Custom minimal style demo
function MinimalStyleDemo() {
  return (
    <Container>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white text-center">
          Minimal Custom Style
        </h2>
        <Hand
          cards={SAMPLE_CARDS.slice(0, 5)}
          layout="overlap"
          renderCard={({ card, x, y, zIndex, isSelected }) => (
            <div
              key={card.id}
              className="absolute bottom-0 transition-all duration-150"
              style={{ left: x, zIndex, transform: `translateY(${y}px)` }}
            >
              <div
                className={clsx(
                  "w-16 h-24 bg-amber-100 rounded-lg border-2 border-amber-600",
                  "flex items-center justify-center font-mono text-2xl",
                  isSelected && "ring-4 ring-blue-500",
                )}
              >
                {(card.properties as { rank: string }).rank}
              </div>
            </div>
          )}
          renderDrawer={({ cardCount }) => (
            <button className="px-4 py-2 bg-amber-600 text-white rounded">
              {cardCount} cards
            </button>
          )}
          renderEmpty={() => <span className="text-amber-200">Empty</span>}
        />
      </div>
    </Container>
  );
}

// Hook-only demo (full control)
function HookOnlyDemo() {
  const cards = SAMPLE_CARDS.slice(0, 5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const {
    containerRef,
    cardsContainerRef,
    totalWidth,
    cardDimensions,
    constants,
    hoveredIndex,
    handleMouseMove,
    handleMouseLeave,
    getCardPosition,
  } = useHandLayout({
    cardCount: cards.length,
    cardSize: "md",
    layout: "overlap",
  });

  return (
    <Container>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white text-center">
          Using useHandLayout Hook Directly
        </h2>
        <div
          ref={containerRef}
          className="relative w-full flex items-end justify-center py-6"
        >
          <div
            ref={cardsContainerRef}
            className="relative"
            style={{
              width: totalWidth,
              height: cardDimensions.height + constants.hoverLift + 8,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {cards.map((card, index) => {
              const isHovered = hoveredIndex === index;
              const isSelected = selectedIds.includes(card.id);
              const pos = getCardPosition(index, isHovered, isSelected);

              return (
                <motion.div
                  key={card.id}
                  className="absolute bottom-0"
                  style={{ left: pos.x, zIndex: pos.zIndex }}
                  animate={{ y: pos.y }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Card
                    card={card}
                    selected={isSelected}
                    size="md"
                    onCardClick={(id) =>
                      setSelectedIds((prev) =>
                        prev.includes(id)
                          ? prev.filter((i) => i !== id)
                          : [...prev, id],
                      )
                    }
                    renderContent={(c) => <PlayingCardContent card={c} />}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
        <p className="text-center text-white/70 text-sm">
          Selected: {selectedIds.length} | Hovered: {hoveredIndex ?? "none"}
        </p>
      </div>
    </Container>
  );
}

export default {
  interactive: <InteractiveDemo />,

  hookOnly: <HookOnlyDemo />,

  minimalStyle: <MinimalStyleDemo />,

  overlapLayout: (
    <Container>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white text-center">
          Overlap Layout (Default)
        </h2>
        <Hand
          cards={SAMPLE_CARDS}
          layout="overlap"
          renderCard={(props) => <DefaultCardRender {...props} />}
          renderDrawer={(props) => <DefaultDrawerRender {...props} />}
          renderEmpty={() => (
            <div className="text-gray-400 text-sm">No cards in hand</div>
          )}
        />
      </div>
    </Container>
  ),

  spreadLayout: (
    <Container>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white text-center">
          Spread Layout
        </h2>
        <Hand
          cards={SAMPLE_CARDS}
          layout="spread"
          renderCard={({ card, isSelected }) => (
            <div key={card.id} className="mx-0.5">
              <Card
                card={card}
                selected={isSelected}
                size="md"
                renderContent={(c) => <PlayingCardContent card={c} />}
              />
            </div>
          )}
          renderDrawer={(props) => <DefaultDrawerRender {...props} />}
          renderEmpty={() => (
            <div className="text-gray-400 text-sm">No cards in hand</div>
          )}
        />
      </div>
    </Container>
  ),

  withSelection: (
    <Container>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white text-center">
          With Selected Cards
        </h2>
        <Hand
          cards={SAMPLE_CARDS}
          selectedIds={[SAMPLE_CARDS[1]!.id, SAMPLE_CARDS[3]!.id]}
          layout="overlap"
          renderCard={(props) => <DefaultCardRender {...props} />}
          renderDrawer={(props) => <DefaultDrawerRender {...props} />}
          renderEmpty={() => (
            <div className="text-gray-400 text-sm">No cards in hand</div>
          )}
        />
      </div>
    </Container>
  ),

  emptyHand: (
    <Container>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white text-center">Empty Hand</h2>
        <Hand
          cards={[]}
          layout="overlap"
          renderCard={(props) => <DefaultCardRender {...props} />}
          renderDrawer={(props) => <DefaultDrawerRender {...props} />}
          renderEmpty={() => (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <span className="text-4xl">🃏</span>
              <span>No cards in hand</span>
            </div>
          )}
        />
      </div>
    </Container>
  ),

  singleCard: (
    <Container>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white text-center">
          Single Card
        </h2>
        <Hand
          cards={SAMPLE_CARDS.slice(0, 1)}
          layout="overlap"
          renderCard={(props) => <DefaultCardRender {...props} />}
          renderDrawer={(props) => <DefaultDrawerRender {...props} />}
          renderEmpty={() => (
            <div className="text-gray-400 text-sm">No cards in hand</div>
          )}
        />
      </div>
    </Container>
  ),
};
