/**
 * TrackBoard component fixtures
 * Demonstrates track/path visualization for racing and board games
 */
import React, { useState } from "react";
import {
  TrackBoard,
  DefaultTrackSpace,
  DefaultTrackPiece,
  DefaultTrackConnection,
  DefaultTrackJump,
  type TrackSpace,
  type TrackPiece,
} from "../board/TrackBoard.js";

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

// Generate Monopoly-style track (square board)
function generateMonopolyTrack(): TrackSpace[] {
  const spaces: TrackSpace[] = [];
  const size = 500;
  const padding = 60;
  const spacesPerSide = 10;
  const spaceWidth = (size - 2 * padding) / (spacesPerSide - 1);

  // Bottom row (GO -> Jail) - left to right
  for (let i = 0; i < spacesPerSide; i++) {
    spaces.push({
      id: `space-${spaces.length}`,
      index: spaces.length,
      name: i === 0 ? "GO" : i === spacesPerSide - 1 ? "JAIL" : undefined,
      position: { x: padding + i * spaceWidth, y: size - padding },
      type: i === 0 ? "go" : i === spacesPerSide - 1 ? "jail" : "property",
    });
  }

  // Right column (up)
  for (let i = 1; i < spacesPerSide; i++) {
    spaces.push({
      id: `space-${spaces.length}`,
      index: spaces.length,
      name: i === spacesPerSide - 1 ? "FREE" : undefined,
      position: { x: size - padding, y: size - padding - i * spaceWidth },
      type: i === spacesPerSide - 1 ? "free" : "property",
    });
  }

  // Top row (right to left)
  for (let i = 1; i < spacesPerSide; i++) {
    spaces.push({
      id: `space-${spaces.length}`,
      index: spaces.length,
      name: i === spacesPerSide - 1 ? "GO JAIL" : undefined,
      position: { x: size - padding - i * spaceWidth, y: padding },
      type: i === spacesPerSide - 1 ? "gotojail" : "property",
    });
  }

  // Left column (down)
  for (let i = 1; i < spacesPerSide - 1; i++) {
    spaces.push({
      id: `space-${spaces.length}`,
      index: spaces.length,
      position: { x: padding, y: padding + i * spaceWidth },
      type: "property",
    });
  }

  return spaces;
}

// Simple linear track with snakes and ladders
function generateSnakesAndLadders(): TrackSpace[] {
  const spaces: TrackSpace[] = [];
  const cols = 10;
  const rows = 10;
  const spaceSize = 50;
  const padding = 30;

  for (let i = 0; i < 100; i++) {
    const row = Math.floor(i / cols);
    const colInRow = i % cols;
    // Alternate direction each row (serpentine)
    const col = row % 2 === 0 ? colInRow : cols - 1 - colInRow;

    const space: TrackSpace = {
      id: `space-${i}`,
      index: i,
      name: i === 0 ? "START" : i === 99 ? "FINISH" : undefined,
      position: {
        x: padding + col * spaceSize,
        y: padding + (rows - 1 - row) * spaceSize,
      },
      type: i === 0 ? "start" : i === 99 ? "finish" : undefined,
    };

    // Add some ladders (jump forward)
    if (i === 4) space.jumpTo = "space-14";
    if (i === 9) space.jumpTo = "space-31";
    if (i === 28) space.jumpTo = "space-84";
    if (i === 51) space.jumpTo = "space-67";

    // Add some snakes (jump backward)
    if (i === 17) space.jumpTo = "space-7";
    if (i === 54) space.jumpTo = "space-34";
    if (i === 62) space.jumpTo = "space-19";
    if (i === 87) space.jumpTo = "space-24";
    if (i === 98) space.jumpTo = "space-78";

    spaces.push(space);
  }

  return spaces;
}

const monopolyTrack = generateMonopolyTrack();
const snakesTrack = generateSnakesAndLadders();

const playerColors: Record<string, string> = {
  "player-1": "#ef4444", // Red
  "player-2": "#3b82f6", // Blue
  "player-3": "#22c55e", // Green
  "player-4": "#eab308", // Yellow
};

const spaceSize = 45;

// Interactive Monopoly demo
function MonopolyDemo() {
  const [pieces, setPieces] = useState<TrackPiece[]>([
    { id: "token-1", spaceId: "space-0", owner: "player-1", type: "car" },
    { id: "token-2", spaceId: "space-3", owner: "player-2", type: "hat" },
    { id: "token-3", spaceId: "space-12", owner: "player-3", type: "dog" },
    { id: "token-4", spaceId: "space-0", owner: "player-4", type: "shoe" },
  ]);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  const handleSpaceClick = (spaceId: string) => {
    if (selectedPiece) {
      setPieces((prev) =>
        prev.map((p) => (p.id === selectedPiece ? { ...p, spaceId } : p)),
      );
      setSelectedPiece(null);
    }
  };

  const handlePieceClick = (pieceId: string) => {
    setSelectedPiece(pieceId === selectedPiece ? null : pieceId);
  };

  const highlightedSpaces = selectedPiece
    ? new Set(monopolyTrack.slice(0, 12).map((s) => s.id))
    : new Set<string>();

  return (
    <Container title="Monopoly Board (Click piece, then click space to move)">
      <TrackBoard
        spaces={monopolyTrack}
        pieces={pieces}
        type="circular"
        width={560}
        height={560}
        renderSpace={(space, spacePieces) => (
          <DefaultTrackSpace
            space={space}
            size={spaceSize}
            isHighlighted={highlightedSpaces.has(space.id)}
            onClick={() => handleSpaceClick(space.id)}
          >
            {spacePieces.map((piece, i) => (
              <DefaultTrackPiece
                key={piece.id}
                piece={piece}
                index={i}
                total={spacePieces.length}
                color={playerColors[piece.owner]}
                onClick={() => handlePieceClick(piece.id)}
              />
            ))}
          </DefaultTrackSpace>
        )}
      />
      <div className="mt-4 flex gap-4 text-sm">
        {["player-1", "player-2", "player-3", "player-4"].map((p) => (
          <span key={p} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: playerColors[p],
              }}
            />
            {p.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        ))}
      </div>
    </Container>
  );
}

// Snakes and Ladders demo
function SnakesLaddersDemo() {
  const [pieces, setPieces] = useState<TrackPiece[]>([
    { id: "token-1", spaceId: "space-0", owner: "player-1" },
    { id: "token-2", spaceId: "space-0", owner: "player-2" },
  ]);
  const [currentPlayer, setCurrentPlayer] = useState<string>("player-1");
  const [lastRoll, setLastRoll] = useState<number | null>(null);

  const rollDice = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    setLastRoll(roll);

    setPieces((prev) =>
      prev.map((p) => {
        if (p.owner !== currentPlayer) return p;

        const currentSpace = snakesTrack.find((s) => s.id === p.spaceId);
        if (!currentSpace) return p;

        const newIndex = Math.min(currentSpace.index + roll, 99);
        let newSpaceId = `space-${newIndex}`;

        // Check for snake/ladder
        const newSpace = snakesTrack.find((s) => s.id === newSpaceId);
        if (newSpace?.jumpTo) {
          newSpaceId = newSpace.jumpTo;
        }

        return { ...p, spaceId: newSpaceId };
      }),
    );

    setCurrentPlayer(currentPlayer === "player-1" ? "player-2" : "player-1");
  };

  return (
    <Container title="Snakes & Ladders (Click to roll)">
      <TrackBoard
        spaces={snakesTrack}
        pieces={pieces}
        type="linear"
        width={560}
        height={560}
        renderSpace={(space, spacePieces) => (
          <DefaultTrackSpace space={space} size={50}>
            {spacePieces.map((piece, i) => (
              <DefaultTrackPiece
                key={piece.id}
                piece={piece}
                index={i}
                total={spacePieces.length}
                color={playerColors[piece.owner]}
              />
            ))}
          </DefaultTrackSpace>
        )}
        renderJump={(from, to, _fromSpace, _toSpace, isUp) => (
          <DefaultTrackJump from={from} to={to} isUp={isUp} spaceSize={50} />
        )}
      />
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            Player 1 {currentPlayer === "player-1" && "← Turn"}
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            Player 2 {currentPlayer === "player-2" && "← Turn"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {lastRoll && (
            <span className="text-white">
              Last roll: <strong>{lastRoll}</strong>
            </span>
          )}
          <button
            onClick={rollDice}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
          >
            🎲 Roll Dice
          </button>
        </div>
      </div>
    </Container>
  );
}

// Simple linear track
function LinearTrackDemo() {
  const linearSpaces: TrackSpace[] = Array(15)
    .fill(null)
    .map((_, i) => ({
      id: `space-${i}`,
      index: i,
      name: i === 0 ? "Start" : i === 14 ? "Finish" : undefined,
      position: { x: 50 + i * 50, y: 100 },
      type: i === 0 ? "start" : i === 14 ? "finish" : undefined,
    }));

  const pieces: TrackPiece[] = [
    { id: "p1", spaceId: "space-3", owner: "player-1" },
    { id: "p2", spaceId: "space-7", owner: "player-2" },
    { id: "p3", spaceId: "space-7", owner: "player-3" },
  ];

  return (
    <Container title="Simple Linear Track">
      <TrackBoard
        spaces={linearSpaces}
        pieces={pieces}
        type="linear"
        width={800}
        height={200}
        renderSpace={(space, spacePieces) => (
          <DefaultTrackSpace space={space} size={40}>
            {spacePieces.map((piece, i) => (
              <DefaultTrackPiece
                key={piece.id}
                piece={piece}
                index={i}
                total={spacePieces.length}
                color={playerColors[piece.owner]}
              />
            ))}
          </DefaultTrackSpace>
        )}
        renderConnection={(from, to) => (
          <DefaultTrackConnection from={from} to={to} />
        )}
      />
    </Container>
  );
}

// Branching track demo
function BranchingTrackDemo() {
  const branchingSpaces: TrackSpace[] = [
    { id: "start", index: 0, name: "Start", position: { x: 100, y: 200 } },
    { id: "s1", index: 1, position: { x: 180, y: 200 } },
    {
      id: "s2",
      index: 2,
      position: { x: 260, y: 200 },
      nextSpaces: ["s3a", "s3b"],
    },
    // Branch A (top)
    {
      id: "s3a",
      index: 3,
      name: "A",
      position: { x: 340, y: 120 },
      nextSpaces: ["s4a"],
    },
    { id: "s4a", index: 4, position: { x: 420, y: 120 }, nextSpaces: ["s5"] },
    // Branch B (bottom)
    {
      id: "s3b",
      index: 5,
      name: "B",
      position: { x: 340, y: 280 },
      nextSpaces: ["s4b"],
    },
    { id: "s4b", index: 6, position: { x: 420, y: 280 }, nextSpaces: ["s5"] },
    // Merge
    {
      id: "s5",
      index: 7,
      position: { x: 500, y: 200 },
      nextSpaces: ["finish"],
    },
    { id: "finish", index: 8, name: "Finish", position: { x: 580, y: 200 } },
  ];

  const pieces: TrackPiece[] = [
    { id: "p1", spaceId: "s3a", owner: "player-1" },
    { id: "p2", spaceId: "s3b", owner: "player-2" },
  ];

  return (
    <Container title="Branching Track">
      <TrackBoard
        spaces={branchingSpaces}
        pieces={pieces}
        type="branching"
        width={700}
        height={400}
        renderSpace={(space, spacePieces) => (
          <DefaultTrackSpace space={space} size={spaceSize}>
            {spacePieces.map((piece, i) => (
              <DefaultTrackPiece
                key={piece.id}
                piece={piece}
                index={i}
                total={spacePieces.length}
                color={playerColors[piece.owner]}
              />
            ))}
          </DefaultTrackSpace>
        )}
        renderConnection={(from, to) => (
          <DefaultTrackConnection from={from} to={to} />
        )}
      />
      <div className="mt-4 text-sm text-slate-400">
        Track splits at space 2 and merges again at space 5
      </div>
    </Container>
  );
}

// Responsive Monopoly with pan & zoom
function ResponsiveMonopolyDemo() {
  const pieces: TrackPiece[] = [
    { id: "token-1", spaceId: "space-0", owner: "player-1", type: "car" },
    { id: "token-2", spaceId: "space-10", owner: "player-2", type: "hat" },
    { id: "token-3", spaceId: "space-20", owner: "player-3", type: "dog" },
    { id: "token-4", spaceId: "space-30", owner: "player-4", type: "shoe" },
  ];

  return (
    <Container title="Responsive Monopoly Board (Mobile-Friendly)">
      <p className="text-slate-400 text-sm mb-4">
        Drag to pan, pinch/scroll to zoom. Perfect for mobile devices!
      </p>
      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <TrackBoard
          spaces={monopolyTrack}
          pieces={pieces}
          type="circular"
          width="100%"
          height={500}
          enablePanZoom={true}
          initialZoom={0.9}
          minZoom={0.5}
          maxZoom={2}
          renderSpace={(space, spacePieces) => (
            <DefaultTrackSpace space={space} size={spaceSize}>
              {spacePieces.map((piece, i) => (
                <DefaultTrackPiece
                  key={piece.id}
                  piece={piece}
                  index={i}
                  total={spacePieces.length}
                  color={playerColors[piece.owner]}
                />
              ))}
            </DefaultTrackSpace>
          )}
        />
      </div>
      <div className="mt-4 flex gap-4 text-sm">
        {["player-1", "player-2", "player-3", "player-4"].map((p) => (
          <span key={p} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: playerColors[p],
              }}
            />
            {p.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        ))}
      </div>
    </Container>
  );
}

// Full width responsive layout
function FullWidthDemo() {
  const pieces: TrackPiece[] = [
    { id: "p1", spaceId: "space-5", owner: "player-1" },
    { id: "p2", spaceId: "space-18", owner: "player-2" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-4">
      <h2 className="text-xl font-bold text-white mb-4">
        Full Width Track Board
      </h2>
      <p className="text-slate-400 text-sm mb-4">
        Responsive container that scales with viewport width.
      </p>
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <TrackBoard
          spaces={monopolyTrack}
          pieces={pieces}
          type="circular"
          width="100%"
          height={500}
          enablePanZoom={true}
          renderSpace={(space, spacePieces) => (
            <DefaultTrackSpace space={space} size={spaceSize}>
              {spacePieces.map((piece, i) => (
                <DefaultTrackPiece
                  key={piece.id}
                  piece={piece}
                  index={i}
                  total={spacePieces.length}
                  color={playerColors[piece.owner]}
                />
              ))}
            </DefaultTrackSpace>
          )}
        />
      </div>
    </div>
  );
}

// Snakes & Ladders with pan/zoom (great for mobile)
function ResponsiveSnakesDemo() {
  const pieces: TrackPiece[] = [
    { id: "token-1", spaceId: "space-12", owner: "player-1" },
    { id: "token-2", spaceId: "space-45", owner: "player-2" },
    { id: "token-3", spaceId: "space-67", owner: "player-3" },
  ];

  return (
    <Container title="Snakes & Ladders - Pan & Zoom">
      <p className="text-slate-400 text-sm mb-4">
        100-space board with pan & zoom. Zoom in to see details!
      </p>
      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <TrackBoard
          spaces={snakesTrack}
          pieces={pieces}
          type="linear"
          width="100%"
          height={450}
          enablePanZoom={true}
          initialZoom={0.7}
          minZoom={0.4}
          maxZoom={2}
          renderSpace={(space, spacePieces) => (
            <DefaultTrackSpace space={space} size={50}>
              {spacePieces.map((piece, i) => (
                <DefaultTrackPiece
                  key={piece.id}
                  piece={piece}
                  index={i}
                  total={spacePieces.length}
                  color={playerColors[piece.owner]}
                />
              ))}
            </DefaultTrackSpace>
          )}
          renderJump={(from, to, _fromSpace, _toSpace, isUp) => (
            <DefaultTrackJump from={from} to={to} isUp={isUp} spaceSize={50} />
          )}
        />
      </div>
      <div className="mt-4 text-slate-400 text-sm">
        Green arrows = ladders (go up), Red arrows = snakes (go down)
      </div>
    </Container>
  );
}

// Custom styled track demo
function CustomStyledDemo() {
  const linearSpaces: TrackSpace[] = Array(10)
    .fill(null)
    .map((_, i) => ({
      id: `space-${i}`,
      index: i,
      name: i === 0 ? "🏁" : i === 9 ? "🏆" : undefined,
      position: { x: 60 + i * 70, y: 100 },
      type: i === 0 ? "start" : i === 9 ? "finish" : "normal",
    }));

  const pieces: TrackPiece[] = [
    { id: "p1", spaceId: "space-2", owner: "player-1" },
    { id: "p2", spaceId: "space-5", owner: "player-2" },
  ];

  return (
    <Container title="Custom Styled Track">
      <TrackBoard
        spaces={linearSpaces}
        pieces={pieces}
        type="linear"
        width={800}
        height={200}
        renderSpace={(space, spacePieces) => (
          <DefaultTrackSpace
            space={space}
            size={50}
            fill={
              space.type === "start"
                ? "#166534"
                : space.type === "finish"
                  ? "#9f1239"
                  : "#1e40af"
            }
            stroke={
              space.type === "start"
                ? "#22c55e"
                : space.type === "finish"
                  ? "#f43f5e"
                  : "#3b82f6"
            }
            strokeWidth={2}
          >
            {spacePieces.map((piece, i) => (
              <DefaultTrackPiece
                key={piece.id}
                piece={piece}
                index={i}
                total={spacePieces.length}
                color={playerColors[piece.owner]}
                radius={10}
              />
            ))}
          </DefaultTrackSpace>
        )}
        renderConnection={(from, to) => (
          <DefaultTrackConnection
            from={from}
            to={to}
            stroke="#60a5fa"
            strokeWidth={3}
          />
        )}
      />
    </Container>
  );
}

export default {
  monopoly: <MonopolyDemo />,
  snakesLadders: <SnakesLaddersDemo />,
  linear: <LinearTrackDemo />,
  branching: <BranchingTrackDemo />,
  responsive: <ResponsiveMonopolyDemo />,
  fullWidth: <FullWidthDemo />,
  responsiveSnakes: <ResponsiveSnakesDemo />,
  customStyled: <CustomStyledDemo />,

  default: (
    <Container title="Basic Track Board">
      <TrackBoard
        spaces={monopolyTrack}
        pieces={[
          { id: "p1", spaceId: "space-0", owner: "player-1" },
          { id: "p2", spaceId: "space-15", owner: "player-2" },
        ]}
        type="circular"
        width={560}
        height={560}
        renderSpace={(space, spacePieces) => (
          <DefaultTrackSpace space={space} size={spaceSize}>
            {spacePieces.map((piece, i) => (
              <DefaultTrackPiece
                key={piece.id}
                piece={piece}
                index={i}
                total={spacePieces.length}
                color={playerColors[piece.owner]}
              />
            ))}
          </DefaultTrackSpace>
        )}
      />
    </Container>
  ),
};
