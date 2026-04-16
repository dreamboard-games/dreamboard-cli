/**
 * React Cosmos fixtures for HexGrid component
 *
 * Demonstrates various hex grid configurations:
 * - Basic hex grid with different tile types
 * - Catan-style board with edges and vertices
 * - Interactive highlighting and selection
 * - Pan and zoom functionality
 * - Using pre-built helper components
 */

import { useState } from "react";
import {
  HexGrid,
  DefaultHexTile,
  DefaultHexEdge,
  DefaultHexVertex,
  DefaultInteractiveVertex,
  DefaultInteractiveEdge,
  type HexTile,
  type HexEdge,
  type HexVertex,
  type InteractiveVertex,
  type InteractiveEdge,
} from "../board/HexGrid";

// ============================================================================
// Sample Data
// ============================================================================

// Basic hex tiles in a standard Catan-like pattern
const catanTiles: HexTile[] = [
  // Center
  { id: "center", q: 0, r: 0, type: "desert", label: "7" },
  // Ring 1
  { id: "tile-1", q: 1, r: -1, type: "hills", label: "6" },
  { id: "tile-2", q: 1, r: 0, type: "forest", label: "3" },
  { id: "tile-3", q: 0, r: 1, type: "fields", label: "8" },
  { id: "tile-4", q: -1, r: 1, type: "pasture", label: "5" },
  { id: "tile-5", q: -1, r: 0, type: "mountains", label: "10" },
  { id: "tile-6", q: 0, r: -1, type: "forest", label: "9" },
  // Ring 2
  { id: "tile-7", q: 2, r: -2, type: "fields", label: "4" },
  { id: "tile-8", q: 2, r: -1, type: "pasture", label: "11" },
  { id: "tile-9", q: 2, r: 0, type: "hills", label: "12" },
  { id: "tile-10", q: 1, r: 1, type: "forest", label: "2" },
  { id: "tile-11", q: 0, r: 2, type: "mountains", label: "6" },
  { id: "tile-12", q: -1, r: 2, type: "fields", label: "8" },
  { id: "tile-13", q: -2, r: 2, type: "pasture", label: "4" },
  { id: "tile-14", q: -2, r: 1, type: "hills", label: "3" },
  { id: "tile-15", q: -2, r: 0, type: "forest", label: "10" },
  { id: "tile-16", q: -1, r: -1, type: "fields", label: "5" },
  { id: "tile-17", q: 0, r: -2, type: "pasture", label: "9" },
  { id: "tile-18", q: 1, r: -2, type: "mountains", label: "11" },
];

// Sample edges (roads)
const sampleEdges: HexEdge[] = [
  { id: "road-1", hex1: "center", hex2: "tile-1", owner: "player1" },
  { id: "road-2", hex1: "tile-1", hex2: "tile-7", owner: "player1" },
  { id: "road-3", hex1: "center", hex2: "tile-4", owner: "player2" },
  { id: "road-4", hex1: "tile-4", hex2: "tile-13", owner: "player2" },
  { id: "road-5", hex1: "center", hex2: "tile-2" },
  { id: "road-6", hex1: "center", hex2: "tile-3" },
];

// Sample vertices (settlements)
const sampleVertices: HexVertex[] = [
  {
    id: "settle-1",
    hexes: ["center", "tile-1", "tile-6"] as const,
    owner: "player1",
    type: "settlement",
  },
  {
    id: "settle-2",
    hexes: ["tile-1", "tile-7", "tile-8"] as const,
    owner: "player1",
    type: "city",
  },
  {
    id: "settle-3",
    hexes: ["center", "tile-4", "tile-5"] as const,
    owner: "player2",
    type: "settlement",
  },
  {
    id: "settle-4",
    hexes: ["tile-4", "tile-13", "tile-14"] as const,
    owner: "player2",
    type: "settlement",
  },
];

// Wargame hex grid (larger)
const wargameTiles: HexTile[] = [];
const wargameTypes = ["plains", "forest", "hills", "mountains", "water"];
for (let q = -4; q <= 4; q++) {
  for (let r = -4; r <= 4; r++) {
    if (Math.abs(q + r) <= 4) {
      const type = wargameTypes[(q + r + 8) % wargameTypes.length];
      wargameTiles.push({
        id: `hex-${q}-${r}`,
        q,
        r,
        type,
      });
    }
  }
}

// ============================================================================
// Color Definitions
// ============================================================================

const catanTileColors: Record<string, string> = {
  desert: "#d4a574",
  hills: "#b45309",
  forest: "#15803d",
  fields: "#ca8a04",
  pasture: "#65a30d",
  mountains: "#57534e",
  ocean: "#0369a1",
};

const wargameTileColors: Record<string, string> = {
  plains: "#84cc16",
  forest: "#15803d",
  hills: "#a16207",
  mountains: "#57534e",
  water: "#0284c7",
};

const playerColors: Record<string, string> = {
  player1: "#ef4444",
  player2: "#3b82f6",
  player3: "#22c55e",
  player4: "#f97316",
};

// ============================================================================
// Fixtures
// ============================================================================

export default {
  /**
   * Basic Catan Board
   * Standard Catan-style hex board with resource tiles using pre-built components
   */
  "Basic Catan Board": () => {
    const [selectedTile, setSelectedTile] = useState<string | null>(null);
    const [hoveredTile, setHoveredTile] = useState<string | null>(null);

    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">Catan-Style Board</h2>
        <p className="text-slate-400 mb-4">
          Click tiles to select, hover to highlight. Uses DefaultHexTile
          component.
        </p>

        <HexGrid
          tiles={catanTiles}
          edges={[]}
          vertices={[]}
          hexSize={55}
          orientation="pointy-top"
          width={700}
          height={600}
          enablePanZoom={false}
          renderTile={(tile) => (
            <DefaultHexTile
              size={55}
              fill={catanTileColors[tile.type ?? ""] ?? "#475569"}
              label={tile.label}
              isSelected={selectedTile === tile.id}
              isHighlighted={hoveredTile === tile.id}
              onClick={() => setSelectedTile(tile.id)}
              onPointerEnter={() => setHoveredTile(tile.id)}
              onPointerLeave={() => setHoveredTile(null)}
            />
          )}
          renderEdge={(edge, pos) => (
            <DefaultHexEdge
              position={pos}
              color={playerColors[edge.owner ?? ""] ?? "#94a3b8"}
              hasOwner={!!edge.owner}
            />
          )}
          renderVertex={(vertex, pos) => (
            <DefaultHexVertex
              position={pos}
              color={playerColors[vertex.owner ?? ""] ?? "#94a3b8"}
              hasOwner={!!vertex.owner}
            />
          )}
        />

        {selectedTile && (
          <div className="mt-4 p-3 bg-slate-800 rounded-lg text-white">
            Selected: {catanTiles.find((t) => t.id === selectedTile)?.type} (#
            {catanTiles.find((t) => t.id === selectedTile)?.label})
          </div>
        )}
      </div>
    );
  },

  /**
   * With Roads and Settlements
   * Full Catan experience with edges (roads) and vertices (settlements)
   */
  "With Roads and Settlements": () => {
    const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
    const [selectedVertex, setSelectedVertex] = useState<string | null>(null);

    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">
          Roads & Settlements
        </h2>
        <p className="text-slate-400 mb-4">
          Click edges (roads) or vertices (settlements). Cities shown as
          squares.
        </p>

        <HexGrid
          tiles={catanTiles}
          edges={sampleEdges}
          vertices={sampleVertices}
          hexSize={55}
          orientation="pointy-top"
          width={700}
          height={600}
          enablePanZoom={false}
          renderTile={(tile) => (
            <DefaultHexTile
              size={55}
              fill={catanTileColors[tile.type ?? ""] ?? "#475569"}
              label={tile.label}
            />
          )}
          renderEdge={(edge, pos) => (
            <DefaultHexEdge
              position={pos}
              color={playerColors[edge.owner ?? ""] ?? "#94a3b8"}
              hasOwner={!!edge.owner}
              onClick={() => setSelectedEdge(edge.id)}
            />
          )}
          renderVertex={(vertex, pos) => (
            <DefaultHexVertex
              position={pos}
              color={playerColors[vertex.owner ?? ""] ?? "#94a3b8"}
              hasOwner={!!vertex.owner}
              shape={vertex.type === "city" ? "square" : "circle"}
              onClick={() => setSelectedVertex(vertex.id)}
            />
          )}
        />

        <div className="mt-4 flex gap-4">
          {selectedEdge && (
            <div className="p-3 bg-slate-800 rounded-lg text-white">
              Edge: {selectedEdge}
            </div>
          )}
          {selectedVertex && (
            <div className="p-3 bg-slate-800 rounded-lg text-white">
              Vertex: {selectedVertex}
            </div>
          )}
        </div>
      </div>
    );
  },

  /**
   * Wargame Grid with Pan & Zoom
   * Large hex grid demonstrating pan and zoom functionality
   */
  "Wargame Grid (Pan & Zoom)": () => {
    const [selectedTile, setSelectedTile] = useState<string | null>(null);

    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">Wargame Hex Grid</h2>
        <p className="text-slate-400 mb-4">
          Drag to pan, scroll/pinch to zoom. Click tiles to select.
        </p>

        <HexGrid
          tiles={wargameTiles}
          edges={[]}
          vertices={[]}
          hexSize={40}
          orientation="flat-top"
          width={800}
          height={500}
          enablePanZoom={true}
          initialZoom={0.8}
          minZoom={0.4}
          maxZoom={2}
          renderTile={(tile) => (
            <DefaultHexTile
              size={40}
              fill={wargameTileColors[tile.type ?? ""] ?? "#475569"}
              isSelected={selectedTile === tile.id}
              showCoordinates={true}
              coordinates={{ q: tile.q, r: tile.r }}
              orientation="flat-top"
              onClick={() => setSelectedTile(tile.id)}
            />
          )}
          renderEdge={(edge, pos) => (
            <DefaultHexEdge
              position={pos}
              color="#94a3b8"
              hasOwner={!!edge.owner}
            />
          )}
          renderVertex={(vertex, pos) => (
            <DefaultHexVertex
              position={pos}
              color="#94a3b8"
              hasOwner={!!vertex.owner}
            />
          )}
        />
      </div>
    );
  },

  /**
   * Flat-Top Orientation
   * Same data but with flat-top hex orientation
   */
  "Flat-Top Orientation": () => (
    <div className="p-6 bg-slate-900 min-h-screen">
      <h2 className="text-xl font-bold text-white mb-4">Flat-Top Hexagons</h2>
      <p className="text-slate-400 mb-4">Alternative hex orientation</p>

      <HexGrid
        tiles={catanTiles}
        edges={[]}
        vertices={[]}
        hexSize={50}
        orientation="flat-top"
        width={700}
        height={600}
        enablePanZoom={false}
        renderTile={(tile) => (
          <DefaultHexTile
            size={50}
            fill={catanTileColors[tile.type ?? ""] ?? "#475569"}
            label={tile.label}
            showCoordinates={true}
            coordinates={{ q: tile.q, r: tile.r }}
            orientation="flat-top"
          />
        )}
        renderEdge={(edge, pos) => (
          <DefaultHexEdge
            position={pos}
            color="#94a3b8"
            hasOwner={!!edge.owner}
          />
        )}
        renderVertex={(vertex, pos) => (
          <DefaultHexVertex
            position={pos}
            color="#94a3b8"
            hasOwner={!!vertex.owner}
          />
        )}
      />
    </div>
  ),

  /**
   * Interactive Highlighting
   * Shows valid move highlighting for a strategy game
   */
  "Interactive Highlighting": () => {
    const [selectedTile, setSelectedTile] = useState<string>("center");

    // Find adjacent tiles to highlight as "valid"
    const adjacentIds = new Set(
      catanTiles
        .filter((t) => {
          const selected = catanTiles.find((s) => s.id === selectedTile);
          if (!selected) return false;
          const dist =
            (Math.abs(t.q - selected.q) +
              Math.abs(t.q + t.r - selected.q - selected.r) +
              Math.abs(t.r - selected.r)) /
            2;
          return dist === 1;
        })
        .map((t) => t.id),
    );

    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">
          Movement Highlighting
        </h2>
        <p className="text-slate-400 mb-4">
          Selected tile shows adjacent tiles as valid moves (green)
        </p>

        <HexGrid
          tiles={catanTiles}
          edges={[]}
          vertices={[]}
          hexSize={55}
          orientation="pointy-top"
          width={700}
          height={600}
          enablePanZoom={false}
          renderTile={(tile) => (
            <DefaultHexTile
              size={55}
              fill={catanTileColors[tile.type ?? ""] ?? "#475569"}
              label={tile.label}
              isSelected={selectedTile === tile.id}
              isHighlighted={adjacentIds.has(tile.id)}
              onClick={() => setSelectedTile(tile.id)}
            />
          )}
          renderEdge={(edge, pos) => (
            <DefaultHexEdge
              position={pos}
              color="#94a3b8"
              hasOwner={!!edge.owner}
            />
          )}
          renderVertex={(vertex, pos) => (
            <DefaultHexVertex
              position={pos}
              color="#94a3b8"
              hasOwner={!!vertex.owner}
            />
          )}
        />
      </div>
    );
  },

  /**
   * Custom Tile Rendering
   * Using fully custom renderTile for emoji icons
   */
  "Custom Tile Rendering": () => {
    const resourceIcons: Record<string, string> = {
      hills: "⛏️",
      forest: "🌲",
      fields: "🌾",
      pasture: "🐑",
      mountains: "⛰️",
      desert: "🏜️",
    };

    const [selectedTile, setSelectedTile] = useState<string | null>(null);

    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">
          Custom Tile Rendering
        </h2>
        <p className="text-slate-400 mb-4">
          Using fully custom renderTile for emoji icons (no DefaultHexTile)
        </p>

        <HexGrid
          tiles={catanTiles}
          edges={[]}
          vertices={[]}
          hexSize={55}
          orientation="pointy-top"
          width={700}
          height={600}
          enablePanZoom={false}
          renderTile={(tile) => {
            const isSelected = selectedTile === tile.id;
            return (
              <g
                onClick={() => setSelectedTile(tile.id)}
                className="cursor-pointer"
              >
                <circle
                  r={50}
                  fill={isSelected ? "#3b82f6" : "#1e293b"}
                  stroke={isSelected ? "#60a5fa" : "#475569"}
                  strokeWidth={isSelected ? 3 : 2}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={28}
                  y={-5}
                >
                  {resourceIcons[tile.type ?? ""] ?? "❓"}
                </text>
                {tile.label && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={16}
                    fontWeight="bold"
                    y={22}
                  >
                    {tile.label}
                  </text>
                )}
              </g>
            );
          }}
          renderEdge={(edge, pos) => (
            <DefaultHexEdge
              position={pos}
              color={playerColors[edge.owner ?? ""] ?? "#94a3b8"}
              hasOwner={!!edge.owner}
            />
          )}
          renderVertex={(vertex, pos) => (
            <DefaultHexVertex
              position={pos}
              color={playerColors[vertex.owner ?? ""] ?? "#94a3b8"}
              hasOwner={!!vertex.owner}
            />
          )}
        />
      </div>
    );
  },

  /**
   * Responsive Container
   * Using percentage-based sizing for responsive layouts
   */
  "Responsive Container": () => (
    <div className="p-6 bg-slate-900 min-h-screen">
      <h2 className="text-xl font-bold text-white mb-4">Responsive Hex Grid</h2>
      <p className="text-slate-400 mb-4">Grid scales with container width</p>

      <div className="w-full max-w-4xl mx-auto bg-slate-800 p-4 rounded-lg">
        <HexGrid
          tiles={catanTiles}
          edges={[]}
          vertices={[]}
          hexSize={45}
          orientation="pointy-top"
          width="100%"
          height={500}
          enablePanZoom={true}
          renderTile={(tile) => (
            <DefaultHexTile
              size={45}
              fill={catanTileColors[tile.type ?? ""] ?? "#475569"}
              label={tile.label}
            />
          )}
          renderEdge={(edge, pos) => (
            <DefaultHexEdge
              position={pos}
              color="#94a3b8"
              hasOwner={!!edge.owner}
            />
          )}
          renderVertex={(vertex, pos) => (
            <DefaultHexVertex
              position={pos}
              color="#94a3b8"
              hasOwner={!!vertex.owner}
            />
          )}
        />
      </div>
    </div>
  ),

  /**
   * @use-gesture Gestures Demo
   * Showcases all gesture capabilities
   */
  "Gestures Demo": () => (
    <div className="p-6 bg-slate-900 min-h-screen">
      <h2 className="text-xl font-bold text-white mb-2">
        @use-gesture Powered Gestures
      </h2>

      <div className="bg-slate-700/50 rounded-lg p-4 mb-4 max-w-md">
        <ul className="text-slate-300 text-sm space-y-1">
          <li>
            🖱️ <strong>Mouse drag</strong> - Pan the board
          </li>
          <li>
            📱 <strong>Touch drag</strong> - Pan with one finger
          </li>
          <li>
            🤌 <strong>Pinch to zoom</strong> - Two-finger zoom on mobile
          </li>
          <li>
            🖲️ <strong>Mouse wheel</strong> - Scroll to zoom
          </li>
        </ul>
      </div>

      <div className="bg-slate-800 rounded-lg overflow-hidden border-2 border-dashed border-slate-600 max-w-3xl">
        <HexGrid
          tiles={catanTiles}
          edges={[]}
          vertices={[]}
          hexSize={50}
          orientation="pointy-top"
          width="100%"
          height={450}
          enablePanZoom={true}
          initialZoom={0.9}
          minZoom={0.5}
          maxZoom={2.5}
          renderTile={(tile) => (
            <DefaultHexTile
              size={50}
              fill={catanTileColors[tile.type ?? ""] ?? "#475569"}
              label={tile.label}
            />
          )}
          renderEdge={(edge, pos) => (
            <DefaultHexEdge
              position={pos}
              color="#94a3b8"
              hasOwner={!!edge.owner}
            />
          )}
          renderVertex={(vertex, pos) => (
            <DefaultHexVertex
              position={pos}
              color="#94a3b8"
              hasOwner={!!vertex.owner}
            />
          )}
        />
      </div>

      <p className="text-slate-500 text-xs mt-2">
        Powered by @use-gesture/react
      </p>
    </div>
  ),

  /**
   * Interactive Vertex Placement
   * Click corners to place settlements - Catan style!
   */
  "Interactive Vertex Placement": () => {
    const [placedVertices, setPlacedVertices] = useState<Set<string>>(
      new Set(),
    );
    const [hoveredVertex, setHoveredVertex] = useState<string | null>(null);
    const [lastPlaced, setLastPlaced] = useState<InteractiveVertex | null>(
      null,
    );

    const handleVertexClick = (vertex: InteractiveVertex) => {
      setPlacedVertices((prev) => {
        const next = new Set(prev);
        if (next.has(vertex.id)) {
          next.delete(vertex.id);
        } else {
          next.add(vertex.id);
        }
        return next;
      });
      setLastPlaced(vertex);
    };

    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">
          🏠 Settlement Placement
        </h2>
        <p className="text-slate-400 mb-4">
          Hover over corners to see placement points. Click to place/remove
          settlements.
        </p>

        <HexGrid
          tiles={catanTiles}
          edges={[]}
          vertices={[]}
          hexSize={55}
          orientation="pointy-top"
          width={700}
          height={600}
          enablePanZoom={false}
          renderTile={(tile) => (
            <DefaultHexTile
              size={55}
              fill={catanTileColors[tile.type ?? ""] ?? "#475569"}
              label={tile.label}
            />
          )}
          renderEdge={(edge, pos) => (
            <DefaultHexEdge
              position={pos}
              color="#94a3b8"
              hasOwner={!!edge.owner}
            />
          )}
          renderVertex={(vertex, pos) => (
            <DefaultHexVertex
              position={pos}
              color="#94a3b8"
              hasOwner={!!vertex.owner}
            />
          )}
          // Enable interactive vertices
          interactiveVertices={true}
          onInteractiveVertexClick={handleVertexClick}
          onInteractiveVertexEnter={(v) => setHoveredVertex(v.id)}
          onInteractiveVertexLeave={() => setHoveredVertex(null)}
          renderInteractiveVertex={(vertex, position, isHovered) => {
            const isPlaced = placedVertices.has(vertex.id);
            if (isPlaced) {
              return (
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={12}
                  fill="#ef4444"
                  stroke="#1e293b"
                  strokeWidth={2}
                />
              );
            }
            return (
              <DefaultInteractiveVertex
                position={position}
                isHovered={isHovered}
                color="rgba(255, 255, 255, 0.15)"
                hoverColor="rgba(34, 197, 94, 0.7)"
              />
            );
          }}
        />

        <div className="mt-4 flex gap-4 flex-wrap">
          <div className="p-3 bg-slate-800 rounded-lg text-white">
            Settlements placed: {placedVertices.size}
          </div>
          {hoveredVertex && (
            <div className="p-3 bg-slate-800 rounded-lg text-slate-300">
              Hovering: {hoveredVertex}
            </div>
          )}
          {lastPlaced && (
            <div className="p-3 bg-slate-800 rounded-lg text-slate-300">
              Last placed adjacent to:{" "}
              {lastPlaced.adjacentTileIds.slice(0, 3).join(", ")}
            </div>
          )}
        </div>
      </div>
    );
  },

  /**
   * Interactive Edge Placement
   * Click edges to place roads - Catan style!
   */
  "Interactive Edge Placement": () => {
    const [placedEdges, setPlacedEdges] = useState<Set<string>>(new Set());
    const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
    const [lastPlaced, setLastPlaced] = useState<InteractiveEdge | null>(null);

    const handleEdgeClick = (edge: InteractiveEdge) => {
      setPlacedEdges((prev) => {
        const next = new Set(prev);
        if (next.has(edge.id)) {
          next.delete(edge.id);
        } else {
          next.add(edge.id);
        }
        return next;
      });
      setLastPlaced(edge);
    };

    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">🛤️ Road Placement</h2>
        <p className="text-slate-400 mb-4">
          Hover over edges to see placement areas. Click to place/remove roads.
        </p>

        <HexGrid
          tiles={catanTiles}
          edges={[]}
          vertices={[]}
          hexSize={55}
          orientation="pointy-top"
          width={700}
          height={600}
          enablePanZoom={false}
          renderTile={(tile) => (
            <DefaultHexTile
              size={55}
              fill={catanTileColors[tile.type ?? ""] ?? "#475569"}
              label={tile.label}
            />
          )}
          renderEdge={(edge, pos) => (
            <DefaultHexEdge
              position={pos}
              color="#94a3b8"
              hasOwner={!!edge.owner}
            />
          )}
          renderVertex={(vertex, pos) => (
            <DefaultHexVertex
              position={pos}
              color="#94a3b8"
              hasOwner={!!vertex.owner}
            />
          )}
          // Enable interactive edges
          interactiveEdges={true}
          onInteractiveEdgeClick={handleEdgeClick}
          onInteractiveEdgeEnter={(e) => setHoveredEdge(e.id)}
          onInteractiveEdgeLeave={() => setHoveredEdge(null)}
          renderInteractiveEdge={(edge, position, isHovered) => {
            const isPlaced = placedEdges.has(edge.id);
            if (isPlaced) {
              return (
                <line
                  x1={position.x1}
                  y1={position.y1}
                  x2={position.x2}
                  y2={position.y2}
                  stroke="#3b82f6"
                  strokeWidth={8}
                  strokeLinecap="round"
                />
              );
            }
            return (
              <DefaultInteractiveEdge
                position={position}
                isHovered={isHovered}
                color="rgba(255, 255, 255, 0.1)"
                hoverColor="rgba(251, 146, 60, 0.7)"
              />
            );
          }}
        />

        <div className="mt-4 flex gap-4 flex-wrap">
          <div className="p-3 bg-slate-800 rounded-lg text-white">
            Roads placed: {placedEdges.size}
          </div>
          {hoveredEdge && (
            <div className="p-3 bg-slate-800 rounded-lg text-slate-300">
              Hovering: {hoveredEdge}
            </div>
          )}
          {lastPlaced && (
            <div className="p-3 bg-slate-800 rounded-lg text-slate-300">
              Last placed between:{" "}
              {lastPlaced.adjacentTileIds.slice(0, 2).join(" & ")}
            </div>
          )}
        </div>
      </div>
    );
  },

  /**
   * Combined Placement Mode
   * Toggle between settlement and road placement - full Catan experience!
   */
  "Catan Placement Mode": () => {
    type PlacementMode = "settlement" | "road" | null;
    const [placementMode, setPlacementMode] = useState<PlacementMode>(null);
    const [placedVertices, setPlacedVertices] = useState<
      Map<string, { vertex: InteractiveVertex; player: string }>
    >(new Map());
    const [placedEdges, setPlacedEdges] = useState<
      Map<string, { edge: InteractiveEdge; player: string }>
    >(new Map());
    const [currentPlayer, setCurrentPlayer] = useState<string>("player1");

    const handleVertexClick = (vertex: InteractiveVertex) => {
      if (placementMode !== "settlement") return;
      setPlacedVertices((prev) => {
        const next = new Map(prev);
        if (next.has(vertex.id)) {
          next.delete(vertex.id);
        } else {
          next.set(vertex.id, { vertex, player: currentPlayer });
        }
        return next;
      });
    };

    const handleEdgeClick = (edge: InteractiveEdge) => {
      if (placementMode !== "road") return;
      setPlacedEdges((prev) => {
        const next = new Map(prev);
        if (next.has(edge.id)) {
          next.delete(edge.id);
        } else {
          next.set(edge.id, { edge, player: currentPlayer });
        }
        return next;
      });
    };

    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">
          🎮 Catan Placement Mode
        </h2>

        {/* Controls */}
        <div className="flex gap-4 mb-4 flex-wrap">
          <div className="flex gap-2">
            <button
              onClick={() =>
                setPlacementMode(
                  placementMode === "settlement" ? null : "settlement",
                )
              }
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                placementMode === "settlement"
                  ? "bg-green-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              🏠 Place Settlement
            </button>
            <button
              onClick={() =>
                setPlacementMode(placementMode === "road" ? null : "road")
              }
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                placementMode === "road"
                  ? "bg-orange-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              🛤️ Place Road
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-slate-400">Player:</span>
            {(["player1", "player2", "player3", "player4"] as const).map(
              (player) => (
                <button
                  key={player}
                  onClick={() => setCurrentPlayer(player)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    currentPlayer === player
                      ? "scale-125 border-white"
                      : "border-transparent hover:scale-110"
                  }`}
                  style={{ backgroundColor: playerColors[player] }}
                />
              ),
            )}
          </div>
        </div>

        <HexGrid
          tiles={catanTiles}
          edges={[]}
          vertices={[]}
          hexSize={55}
          orientation="pointy-top"
          width={700}
          height={600}
          enablePanZoom={false}
          renderTile={(tile) => (
            <DefaultHexTile
              size={55}
              fill={catanTileColors[tile.type ?? ""] ?? "#475569"}
              label={tile.label}
            />
          )}
          renderEdge={(edge, pos) => (
            <DefaultHexEdge
              position={pos}
              color="#94a3b8"
              hasOwner={!!edge.owner}
            />
          )}
          renderVertex={(vertex, pos) => (
            <DefaultHexVertex
              position={pos}
              color="#94a3b8"
              hasOwner={!!vertex.owner}
            />
          )}
          // Toggle interactive layers based on mode
          interactiveVertices={placementMode === "settlement"}
          interactiveEdges={placementMode === "road"}
          onInteractiveVertexClick={handleVertexClick}
          onInteractiveEdgeClick={handleEdgeClick}
          renderInteractiveVertex={(vertex, position, isHovered) => {
            const placed = placedVertices.get(vertex.id);
            if (placed) {
              return (
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={12}
                  fill={playerColors[placed.player]}
                  stroke="#1e293b"
                  strokeWidth={2}
                />
              );
            }
            return (
              <DefaultInteractiveVertex
                position={position}
                isHovered={isHovered}
                hoverColor={playerColors[currentPlayer]}
              />
            );
          }}
          renderInteractiveEdge={(edge, position, isHovered) => {
            const placed = placedEdges.get(edge.id);
            if (placed) {
              return (
                <line
                  x1={position.x1}
                  y1={position.y1}
                  x2={position.x2}
                  y2={position.y2}
                  stroke={playerColors[placed.player]}
                  strokeWidth={8}
                  strokeLinecap="round"
                />
              );
            }
            return (
              <DefaultInteractiveEdge
                position={position}
                isHovered={isHovered}
                hoverColor={playerColors[currentPlayer]}
              />
            );
          }}
        />

        <div className="mt-4 grid grid-cols-2 gap-4 max-w-md">
          <div className="p-3 bg-slate-800 rounded-lg text-white">
            <div className="text-sm text-slate-400 mb-1">Settlements</div>
            <div className="text-2xl font-bold">{placedVertices.size}</div>
          </div>
          <div className="p-3 bg-slate-800 rounded-lg text-white">
            <div className="text-sm text-slate-400 mb-1">Roads</div>
            <div className="text-2xl font-bold">{placedEdges.size}</div>
          </div>
        </div>

        {placementMode && (
          <p className="mt-4 text-slate-400 text-sm">
            💡 Click on {placementMode === "settlement" ? "corners" : "edges"}{" "}
            to place. Click again to remove.
          </p>
        )}
      </div>
    );
  },

  /**
   * Interactive with Custom Styling
   * Demonstrates custom renderers for interactive elements
   */
  "Custom Interactive Styling": () => {
    const [hoveredVertex, setHoveredVertex] = useState<string | null>(null);
    const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-4">
          ✨ Custom Interactive Styling
        </h2>
        <p className="text-slate-400 mb-4">
          Both vertices and edges visible with custom purple/cyan theme
        </p>

        <HexGrid
          tiles={catanTiles}
          edges={[]}
          vertices={[]}
          hexSize={55}
          orientation="pointy-top"
          width={700}
          height={600}
          enablePanZoom={false}
          renderTile={(tile) => (
            <DefaultHexTile
              size={55}
              fill={catanTileColors[tile.type ?? ""] ?? "#475569"}
              label={tile.label}
            />
          )}
          renderEdge={(edge, pos) => (
            <DefaultHexEdge
              position={pos}
              color="#94a3b8"
              hasOwner={!!edge.owner}
            />
          )}
          renderVertex={(vertex, pos) => (
            <DefaultHexVertex
              position={pos}
              color="#94a3b8"
              hasOwner={!!vertex.owner}
            />
          )}
          // Enable both interactive layers
          interactiveVertices={true}
          interactiveEdges={true}
          interactiveVertexSize={10}
          interactiveEdgeSize={8}
          onInteractiveVertexEnter={(v) => setHoveredVertex(v.id)}
          onInteractiveVertexLeave={() => setHoveredVertex(null)}
          onInteractiveEdgeEnter={(e) => setHoveredEdge(e.id)}
          onInteractiveEdgeLeave={() => setHoveredEdge(null)}
          // Custom purple theme for vertices
          renderInteractiveVertex={(vertex, position, isHovered) => (
            <g>
              <circle
                cx={position.x}
                cy={position.y}
                r={isHovered ? 10 : 6}
                fill={isHovered ? "#a855f7" : "rgba(168, 85, 247, 0.3)"}
                stroke={isHovered ? "#c084fc" : "rgba(168, 85, 247, 0.5)"}
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all duration-150"
              />
              {isHovered && (
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={16}
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  className="animate-spin"
                  style={{ animationDuration: "3s" }}
                />
              )}
            </g>
          )}
          // Custom cyan theme for edges
          renderInteractiveEdge={(edge, position, isHovered) => (
            <g>
              <line
                x1={position.x1}
                y1={position.y1}
                x2={position.x2}
                y2={position.y2}
                stroke={isHovered ? "#06b6d4" : "rgba(6, 182, 212, 0.25)"}
                strokeWidth={isHovered ? 6 : 3}
                strokeLinecap="round"
                className="transition-all duration-150"
              />
              {isHovered && (
                <>
                  <circle
                    cx={position.x1}
                    cy={position.y1}
                    r={4}
                    fill="#06b6d4"
                  />
                  <circle
                    cx={position.x2}
                    cy={position.y2}
                    r={4}
                    fill="#06b6d4"
                  />
                </>
              )}
            </g>
          )}
        />

        <div className="mt-4 flex gap-4">
          {hoveredVertex && (
            <div className="p-3 bg-purple-900/50 border border-purple-500 rounded-lg text-purple-200">
              Vertex: {hoveredVertex}
            </div>
          )}
          {hoveredEdge && (
            <div className="p-3 bg-cyan-900/50 border border-cyan-500 rounded-lg text-cyan-200">
              Edge: {hoveredEdge}
            </div>
          )}
        </div>
      </div>
    );
  },
};
