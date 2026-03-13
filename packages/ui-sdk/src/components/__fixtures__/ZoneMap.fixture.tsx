/**
 * ZoneMap component fixtures
 * Demonstrates area control visualization for territory games
 */
import React, { useState, useMemo } from "react";
import {
  ZoneMap,
  DefaultZone,
  DefaultZonePieces,
  type ZoneDefinition,
  type ZonePiece,
} from "../board/ZoneMap.js";

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

// Sample Risk-style continent
const europeZones: ZoneDefinition[] = [
  {
    id: "britain",
    name: "Britain",
    adjacentTo: ["scandinavia", "western-europe", "iceland"],
    value: 2,
    shape: {
      type: "circle",
      center: { x: 180, y: 150 },
      radius: 35,
    },
  },
  {
    id: "iceland",
    name: "Iceland",
    adjacentTo: ["britain", "scandinavia", "greenland"],
    value: 1,
    shape: {
      type: "circle",
      center: { x: 120, y: 80 },
      radius: 25,
    },
  },
  {
    id: "scandinavia",
    name: "Scandinavia",
    adjacentTo: ["britain", "iceland", "northern-europe", "russia"],
    value: 3,
    shape: {
      type: "polygon",
      points: [
        { x: 280, y: 50 },
        { x: 350, y: 60 },
        { x: 360, y: 120 },
        { x: 300, y: 160 },
        { x: 250, y: 120 },
      ],
      center: { x: 305, y: 100 },
    },
  },
  {
    id: "western-europe",
    name: "W. Europe",
    adjacentTo: ["britain", "northern-europe", "southern-europe"],
    value: 2,
    shape: {
      type: "polygon",
      points: [
        { x: 150, y: 200 },
        { x: 220, y: 200 },
        { x: 240, y: 280 },
        { x: 200, y: 320 },
        { x: 140, y: 280 },
      ],
      center: { x: 190, y: 255 },
    },
  },
  {
    id: "northern-europe",
    name: "N. Europe",
    adjacentTo: ["scandinavia", "western-europe", "southern-europe", "russia"],
    value: 3,
    shape: {
      type: "polygon",
      points: [
        { x: 240, y: 160 },
        { x: 320, y: 160 },
        { x: 340, y: 220 },
        { x: 280, y: 260 },
        { x: 220, y: 220 },
      ],
      center: { x: 280, y: 200 },
    },
  },
  {
    id: "southern-europe",
    name: "S. Europe",
    adjacentTo: [
      "western-europe",
      "northern-europe",
      "russia",
      "egypt",
      "middle-east",
    ],
    value: 2,
    shape: {
      type: "polygon",
      points: [
        { x: 220, y: 280 },
        { x: 320, y: 260 },
        { x: 360, y: 340 },
        { x: 280, y: 380 },
        { x: 200, y: 340 },
      ],
      center: { x: 275, y: 320 },
    },
  },
  {
    id: "russia",
    name: "Russia",
    adjacentTo: [
      "scandinavia",
      "northern-europe",
      "southern-europe",
      "ural",
      "middle-east",
    ],
    value: 4,
    shape: {
      type: "polygon",
      points: [
        { x: 360, y: 80 },
        { x: 500, y: 100 },
        { x: 520, y: 200 },
        { x: 450, y: 280 },
        { x: 360, y: 220 },
      ],
      center: { x: 430, y: 170 },
    },
  },
];

const samplePieces: ZonePiece[] = [
  {
    id: "army-1",
    zoneId: "britain",
    type: "army",
    owner: "player-1",
    count: 3,
  },
  {
    id: "army-2",
    zoneId: "scandinavia",
    type: "army",
    owner: "player-1",
    count: 5,
  },
  {
    id: "army-3",
    zoneId: "western-europe",
    type: "army",
    owner: "player-2",
    count: 4,
  },
  { id: "army-4", zoneId: "russia", type: "army", owner: "player-2", count: 8 },
  {
    id: "army-5",
    zoneId: "southern-europe",
    type: "army",
    owner: "player-3",
    count: 2,
  },
  {
    id: "army-6",
    zoneId: "northern-europe",
    type: "army",
    owner: "player-1",
    count: 3,
  },
];

const playerColors: Record<string, string> = {
  "player-1": "#ef4444", // Red
  "player-2": "#3b82f6", // Blue
  "player-3": "#22c55e", // Green
};

// Interactive demo with zone selection
function InteractiveDemo() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const handleZoneClick = (zoneId: string) => {
    setSelectedZone(zoneId === selectedZone ? null : zoneId);
  };

  // Get adjacent zones for highlighting
  const selectedZoneDef = europeZones.find((z) => z.id === selectedZone);
  const adjacentZones = useMemo(
    () => new Set(selectedZoneDef?.adjacentTo || []),
    [selectedZoneDef],
  );

  return (
    <Container title="Interactive Map (Click to select, see adjacent zones)">
      <ZoneMap
        zones={europeZones}
        pieces={samplePieces}
        width={600}
        height={450}
        renderZone={(zone, zonePieces) => {
          const isSelected = zone.id === selectedZone;
          const isAdjacent = adjacentZones.has(zone.id);

          return (
            <DefaultZone
              zone={zone}
              isSelected={isSelected}
              isHighlighted={isAdjacent}
              highlightType={isAdjacent ? "valid" : undefined}
              showLabel={true}
              showValue={true}
              onClick={() => handleZoneClick(zone.id)}
              onHover={(hovering) => setHoveredZone(hovering ? zone.id : null)}
            >
              <DefaultZonePieces
                pieces={zonePieces}
                zone={zone}
                playerColors={playerColors}
              />
            </DefaultZone>
          );
        }}
      />
      <div className="mt-4 flex gap-4 text-sm text-slate-400">
        <span>
          {selectedZone
            ? `Selected: ${europeZones.find((z) => z.id === selectedZone)?.name}`
            : "Click a zone to select it"}
        </span>
        {hoveredZone && (
          <span>
            Hovering: {europeZones.find((z) => z.id === hoveredZone)?.name}
          </span>
        )}
      </div>
    </Container>
  );
}

// Attack mode demo
function AttackDemo() {
  const sourceZone = "britain";

  // Find attackable zones (adjacent zones not owned by player-1)
  const sourceZoneDef = europeZones.find((z) => z.id === sourceZone);
  const ownedByPlayer1 = samplePieces
    .filter((p) => p.owner === "player-1")
    .map((p) => p.zoneId);

  const attackableZones = useMemo(
    () =>
      new Set(
        sourceZoneDef?.adjacentTo.filter(
          (adj) => !ownedByPlayer1.includes(adj),
        ) || [],
      ),
    [sourceZoneDef, ownedByPlayer1],
  );

  return (
    <Container title="Attack Mode (Red zones are attackable from Britain)">
      <ZoneMap
        zones={europeZones}
        pieces={samplePieces}
        width={600}
        height={450}
        renderZone={(zone, zonePieces) => {
          const isSource = zone.id === sourceZone;
          const isAttackable = attackableZones.has(zone.id);

          return (
            <DefaultZone
              zone={zone}
              isSelected={isSource}
              isHighlighted={isAttackable}
              highlightType={isAttackable ? "attack" : undefined}
              showLabel={true}
              showValue={true}
            >
              <DefaultZonePieces
                pieces={zonePieces}
                zone={zone}
                playerColors={playerColors}
              />
            </DefaultZone>
          );
        }}
      />
      <div className="mt-4 text-sm text-slate-400">
        Player 1 (red) can attack from Britain to:{" "}
        {Array.from(attackableZones)
          .map((z) => europeZones.find((zone) => zone.id === z)?.name)
          .join(", ")}
      </div>
    </Container>
  );
}

// Simple circular zones
function SimpleCirclesDemo() {
  const simpleZones: ZoneDefinition[] = [
    {
      id: "north",
      name: "North",
      adjacentTo: ["east", "west", "center"],
      value: 2,
      shape: { type: "circle", center: { x: 200, y: 80 }, radius: 40 },
    },
    {
      id: "south",
      name: "South",
      adjacentTo: ["east", "west", "center"],
      value: 2,
      shape: { type: "circle", center: { x: 200, y: 280 }, radius: 40 },
    },
    {
      id: "east",
      name: "East",
      adjacentTo: ["north", "south", "center"],
      value: 3,
      shape: { type: "circle", center: { x: 320, y: 180 }, radius: 40 },
    },
    {
      id: "west",
      name: "West",
      adjacentTo: ["north", "south", "center"],
      value: 3,
      shape: { type: "circle", center: { x: 80, y: 180 }, radius: 40 },
    },
    {
      id: "center",
      name: "Center",
      adjacentTo: ["north", "south", "east", "west"],
      value: 5,
      shape: { type: "circle", center: { x: 200, y: 180 }, radius: 50 },
    },
  ];

  const simplePieces: ZonePiece[] = [
    { id: "p1", zoneId: "north", type: "army", owner: "player-1", count: 2 },
    { id: "p2", zoneId: "center", type: "army", owner: "player-2", count: 5 },
    { id: "p3", zoneId: "south", type: "army", owner: "player-1", count: 3 },
  ];

  return (
    <Container title="Simple Circular Zones">
      <ZoneMap
        zones={simpleZones}
        pieces={simplePieces}
        width={400}
        height={360}
        renderZone={(zone, zonePieces) => (
          <DefaultZone zone={zone} showLabel={true} showValue={true}>
            <DefaultZonePieces
              pieces={zonePieces}
              zone={zone}
              playerColors={playerColors}
            />
          </DefaultZone>
        )}
      />
    </Container>
  );
}

// Multiple piece types
function MultiPieceDemo() {
  const contestedPieces: ZonePiece[] = [
    {
      id: "a1",
      zoneId: "northern-europe",
      type: "army",
      owner: "player-1",
      count: 3,
    },
    {
      id: "a2",
      zoneId: "northern-europe",
      type: "army",
      owner: "player-2",
      count: 4,
    },
    {
      id: "a3",
      zoneId: "northern-europe",
      type: "army",
      owner: "player-3",
      count: 2,
    },
    { id: "b1", zoneId: "russia", type: "army", owner: "player-2", count: 6 },
    { id: "c1", zoneId: "britain", type: "army", owner: "player-1", count: 5 },
  ];

  return (
    <Container title="Multiple Players in Same Zone">
      <ZoneMap
        zones={europeZones}
        pieces={contestedPieces}
        width={600}
        height={450}
        renderZone={(zone, zonePieces) => (
          <DefaultZone zone={zone} showLabel={true} showValue={true}>
            <DefaultZonePieces
              pieces={zonePieces}
              zone={zone}
              playerColors={playerColors}
            />
          </DefaultZone>
        )}
      />
      <div className="mt-4 text-sm text-slate-400">
        Northern Europe is contested by all three players!
      </div>
    </Container>
  );
}

// Responsive pan & zoom demo
function ResponsiveDemo() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const handleZoneClick = (zoneId: string) => {
    setSelectedZone(zoneId === selectedZone ? null : zoneId);
  };

  return (
    <Container title="Responsive with Pan & Zoom (Mobile-Friendly)">
      <p className="text-slate-400 text-sm mb-4">
        Drag to pan, pinch/scroll to zoom. Touch-friendly for mobile devices.
      </p>
      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <ZoneMap
          zones={europeZones}
          pieces={samplePieces}
          width="100%"
          height={400}
          enablePanZoom={true}
          initialZoom={1}
          minZoom={0.5}
          maxZoom={2.5}
          renderZone={(zone, zonePieces) => (
            <DefaultZone
              zone={zone}
              isSelected={zone.id === selectedZone}
              showLabel={true}
              showValue={true}
              onClick={() => handleZoneClick(zone.id)}
            >
              <DefaultZonePieces
                pieces={zonePieces}
                zone={zone}
                playerColors={playerColors}
              />
            </DefaultZone>
          )}
        />
      </div>
      <div className="mt-4 text-slate-400 text-sm">
        {selectedZone
          ? `Selected: ${europeZones.find((z) => z.id === selectedZone)?.name}`
          : "Click a zone to select. Pan & zoom to explore the map."}
      </div>
    </Container>
  );
}

// Full width responsive container
function FullWidthDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-4">
      <h2 className="text-xl font-bold text-white mb-4">Full Width Zone Map</h2>
      <p className="text-slate-400 text-sm mb-4">
        Container scales with viewport width. Great for responsive layouts.
      </p>
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <ZoneMap
          zones={europeZones}
          pieces={samplePieces}
          width="100%"
          height={450}
          enablePanZoom={true}
          renderZone={(zone, zonePieces) => (
            <DefaultZone zone={zone} showLabel={true} showValue={true}>
              <DefaultZonePieces
                pieces={zonePieces}
                zone={zone}
                playerColors={playerColors}
              />
            </DefaultZone>
          )}
        />
      </div>
    </div>
  );
}

// Large world map demo (simulated)
function LargeMapDemo() {
  // Create a larger world with more zones
  const worldZones: ZoneDefinition[] = [
    ...europeZones,
    // Add more zones for a larger map
    {
      id: "north-africa",
      name: "N. Africa",
      adjacentTo: ["southern-europe", "egypt"],
      value: 3,
      shape: {
        type: "polygon",
        points: [
          { x: 180, y: 420 },
          { x: 280, y: 400 },
          { x: 320, y: 480 },
          { x: 200, y: 500 },
        ],
        center: { x: 245, y: 450 },
      },
    },
    {
      id: "egypt",
      name: "Egypt",
      adjacentTo: ["north-africa", "southern-europe", "middle-east"],
      value: 2,
      shape: {
        type: "circle",
        center: { x: 400, y: 440 },
        radius: 35,
      },
    },
    {
      id: "middle-east",
      name: "M. East",
      adjacentTo: ["egypt", "russia", "southern-europe"],
      value: 3,
      shape: {
        type: "polygon",
        points: [
          { x: 450, y: 340 },
          { x: 550, y: 360 },
          { x: 520, y: 450 },
          { x: 420, y: 420 },
        ],
        center: { x: 485, y: 395 },
      },
    },
  ];

  const worldPieces: ZonePiece[] = [
    ...samplePieces,
    {
      id: "army-7",
      zoneId: "north-africa",
      type: "army",
      owner: "player-3",
      count: 4,
    },
    {
      id: "army-8",
      zoneId: "egypt",
      type: "army",
      owner: "player-2",
      count: 2,
    },
    {
      id: "army-9",
      zoneId: "middle-east",
      type: "army",
      owner: "player-1",
      count: 3,
    },
  ];

  return (
    <Container title="Large Map with Pan & Zoom">
      <p className="text-slate-400 text-sm mb-4">
        Extended map with more territories. Essential for large game boards on
        mobile.
      </p>
      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <ZoneMap
          zones={worldZones}
          pieces={worldPieces}
          width="100%"
          height={450}
          enablePanZoom={true}
          initialZoom={0.8}
          minZoom={0.4}
          maxZoom={2}
          renderZone={(zone, zonePieces) => (
            <DefaultZone zone={zone} showLabel={true} showValue={true}>
              <DefaultZonePieces
                pieces={zonePieces}
                zone={zone}
                playerColors={playerColors}
              />
            </DefaultZone>
          )}
        />
      </div>
    </Container>
  );
}

// Custom styled zones demo
function CustomStyledDemo() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  // Custom zone colors by type
  const zoneTypeColors: Record<string, string> = {
    capital: "rgba(234, 179, 8, 0.4)",
    fortress: "rgba(239, 68, 68, 0.3)",
    plains: "rgba(34, 197, 94, 0.2)",
  };

  const styledZones: ZoneDefinition[] = [
    {
      id: "capital",
      name: "Capital",
      type: "capital",
      adjacentTo: ["fortress", "plains-1", "plains-2"],
      value: 5,
      shape: { type: "circle", center: { x: 200, y: 150 }, radius: 50 },
    },
    {
      id: "fortress",
      name: "Fortress",
      type: "fortress",
      adjacentTo: ["capital", "plains-1"],
      value: 3,
      shape: {
        type: "polygon",
        points: [
          { x: 80, y: 220 },
          { x: 140, y: 200 },
          { x: 160, y: 280 },
          { x: 100, y: 300 },
          { x: 60, y: 260 },
        ],
        center: { x: 110, y: 250 },
      },
    },
    {
      id: "plains-1",
      name: "Plains",
      type: "plains",
      adjacentTo: ["capital", "fortress", "plains-2"],
      value: 1,
      shape: { type: "circle", center: { x: 320, y: 220 }, radius: 40 },
    },
    {
      id: "plains-2",
      name: "Meadow",
      type: "plains",
      adjacentTo: ["capital", "plains-1"],
      value: 1,
      shape: { type: "circle", center: { x: 280, y: 80 }, radius: 35 },
    },
  ];

  const styledPieces: ZonePiece[] = [
    { id: "p1", zoneId: "capital", type: "army", owner: "player-1", count: 5 },
    { id: "p2", zoneId: "fortress", type: "army", owner: "player-2", count: 3 },
  ];

  return (
    <Container title="Custom Styled Zones">
      <ZoneMap
        zones={styledZones}
        pieces={styledPieces}
        width={400}
        height={360}
        renderZone={(zone, zonePieces) => (
          <DefaultZone
            zone={zone}
            fill={zone.type ? zoneTypeColors[zone.type] : undefined}
            stroke={zone.type === "capital" ? "#eab308" : "#475569"}
            strokeWidth={zone.type === "capital" ? 3 : 1}
            isSelected={zone.id === selectedZone}
            showLabel={true}
            showValue={true}
            onClick={() =>
              setSelectedZone(zone.id === selectedZone ? null : zone.id)
            }
          >
            <DefaultZonePieces
              pieces={zonePieces}
              zone={zone}
              playerColors={playerColors}
            />
          </DefaultZone>
        )}
      />
      <div className="mt-4 text-sm text-slate-400">
        Different zone types have different colors: Capital (gold), Fortress
        (red), Plains (green)
      </div>
    </Container>
  );
}

export default {
  interactive: <InteractiveDemo />,
  attack: <AttackDemo />,
  simpleCircles: <SimpleCirclesDemo />,
  multiPiece: <MultiPieceDemo />,
  responsive: <ResponsiveDemo />,
  fullWidth: <FullWidthDemo />,
  largeMap: <LargeMapDemo />,
  customStyled: <CustomStyledDemo />,

  default: (
    <Container title="Basic Zone Map">
      <ZoneMap
        zones={europeZones}
        pieces={samplePieces}
        width={600}
        height={450}
        renderZone={(zone, zonePieces) => (
          <DefaultZone zone={zone} showLabel={true} showValue={true}>
            <DefaultZonePieces
              pieces={zonePieces}
              zone={zone}
              playerColors={playerColors}
            />
          </DefaultZone>
        )}
      />
    </Container>
  ),
};
