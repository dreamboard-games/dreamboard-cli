/**
 * SlotSystem component fixtures
 * Demonstrates worker placement visualization for Euro games
 */
import React, { useState } from "react";
import {
  SlotSystem,
  DefaultSlotItem,
  DefaultSlotOccupant,
  DefaultEmptySlot,
  type SlotDefinition,
  type SlotOccupant,
} from "../board/SlotSystem.js";

function Container({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          {children}
        </div>
      </div>
    </div>
  );
}

// Helper to format cost/reward for display
function formatResources(
  resources: Record<string, number> | undefined,
  prefix: string,
): string | undefined {
  if (!resources || Object.keys(resources).length === 0) return undefined;
  return Object.entries(resources)
    .map(([resource, amount]) => `${prefix}${amount} ${resource}`)
    .join(", ");
}

// Agricola-style action spaces
const agricolaSlots: SlotDefinition[] = [
  {
    id: "plow-field",
    name: "Plow 1 Field",
    description: "Create a new field tile",
    capacity: 1,
    exclusive: true,
    group: "Farming",
    reward: { field: 1 },
  },
  {
    id: "sow-bake",
    name: "Sow and/or Bake",
    description: "Sow grain/vegetables, bake bread",
    capacity: 1,
    exclusive: true,
    group: "Farming",
  },
  {
    id: "take-grain",
    name: "Take 1 Grain",
    description: "Take grain from the supply",
    capacity: 1,
    exclusive: true,
    group: "Farming",
    reward: { grain: 1 },
  },
  {
    id: "take-vegetable",
    name: "Take 1 Vegetable",
    description: "Take vegetable from the supply",
    capacity: 1,
    exclusive: true,
    group: "Farming",
    reward: { vegetable: 1 },
  },
  {
    id: "take-wood",
    name: "Take Wood",
    description: "Accumulating action",
    capacity: 1,
    exclusive: true,
    group: "Resources",
    reward: { wood: 3 },
  },
  {
    id: "take-clay",
    name: "Take Clay",
    description: "Accumulating action",
    capacity: 1,
    exclusive: true,
    group: "Resources",
    reward: { clay: 2 },
  },
  {
    id: "take-reed",
    name: "Take Reed",
    description: "Accumulating action",
    capacity: 1,
    exclusive: true,
    group: "Resources",
    reward: { reed: 1 },
  },
  {
    id: "fishing",
    name: "Fishing",
    description: "Accumulating action",
    capacity: 1,
    exclusive: true,
    group: "Resources",
    reward: { food: 2 },
  },
  {
    id: "build-rooms",
    name: "Build Room(s)",
    description: "Expand your home",
    capacity: 1,
    exclusive: true,
    group: "Building",
    cost: { wood: 5, reed: 2 },
  },
  {
    id: "build-stables",
    name: "Build Stables",
    description: "Build animal housing",
    capacity: 1,
    exclusive: true,
    group: "Building",
    cost: { wood: 2 },
  },
  {
    id: "family-growth",
    name: "Family Growth",
    description: "Add a family member",
    capacity: 1,
    exclusive: true,
    group: "Family",
    reward: { familyMember: 1 },
  },
  {
    id: "day-laborer",
    name: "Day Laborer",
    description: "Get food quickly",
    capacity: 1,
    exclusive: false,
    group: "Family",
    reward: { food: 2 },
  },
];

const playerColors: Record<string, string> = {
  "player-1": "#ef4444",
  "player-2": "#3b82f6",
  "player-3": "#22c55e",
  "player-4": "#eab308",
};

// Interactive worker placement demo
function InteractiveDemo() {
  const [occupants, setOccupants] = useState<SlotOccupant[]>([
    { pieceId: "w1-1", playerId: "player-1", slotId: "take-wood" },
    { pieceId: "w2-1", playerId: "player-2", slotId: "plow-field" },
    { pieceId: "w2-2", playerId: "player-2", slotId: "take-grain" },
    { pieceId: "w3-1", playerId: "player-3", slotId: "fishing" },
  ]);
  const [currentPlayer, setCurrentPlayer] = useState<string>("player-1");
  const [workersRemaining, setWorkersRemaining] = useState<
    Record<string, number>
  >({
    "player-1": 2,
    "player-2": 1,
    "player-3": 2,
  });

  const handleSlotClick = (slotId: string) => {
    const remaining = workersRemaining[currentPlayer] ?? 0;
    if (remaining <= 0) {
      alert("No workers remaining! Pass to next player.");
      return;
    }

    // Add worker
    const pieceId = `w${currentPlayer.slice(-1)}-${Date.now()}`;
    setOccupants((prev) => [
      ...prev,
      { pieceId, playerId: currentPlayer, slotId },
    ]);

    // Decrease remaining workers
    setWorkersRemaining((prev) => ({
      ...prev,
      [currentPlayer]: (prev[currentPlayer] ?? 0) - 1,
    }));

    // Next player
    const players = Object.keys(workersRemaining);
    const currentIndex = players.indexOf(currentPlayer);
    const nextPlayer = players[(currentIndex + 1) % players.length];
    if (nextPlayer) setCurrentPlayer(nextPlayer);
  };

  // Check if slot is available for current player
  const isSlotAvailable = (
    slot: SlotDefinition,
    slotOccupants: SlotOccupant[],
  ) => {
    if (slotOccupants.length >= slot.capacity) return false;
    if (
      slot.exclusive &&
      slotOccupants.some((o) => o.playerId === currentPlayer)
    )
      return false;
    if (slot.owner && slot.owner !== currentPlayer) return false;
    return true;
  };

  return (
    <Container title="Interactive Worker Placement (Agricola-style)">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-4">
          {Object.entries(playerColors)
            .slice(0, 3)
            .map(([id, color]) => (
              <span
                key={id}
                className={`flex items-center gap-2 px-3 py-1 rounded ${
                  currentPlayer === id ? "bg-slate-700 ring-2 ring-white" : ""
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-white text-sm">
                  {id
                    .replace("-", " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                <span className="text-slate-400 text-xs">
                  ({workersRemaining[id]} workers)
                </span>
              </span>
            ))}
        </div>
        <button
          onClick={() => {
            setOccupants([]);
            setWorkersRemaining({
              "player-1": 3,
              "player-2": 3,
              "player-3": 3,
            });
            setCurrentPlayer("player-1");
          }}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
        >
          Reset Round
        </button>
      </div>
      <SlotSystem
        slots={agricolaSlots}
        occupants={occupants}
        layout="grouped"
        renderSlot={(slot, slotOccupants) => {
          const available = isSlotAvailable(slot, slotOccupants);
          return (
            <DefaultSlotItem
              name={slot.name}
              description={slot.description}
              capacity={slot.capacity}
              occupantCount={slotOccupants.length}
              isExclusive={slot.exclusive}
              isAvailable={available}
              costLabel={formatResources(slot.cost, "-")}
              rewardLabel={formatResources(slot.reward, "+")}
              onClick={() => handleSlotClick(slot.id)}
              renderOccupants={() => (
                <div className="flex gap-1">
                  {slotOccupants.map((o) => (
                    <DefaultSlotOccupant
                      key={o.pieceId}
                      color={playerColors[o.playerId]}
                      label={`${o.playerId}'s worker`}
                    />
                  ))}
                  {Array(slot.capacity - slotOccupants.length)
                    .fill(null)
                    .map((_, i) => (
                      <DefaultEmptySlot key={`empty-${i}`} />
                    ))}
                </div>
              )}
            />
          );
        }}
      />
    </Container>
  );
}

// Simple grid layout
function GridLayoutDemo() {
  const simpleSlots: SlotDefinition[] = [
    {
      id: "a1",
      name: "Action A",
      capacity: 1,
      exclusive: true,
      reward: { gold: 2 },
    },
    {
      id: "a2",
      name: "Action B",
      capacity: 1,
      exclusive: true,
      reward: { gold: 3 },
    },
    {
      id: "a3",
      name: "Action C",
      capacity: 2,
      exclusive: false,
      reward: { gold: 1 },
    },
    {
      id: "a4",
      name: "Action D",
      capacity: 1,
      exclusive: true,
      cost: { gold: 1 },
    },
    { id: "a5", name: "Action E", capacity: 3, exclusive: false },
    { id: "a6", name: "Action F", capacity: 1, exclusive: true },
  ];

  const occupants: SlotOccupant[] = [
    { pieceId: "w1", playerId: "player-1", slotId: "a1" },
    { pieceId: "w2", playerId: "player-2", slotId: "a3" },
    { pieceId: "w3", playerId: "player-1", slotId: "a3" },
    { pieceId: "w4", playerId: "player-3", slotId: "a5" },
    { pieceId: "w5", playerId: "player-2", slotId: "a5" },
  ];

  return (
    <Container title="Responsive Grid Layout">
      <SlotSystem
        slots={simpleSlots}
        occupants={occupants}
        layout="grid"
        minSlotWidth={200}
        renderSlot={(slot, slotOccupants) => (
          <DefaultSlotItem
            name={slot.name}
            capacity={slot.capacity}
            occupantCount={slotOccupants.length}
            isExclusive={slot.exclusive}
            isAvailable={slotOccupants.length < slot.capacity}
            costLabel={formatResources(slot.cost, "-")}
            rewardLabel={formatResources(slot.reward, "+")}
            renderOccupants={() => (
              <div className="flex gap-1">
                {slotOccupants.map((o) => (
                  <DefaultSlotOccupant
                    key={o.pieceId}
                    color={playerColors[o.playerId]}
                  />
                ))}
                {Array(slot.capacity - slotOccupants.length)
                  .fill(null)
                  .map((_, i) => (
                    <DefaultEmptySlot key={`empty-${i}`} />
                  ))}
              </div>
            )}
          />
        )}
      />
    </Container>
  );
}

// List layout
function ListLayoutDemo() {
  const listSlots: SlotDefinition[] = [
    {
      id: "harvest",
      name: "Harvest Fields",
      description: "Collect grain and vegetables from your fields",
      capacity: 1,
      exclusive: true,
      reward: { grain: 2, vegetable: 1 },
    },
    {
      id: "market",
      name: "Go to Market",
      description: "Sell goods for gold",
      capacity: 2,
      exclusive: false,
      reward: { gold: 3 },
    },
    {
      id: "hire",
      name: "Hire Worker",
      description: "Add a new worker to your pool",
      capacity: 1,
      exclusive: true,
      cost: { gold: 5 },
      reward: { worker: 1 },
    },
  ];

  const occupants: SlotOccupant[] = [
    { pieceId: "w1", playerId: "player-1", slotId: "market" },
  ];

  return (
    <Container title="List Layout">
      <SlotSystem
        slots={listSlots}
        occupants={occupants}
        layout="list"
        renderSlot={(slot, slotOccupants) => (
          <DefaultSlotItem
            name={slot.name}
            description={slot.description}
            capacity={slot.capacity}
            occupantCount={slotOccupants.length}
            isExclusive={slot.exclusive}
            isAvailable={slotOccupants.length < slot.capacity}
            costLabel={formatResources(slot.cost, "-")}
            rewardLabel={formatResources(slot.reward, "+")}
            renderOccupants={() => (
              <div className="flex gap-1">
                {slotOccupants.map((o) => (
                  <DefaultSlotOccupant
                    key={o.pieceId}
                    color={playerColors[o.playerId]}
                  />
                ))}
                {Array(slot.capacity - slotOccupants.length)
                  .fill(null)
                  .map((_, i) => (
                    <DefaultEmptySlot key={`empty-${i}`} />
                  ))}
              </div>
            )}
          />
        )}
      />
    </Container>
  );
}

// Multi-capacity slots demo
function MultiCapacityDemo() {
  const multiSlots: SlotDefinition[] = [
    {
      id: "tavern",
      name: "The Tavern",
      description: "Gather and socialize",
      capacity: 4,
      exclusive: false,
    },
    {
      id: "mine",
      name: "The Mine",
      description: "Extract ore",
      capacity: 3,
      exclusive: false,
    },
    {
      id: "throne",
      name: "The Throne",
      description: "Audience with the king",
      capacity: 1,
      exclusive: true,
    },
  ];

  const occupants: SlotOccupant[] = [
    { pieceId: "w1", playerId: "player-1", slotId: "tavern" },
    { pieceId: "w2", playerId: "player-2", slotId: "tavern" },
    { pieceId: "w3", playerId: "player-3", slotId: "tavern" },
    { pieceId: "w4", playerId: "player-1", slotId: "mine" },
    { pieceId: "w5", playerId: "player-2", slotId: "mine" },
  ];

  return (
    <Container title="Multi-Capacity Slots">
      <SlotSystem
        slots={multiSlots}
        occupants={occupants}
        layout="grid"
        minSlotWidth={250}
        renderSlot={(slot, slotOccupants) => (
          <DefaultSlotItem
            name={slot.name}
            description={slot.description}
            capacity={slot.capacity}
            occupantCount={slotOccupants.length}
            isExclusive={slot.exclusive}
            isAvailable={slotOccupants.length < slot.capacity}
            renderOccupants={() => (
              <div className="flex gap-1 flex-wrap">
                {slotOccupants.map((o) => (
                  <DefaultSlotOccupant
                    key={o.pieceId}
                    color={playerColors[o.playerId]}
                  />
                ))}
                {Array(slot.capacity - slotOccupants.length)
                  .fill(null)
                  .map((_, i) => (
                    <DefaultEmptySlot key={`empty-${i}`} />
                  ))}
              </div>
            )}
          />
        )}
      />
      <div className="mt-4 text-sm text-slate-400">
        Tavern has 4 capacity (1 spot left), Mine has 3 (1 spot left), Throne is
        exclusive (available)
      </div>
    </Container>
  );
}

// Personal action spaces
function PersonalSlotsDemo() {
  const currentPlayerId = "player-2";

  const personalSlots: SlotDefinition[] = [
    {
      id: "shared-1",
      name: "Town Square",
      description: "Public action space",
      capacity: 2,
      exclusive: false,
    },
    {
      id: "p1-home",
      name: "Player 1 Home",
      description: "Only Player 1 can use",
      capacity: 1,
      exclusive: true,
      owner: "player-1",
    },
    {
      id: "p2-home",
      name: "Player 2 Home",
      description: "Only Player 2 can use",
      capacity: 1,
      exclusive: true,
      owner: "player-2",
    },
    {
      id: "shared-2",
      name: "Market",
      description: "Public action space",
      capacity: 1,
      exclusive: true,
    },
  ];

  const occupants: SlotOccupant[] = [
    { pieceId: "w1", playerId: "player-1", slotId: "shared-1" },
  ];

  return (
    <Container title="Personal Action Spaces">
      <SlotSystem
        slots={personalSlots}
        occupants={occupants}
        layout="grid"
        minSlotWidth={280}
        renderSlot={(slot, slotOccupants) => {
          const isOwnerRestricted =
            slot.owner && slot.owner !== currentPlayerId;
          const isAvailable =
            !isOwnerRestricted && slotOccupants.length < slot.capacity;
          return (
            <DefaultSlotItem
              name={slot.name}
              description={slot.description}
              capacity={slot.capacity}
              occupantCount={slotOccupants.length}
              isExclusive={slot.exclusive}
              isAvailable={isAvailable}
              className={isOwnerRestricted ? "opacity-50" : ""}
              renderOccupants={() => (
                <div className="flex gap-1">
                  {slotOccupants.map((o) => (
                    <DefaultSlotOccupant
                      key={o.pieceId}
                      color={playerColors[o.playerId]}
                    />
                  ))}
                  {Array(slot.capacity - slotOccupants.length)
                    .fill(null)
                    .map((_, i) => (
                      <DefaultEmptySlot key={`empty-${i}`} />
                    ))}
                </div>
              )}
            />
          );
        }}
      />
      <div className="mt-4 text-sm text-slate-400">
        As Player 2, you can see Player 1&apos;s home space is grayed out (not
        available)
      </div>
    </Container>
  );
}

// Large worker placement board with many slots - responsive stacking
function LargeBoardDemo() {
  // Extended slots for a larger game
  const extendedSlots: SlotDefinition[] = [
    ...agricolaSlots,
    {
      id: "sheep-market",
      name: "Sheep Market",
      description: "Buy sheep for your farm",
      capacity: 2,
      exclusive: false,
      group: "Animals",
      cost: { food: 1 },
      reward: { sheep: 2 },
    },
    {
      id: "cattle-market",
      name: "Cattle Market",
      description: "Buy cattle for your farm",
      capacity: 2,
      exclusive: false,
      group: "Animals",
      cost: { food: 2 },
      reward: { cattle: 1 },
    },
    {
      id: "pig-market",
      name: "Pig Market",
      description: "Buy pigs for your farm",
      capacity: 2,
      exclusive: false,
      group: "Animals",
      cost: { food: 1 },
      reward: { pig: 1 },
    },
    {
      id: "occupation",
      name: "Play Occupation",
      description: "Play an occupation card",
      capacity: 1,
      exclusive: true,
      group: "Cards",
    },
    {
      id: "improvement",
      name: "Play Improvement",
      description: "Play a minor improvement",
      capacity: 1,
      exclusive: true,
      group: "Cards",
    },
  ];

  const occupants: SlotOccupant[] = [
    { pieceId: "w1", playerId: "player-1", slotId: "take-wood" },
    { pieceId: "w2", playerId: "player-2", slotId: "sheep-market" },
    { pieceId: "w3", playerId: "player-3", slotId: "occupation" },
  ];

  return (
    <Container title="Large Board with Many Slots (Responsive)">
      <p className="text-slate-400 text-sm mb-4">
        17 action spaces - slots stack responsively on smaller screens.
      </p>
      <SlotSystem
        slots={extendedSlots}
        occupants={occupants}
        layout="grouped"
        renderSlot={(slot, slotOccupants) => (
          <DefaultSlotItem
            name={slot.name}
            description={slot.description}
            capacity={slot.capacity}
            occupantCount={slotOccupants.length}
            isExclusive={slot.exclusive}
            isAvailable={slotOccupants.length < slot.capacity}
            costLabel={formatResources(slot.cost, "-")}
            rewardLabel={formatResources(slot.reward, "+")}
            renderOccupants={() => (
              <div className="flex gap-1">
                {slotOccupants.map((o) => (
                  <DefaultSlotOccupant
                    key={o.pieceId}
                    color={playerColors[o.playerId]}
                  />
                ))}
                {Array(slot.capacity - slotOccupants.length)
                  .fill(null)
                  .map((_, i) => (
                    <DefaultEmptySlot key={`empty-${i}`} />
                  ))}
              </div>
            )}
          />
        )}
      />
    </Container>
  );
}

// Narrow container demo - shows stacking behavior
function NarrowContainerDemo() {
  const occupants: SlotOccupant[] = [
    { pieceId: "w1", playerId: "player-1", slotId: "plow-field" },
  ];

  return (
    <Container title="Narrow Container (Stacking Demo)">
      <p className="text-slate-400 text-sm mb-4">
        In a narrow container, slots stack vertically.
      </p>
      <div className="max-w-sm mx-auto">
        <SlotSystem
          slots={agricolaSlots.slice(0, 4)}
          occupants={occupants}
          layout="grid"
          minSlotWidth={250}
          renderSlot={(slot, slotOccupants) => (
            <DefaultSlotItem
              name={slot.name}
              description={slot.description}
              capacity={slot.capacity}
              occupantCount={slotOccupants.length}
              isExclusive={slot.exclusive}
              isAvailable={slotOccupants.length < slot.capacity}
              costLabel={formatResources(slot.cost, "-")}
              rewardLabel={formatResources(slot.reward, "+")}
              renderOccupants={() => (
                <div className="flex gap-1">
                  {slotOccupants.map((o) => (
                    <DefaultSlotOccupant
                      key={o.pieceId}
                      color={playerColors[o.playerId]}
                    />
                  ))}
                  {Array(slot.capacity - slotOccupants.length)
                    .fill(null)
                    .map((_, i) => (
                      <DefaultEmptySlot key={`empty-${i}`} />
                    ))}
                </div>
              )}
            />
          )}
          renderOccupant={(occupant) => (
            <DefaultSlotOccupant color={playerColors[occupant.playerId]} />
          )}
        />
      </div>
    </Container>
  );
}

export default {
  interactive: <InteractiveDemo />,
  grid: <GridLayoutDemo />,
  list: <ListLayoutDemo />,
  multiCapacity: <MultiCapacityDemo />,
  personal: <PersonalSlotsDemo />,
  largeBoard: <LargeBoardDemo />,
  narrowContainer: <NarrowContainerDemo />,

  default: (
    <Container title="Basic Slot System">
      <SlotSystem
        slots={agricolaSlots.slice(0, 8)}
        occupants={[
          { pieceId: "w1", playerId: "player-1", slotId: "take-wood" },
          { pieceId: "w2", playerId: "player-2", slotId: "plow-field" },
        ]}
        layout="grid"
        renderSlot={(slot, slotOccupants) => (
          <DefaultSlotItem
            name={slot.name}
            description={slot.description}
            capacity={slot.capacity}
            occupantCount={slotOccupants.length}
            isExclusive={slot.exclusive}
            isAvailable={slotOccupants.length < slot.capacity}
            costLabel={formatResources(slot.cost, "-")}
            rewardLabel={formatResources(slot.reward, "+")}
            renderOccupants={() => (
              <div className="flex gap-1">
                {slotOccupants.map((o) => (
                  <DefaultSlotOccupant
                    key={o.pieceId}
                    color={playerColors[o.playerId]}
                  />
                ))}
                {Array(slot.capacity - slotOccupants.length)
                  .fill(null)
                  .map((_, i) => (
                    <DefaultEmptySlot key={`empty-${i}`} />
                  ))}
              </div>
            )}
          />
        )}
      />
    </Container>
  ),
};
