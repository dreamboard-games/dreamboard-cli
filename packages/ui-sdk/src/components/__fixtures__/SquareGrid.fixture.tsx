/**
 * React Cosmos fixtures for SquareGrid component
 *
 * Demonstrates various square grid configurations:
 * - Chess board with pieces
 * - Checkers game
 * - Go board (9x9)
 * - Tactical game with highlighting
 * - Drag and drop support
 */

import { useState, useCallback } from "react";
import {
  SquareGrid,
  DefaultGridCell,
  DefaultGridPiece,
  DefaultChessPiece,
  type GridCell,
  type GridPiece,
  type SquareGridEdge,
  type SquareGridVertex,
} from "../board/SquareGrid.js";

// ============================================================================
// Sample Chess Data
// ============================================================================

const initialChessPieces: GridPiece[] = [
  // White pieces
  { id: "wr1", row: 7, col: 0, type: "rook", owner: "white" },
  { id: "wn1", row: 7, col: 1, type: "knight", owner: "white" },
  { id: "wb1", row: 7, col: 2, type: "bishop", owner: "white" },
  { id: "wq", row: 7, col: 3, type: "queen", owner: "white" },
  { id: "wk", row: 7, col: 4, type: "king", owner: "white" },
  { id: "wb2", row: 7, col: 5, type: "bishop", owner: "white" },
  { id: "wn2", row: 7, col: 6, type: "knight", owner: "white" },
  { id: "wr2", row: 7, col: 7, type: "rook", owner: "white" },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `wp${i}`,
    row: 6,
    col: i,
    type: "pawn",
    owner: "white",
  })),
  // Black pieces
  { id: "br1", row: 0, col: 0, type: "rook", owner: "black" },
  { id: "bn1", row: 0, col: 1, type: "knight", owner: "black" },
  { id: "bb1", row: 0, col: 2, type: "bishop", owner: "black" },
  { id: "bq", row: 0, col: 3, type: "queen", owner: "black" },
  { id: "bk", row: 0, col: 4, type: "king", owner: "black" },
  { id: "bb2", row: 0, col: 5, type: "bishop", owner: "black" },
  { id: "bn2", row: 0, col: 6, type: "knight", owner: "black" },
  { id: "br2", row: 0, col: 7, type: "rook", owner: "black" },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `bp${i}`,
    row: 1,
    col: i,
    type: "pawn",
    owner: "black",
  })),
];

// ============================================================================
// Sample Checkers Data
// ============================================================================

const initialCheckersPieces: GridPiece[] = [
  // Red pieces (top)
  ...Array.from({ length: 12 }, (_, i) => {
    const row = Math.floor(i / 4);
    const col = (i % 4) * 2 + (row % 2 === 0 ? 1 : 0);
    return {
      id: `red-${i}`,
      row,
      col,
      type: "checker",
      owner: "red",
    };
  }),
  // Black pieces (bottom)
  ...Array.from({ length: 12 }, (_, i) => {
    const row = 5 + Math.floor(i / 4);
    const col = (i % 4) * 2 + (row % 2 === 0 ? 1 : 0);
    return {
      id: `black-${i}`,
      row,
      col,
      type: "checker",
      owner: "black",
    };
  }),
];

const topologyCells: GridCell[] = Array.from({ length: 3 }, (_, row) =>
  Array.from({ length: 3 }, (_, col) => ({
    id: `cell-${row}-${col}`,
    row,
    col,
    label: `${row},${col}`,
  })),
).flat();

const topologyEdges: SquareGridEdge[] = [
  { id: "edge-north", spaceIds: ["cell-0-1", "cell-1-1"], type: "corridor" },
  { id: "edge-east", spaceIds: ["cell-1-1", "cell-1-2"], type: "corridor" },
  { id: "edge-south", spaceIds: ["cell-1-1", "cell-2-1"], type: "corridor" },
  { id: "edge-west", spaceIds: ["cell-1-0", "cell-1-1"], type: "corridor" },
];

const topologyVertices: SquareGridVertex[] = [
  {
    id: "vertex-center",
    spaceIds: ["cell-0-0", "cell-0-1", "cell-1-0", "cell-1-1"],
    type: "junction",
  },
  {
    id: "vertex-east",
    spaceIds: ["cell-0-1", "cell-0-2", "cell-1-1", "cell-1-2"],
    type: "junction",
  },
];

// ============================================================================
// Fixtures
// ============================================================================

export default {
  /**
   * Chess Board
   * Classic 8x8 chess board with starting position
   */
  "Chess Board": () => {
    const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
    const [pieces, setPieces] = useState(initialChessPieces);

    const selectedPieceData = pieces.find((p) => p.id === selectedPiece);

    // Calculate valid moves (simplified - just shows forward for pawns)
    const validMoves = new Set<string>();
    if (selectedPieceData?.type === "pawn") {
      const dir = selectedPieceData.owner === "white" ? -1 : 1;
      validMoves.add(`${selectedPieceData.row + dir}-${selectedPieceData.col}`);
      if (
        (selectedPieceData.owner === "white" && selectedPieceData.row === 6) ||
        (selectedPieceData.owner === "black" && selectedPieceData.row === 1)
      ) {
        validMoves.add(
          `${selectedPieceData.row + dir * 2}-${selectedPieceData.col}`,
        );
      }
    }

    const handleCellClick = (row: number, col: number) => {
      if (selectedPiece && validMoves.has(`${row}-${col}`)) {
        setPieces((prev) =>
          prev.map((p) => (p.id === selectedPiece ? { ...p, row, col } : p)),
        );
        setSelectedPiece(null);
      }
    };

    const handlePieceClick = (pieceId: string) => {
      setSelectedPiece(pieceId === selectedPiece ? null : pieceId);
    };

    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">Chess Board</h2>
        <p className="text-slate-400 mb-4">
          Click pieces to select. Shows valid moves for pawns.
        </p>

        <SquareGrid
          rows={8}
          cols={8}
          pieces={pieces}
          cellSize={70}
          showCoordinates={true}
          coordinateStyle="algebraic"
          renderCell={(row, col) => (
            <DefaultGridCell
              size={70}
              isLight={(row + col) % 2 === 0}
              lightColor="#f0d9b5"
              darkColor="#b58863"
              isSelected={
                selectedPieceData?.row === row && selectedPieceData?.col === col
              }
              isValidMove={
                validMoves.has(`${row}-${col}`) &&
                !pieces.some((p) => p.row === row && p.col === col)
              }
              isCapture={
                validMoves.has(`${row}-${col}`) &&
                pieces.some((p) => p.row === row && p.col === col)
              }
              onClick={() => handleCellClick(row, col)}
            />
          )}
          renderPiece={(piece) => (
            <DefaultChessPiece
              size={70}
              type={piece.type}
              owner={piece.owner as "white" | "black"}
              onClick={() => handlePieceClick(piece.id)}
            />
          )}
        />
      </div>
    );
  },

  /**
   * Checkers Board
   * 8x8 checkers with red and black pieces
   */
  "Checkers Board": () => {
    const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">Checkers Board</h2>
        <p className="text-slate-400 mb-4">Click pieces to select</p>

        <SquareGrid
          rows={8}
          cols={8}
          pieces={initialCheckersPieces}
          cellSize={65}
          showCoordinates={false}
          renderCell={(row, col) => (
            <DefaultGridCell
              size={65}
              isLight={(row + col) % 2 === 0}
              lightColor="#deb887"
              darkColor="#8b4513"
            />
          )}
          renderPiece={(piece) => (
            <g onClick={() => setSelectedPiece(piece.id)}>
              <circle
                r={25}
                fill={piece.owner === "red" ? "#dc2626" : "#1e293b"}
                stroke={piece.owner === "red" ? "#b91c1c" : "#0f172a"}
                strokeWidth={3}
                className="cursor-pointer"
              />
              <circle
                r={18}
                fill="none"
                stroke={piece.owner === "red" ? "#ef4444" : "#334155"}
                strokeWidth={2}
              />
              {piece.id === selectedPiece && (
                <circle r={28} fill="none" stroke="#fbbf24" strokeWidth={3} />
              )}
            </g>
          )}
        />
      </div>
    );
  },

  /**
   * Go Board (9x9)
   * Smaller Go board for learning
   */
  "Go Board (9x9)": () => {
    const [pieces, setPieces] = useState<GridPiece[]>([
      { id: "b1", row: 2, col: 2, type: "stone", owner: "black" },
      { id: "w1", row: 2, col: 6, type: "stone", owner: "white" },
      { id: "b2", row: 6, col: 2, type: "stone", owner: "black" },
      { id: "w2", row: 6, col: 6, type: "stone", owner: "white" },
      { id: "b3", row: 4, col: 4, type: "stone", owner: "black" },
    ]);
    const [currentPlayer, setCurrentPlayer] = useState<"black" | "white">(
      "white",
    );

    const handleCellClick = useCallback(
      (row: number, col: number) => {
        // Check if cell is occupied
        if (pieces.some((p) => p.row === row && p.col === col)) return;

        const newPiece: GridPiece = {
          id: `${currentPlayer}-${Date.now()}`,
          row,
          col,
          type: "stone",
          owner: currentPlayer,
        };

        setPieces((prev) => [...prev, newPiece]);
        setCurrentPlayer((prev) => (prev === "black" ? "white" : "black"));
      },
      [pieces, currentPlayer],
    );

    const cellSize = 55;
    const starPoints = new Set(["2-2", "2-6", "6-2", "6-6", "4-4"]);

    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">Go Board (9x9)</h2>
        <p className="text-slate-400 mb-4">
          Current player:{" "}
          <span
            className={
              currentPlayer === "black" ? "text-slate-300" : "text-amber-200"
            }
          >
            {currentPlayer}
          </span>
          . Click to place a stone.
        </p>

        <SquareGrid
          rows={9}
          cols={9}
          pieces={pieces}
          cellSize={cellSize}
          showCoordinates={true}
          coordinateStyle="numeric"
          renderCell={(row, col) => (
            <g
              onClick={() => handleCellClick(row, col)}
              className="cursor-pointer"
            >
              <rect width={cellSize} height={cellSize} fill="#dcb35c" />
              {/* Grid lines */}
              <line
                x1={cellSize / 2}
                y1={row === 0 ? cellSize / 2 : 0}
                x2={cellSize / 2}
                y2={row === 8 ? cellSize / 2 : cellSize}
                stroke="#8b6914"
                strokeWidth={1}
              />
              <line
                x1={col === 0 ? cellSize / 2 : 0}
                y1={cellSize / 2}
                x2={col === 8 ? cellSize / 2 : cellSize}
                y2={cellSize / 2}
                stroke="#8b6914"
                strokeWidth={1}
              />
              {/* Star points */}
              {starPoints.has(`${row}-${col}`) && (
                <circle
                  cx={cellSize / 2}
                  cy={cellSize / 2}
                  r={4}
                  fill="#8b6914"
                />
              )}
            </g>
          )}
          renderPiece={(piece) => (
            <circle
              r={22}
              fill={piece.owner === "black" ? "#1e293b" : "#f8fafc"}
              stroke={piece.owner === "black" ? "#0f172a" : "#cbd5e1"}
              strokeWidth={2}
              style={{ filter: "drop-shadow(2px 2px 2px rgba(0,0,0,0.4))" }}
            />
          )}
        />
      </div>
    );
  },

  /**
   * Tactical Game with Highlighting
   * Shows movement ranges and attack indicators
   */
  "Tactical Game": () => {
    const [selectedUnit, setSelectedUnit] = useState<string | null>("unit-1");

    const units: GridPiece[] = [
      { id: "unit-1", row: 3, col: 3, type: "warrior", owner: "player1" },
      { id: "unit-2", row: 5, col: 5, type: "archer", owner: "player1" },
      { id: "enemy-1", row: 2, col: 4, type: "warrior", owner: "enemy" },
      { id: "enemy-2", row: 4, col: 6, type: "archer", owner: "enemy" },
    ];

    const selectedUnitData = units.find((u) => u.id === selectedUnit);

    // Calculate movement range
    const validMoves = new Set<string>();
    const captureMoves = new Set<string>();

    if (selectedUnitData) {
      const range = selectedUnitData.type === "warrior" ? 2 : 3;
      for (let dr = -range; dr <= range; dr++) {
        for (let dc = -range; dc <= range; dc++) {
          if (Math.abs(dr) + Math.abs(dc) <= range && (dr !== 0 || dc !== 0)) {
            const newRow = selectedUnitData.row + dr;
            const newCol = selectedUnitData.col + dc;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
              const enemy = units.find(
                (u) =>
                  u.row === newRow &&
                  u.col === newCol &&
                  u.owner !== selectedUnitData.owner,
              );
              if (enemy) {
                captureMoves.add(`${newRow}-${newCol}`);
              } else if (
                !units.some((u) => u.row === newRow && u.col === newCol)
              ) {
                validMoves.add(`${newRow}-${newCol}`);
              }
            }
          }
        }
      }
    }

    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">Tactical Game</h2>
        <p className="text-slate-400 mb-4">
          Click friendly units to see movement range. Green = move, Red = attack
        </p>

        <SquareGrid
          rows={8}
          cols={8}
          pieces={units}
          cellSize={65}
          showCoordinates={false}
          renderCell={(row, col) => (
            <DefaultGridCell
              size={65}
              isLight={(row + col) % 2 === 0}
              lightColor="#4a5568"
              darkColor="#2d3748"
              isSelected={
                selectedUnitData?.row === row && selectedUnitData?.col === col
              }
              isValidMove={validMoves.has(`${row}-${col}`)}
              isCapture={captureMoves.has(`${row}-${col}`)}
            />
          )}
          renderPiece={(piece) => {
            const isSelected = piece.id === selectedUnit;
            return (
              <g
                onClick={() => {
                  if (piece.owner === "player1") setSelectedUnit(piece.id);
                }}
                className={piece.owner === "player1" ? "cursor-pointer" : ""}
              >
                <circle
                  r={isSelected ? 26 : 24}
                  fill={piece.owner === "player1" ? "#3b82f6" : "#ef4444"}
                  stroke={isSelected ? "#fbbf24" : "#1e293b"}
                  strokeWidth={isSelected ? 3 : 2}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={20}
                >
                  {piece.type === "warrior" ? "⚔️" : "🏹"}
                </text>
              </g>
            );
          }}
        />
      </div>
    );
  },

  /**
   * Drag and Drop (Click-to-Move)
   * Interactive movement for pieces
   */
  "Click to Move": () => {
    const [pieces, setPieces] = useState<GridPiece[]>([
      { id: "p1", row: 0, col: 0, type: "token", owner: "blue" },
      { id: "p2", row: 0, col: 1, type: "token", owner: "red" },
      { id: "p3", row: 0, col: 2, type: "token", owner: "green" },
    ]);
    const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

    const playerColors: Record<string, string> = {
      blue: "#3b82f6",
      red: "#ef4444",
      green: "#22c55e",
    };

    const handleCellClick = (row: number, col: number) => {
      if (selectedPiece) {
        // Check if cell is occupied by another piece
        if (
          pieces.some(
            (p) => p.row === row && p.col === col && p.id !== selectedPiece,
          )
        ) {
          return;
        }
        setPieces((prev) =>
          prev.map((p) => (p.id === selectedPiece ? { ...p, row, col } : p)),
        );
        setSelectedPiece(null);
      }
    };

    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">Click to Move</h2>
        <p className="text-slate-400 mb-4">
          Click a piece to select, then click a cell to move
        </p>

        <SquareGrid
          rows={6}
          cols={6}
          pieces={pieces}
          cellSize={80}
          showCoordinates={false}
          renderCell={(row, col) => (
            <DefaultGridCell
              size={80}
              isLight={(row + col) % 2 === 0}
              lightColor="#e2e8f0"
              darkColor="#94a3b8"
              onClick={() => handleCellClick(row, col)}
            />
          )}
          renderPiece={(piece) => (
            <DefaultGridPiece
              size={80}
              color={playerColors[piece.owner ?? "blue"]}
              label={piece.id.replace("p", "")}
              onClick={() =>
                setSelectedPiece(piece.id === selectedPiece ? null : piece.id)
              }
              className={
                selectedPiece === piece.id ? "ring-4 ring-yellow-400" : ""
              }
            />
          )}
        />
      </div>
    );
  },

  /**
   * Large Grid with Pan & Zoom
   * 16x16 grid demonstrating pan and zoom
   */
  "Large Grid (Pan & Zoom)": () => {
    const pieces: GridPiece[] = Array.from({ length: 20 }, (_, i) => ({
      id: `piece-${i}`,
      row: Math.floor(Math.random() * 16),
      col: Math.floor(Math.random() * 16),
      type: "marker",
      owner: i % 2 === 0 ? "player1" : "player2",
    }));

    const playerColors: Record<string, string> = {
      player1: "#f59e0b",
      player2: "#8b5cf6",
    };

    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">
          Large Grid (16x16)
        </h2>
        <p className="text-slate-400 mb-4">Drag to pan, scroll/pinch to zoom</p>

        <SquareGrid
          rows={16}
          cols={16}
          pieces={pieces}
          cellSize={40}
          showCoordinates={true}
          coordinateStyle="numeric"
          width={600}
          height={500}
          enablePanZoom={true}
          initialZoom={0.7}
          minZoom={0.3}
          maxZoom={2}
          renderCell={(row, col) => (
            <DefaultGridCell
              size={40}
              isLight={(row + col) % 2 === 0}
              lightColor="#475569"
              darkColor="#334155"
            />
          )}
          renderPiece={(piece) => (
            <DefaultGridPiece
              size={40}
              color={playerColors[piece.owner ?? "player1"]}
              label={piece.type.charAt(0).toUpperCase()}
            />
          )}
        />
      </div>
    );
  },

  /**
   * Responsive Layout
   * Grid that scales with container
   */
  "Responsive Layout": () => (
    <div className="p-6 bg-slate-900 min-h-screen">
      <h2 className="text-xl font-bold text-white mb-4">Responsive Grid</h2>
      <p className="text-slate-400 mb-4">Grid scales with container width</p>

      <div className="w-full max-w-xl mx-auto bg-slate-800 p-4 rounded-lg">
        <SquareGrid
          rows={8}
          cols={8}
          pieces={[]}
          cellSize={60}
          showCoordinates={true}
          width="100%"
          height={520}
          renderCell={(row, col) => (
            <DefaultGridCell
              size={60}
              isLight={(row + col) % 2 === 0}
              lightColor="#f0d9b5"
              darkColor="#b58863"
            />
          )}
          renderPiece={() => null}
        />
      </div>
    </div>
  ),

  /**
   * Tiled Topology Overlays
   * Demonstrates the shared edge and vertex interaction pattern used by tiled boards.
   */
  "Tiled Topology Overlays": () => {
    const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
    const [hoveredVertexId, setHoveredVertexId] = useState<string | null>(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [selectedVertexId, setSelectedVertexId] = useState<string | null>(
      null,
    );

    const highlightedCellIds = new Set<string>();
    topologyEdges
      .find((edge) => edge.id === hoveredEdgeId || edge.id === selectedEdgeId)
      ?.spaceIds.forEach((spaceId) => highlightedCellIds.add(spaceId));
    topologyVertices
      .find(
        (vertex) =>
          vertex.id === hoveredVertexId || vertex.id === selectedVertexId,
      )
      ?.spaceIds.forEach((spaceId) => highlightedCellIds.add(spaceId));

    return (
      <div className="p-6 bg-slate-950 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">
          Tiled Topology Overlays
        </h2>
        <p className="text-slate-400 mb-4 max-w-2xl">
          Reducer views can project cells, edges, and vertices separately while
          the UI uses the same edge and vertex interaction pattern as HexGrid.
        </p>

        <SquareGrid
          rows={3}
          cols={3}
          cells={topologyCells}
          pieces={[]}
          edges={topologyEdges}
          vertices={topologyVertices}
          cellSize={92}
          showCoordinates={false}
          interactiveEdges={true}
          interactiveVertices={true}
          onInteractiveEdgeEnter={(edge) => setHoveredEdgeId(edge.id)}
          onInteractiveEdgeLeave={() => setHoveredEdgeId(null)}
          onInteractiveEdgeClick={(edge) =>
            setSelectedEdgeId((current) =>
              current === edge.id ? null : edge.id,
            )
          }
          onInteractiveVertexEnter={(vertex) => setHoveredVertexId(vertex.id)}
          onInteractiveVertexLeave={() => setHoveredVertexId(null)}
          onInteractiveVertexClick={(vertex) =>
            setSelectedVertexId((current) =>
              current === vertex.id ? null : vertex.id,
            )
          }
          renderCell={(row, col) => {
            const cellId = `cell-${row}-${col}`;
            return (
              <DefaultGridCell
                size={92}
                isLight={(row + col) % 2 === 0}
                lightColor="#e2e8f0"
                darkColor="#cbd5e1"
                isHighlighted={highlightedCellIds.has(cellId)}
                highlightColor="rgba(14, 165, 233, 0.24)"
              />
            );
          }}
          renderPiece={() => null}
          renderEdge={(edge, position) => {
            const isActive =
              edge.id === hoveredEdgeId || edge.id === selectedEdgeId;
            return (
              <line
                x1={position.x1}
                y1={position.y1}
                x2={position.x2}
                y2={position.y2}
                stroke={isActive ? "#0f172a" : "#64748b"}
                strokeWidth={isActive ? 8 : 4}
                strokeLinecap="round"
                className="transition-all duration-150"
              />
            );
          }}
          renderVertex={(vertex, position) => {
            const isActive =
              vertex.id === hoveredVertexId || vertex.id === selectedVertexId;
            return (
              <circle
                cx={position.x}
                cy={position.y}
                r={isActive ? 11 : 7}
                fill={isActive ? "#f97316" : "#fb923c"}
                stroke="#fff7ed"
                strokeWidth={isActive ? 3 : 2}
                className="transition-all duration-150"
              />
            );
          }}
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-slate-200">
            Edge target: {selectedEdgeId ?? hoveredEdgeId ?? "none"}
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-slate-200">
            Vertex target: {selectedVertexId ?? hoveredVertexId ?? "none"}
          </div>
        </div>
      </div>
    );
  },
};
