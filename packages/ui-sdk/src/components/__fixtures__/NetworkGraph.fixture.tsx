/**
 * NetworkGraph component fixtures
 * Demonstrates network/graph visualization for route-building games
 */
import React, { useState } from "react";
import {
  NetworkGraph,
  DefaultNetworkNode,
  DefaultNetworkEdge,
  DefaultNetworkPiece,
  type NetworkNode,
  type NetworkEdge,
  type NetworkPiece,
} from "../board/NetworkGraph.js";

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

// Sample US cities network (simplified Ticket to Ride)
const citiesNodes: NetworkNode[] = [
  { id: "seattle", label: "Seattle", position: { x: 100, y: 100 } },
  { id: "portland", label: "Portland", position: { x: 100, y: 180 } },
  { id: "sf", label: "San Francisco", position: { x: 80, y: 300 } },
  { id: "la", label: "Los Angeles", position: { x: 120, y: 400 } },
  { id: "denver", label: "Denver", position: { x: 300, y: 250 } },
  { id: "slc", label: "Salt Lake", position: { x: 220, y: 200 } },
  { id: "phoenix", label: "Phoenix", position: { x: 220, y: 380 } },
  { id: "dallas", label: "Dallas", position: { x: 400, y: 400 } },
  { id: "okc", label: "OKC", position: { x: 400, y: 320 } },
  { id: "kc", label: "Kansas City", position: { x: 450, y: 250 } },
  { id: "chicago", label: "Chicago", position: { x: 550, y: 180 } },
  { id: "atlanta", label: "Atlanta", position: { x: 600, y: 350 } },
  { id: "miami", label: "Miami", position: { x: 680, y: 450 } },
  { id: "nyc", label: "New York", position: { x: 700, y: 150 } },
  { id: "boston", label: "Boston", position: { x: 720, y: 100 } },
];

const citiesEdges: NetworkEdge[] = [
  { id: "sea-por", from: "seattle", to: "portland", label: 1 },
  { id: "por-sf", from: "portland", to: "sf", label: 3 },
  { id: "sf-la", from: "sf", to: "la", label: 3 },
  { id: "sea-slc", from: "seattle", to: "slc", label: 4 },
  { id: "por-slc", from: "portland", to: "slc", label: 4 },
  { id: "slc-den", from: "slc", to: "denver", label: 2 },
  { id: "la-phx", from: "la", to: "phoenix", label: 2 },
  { id: "phx-dal", from: "phoenix", to: "dallas", label: 3 },
  { id: "den-okc", from: "denver", to: "okc", label: 3 },
  { id: "okc-dal", from: "okc", to: "dallas", label: 2 },
  { id: "okc-kc", from: "okc", to: "kc", label: 2 },
  { id: "den-kc", from: "denver", to: "kc", label: 3 },
  { id: "kc-chi", from: "kc", to: "chicago", label: 3 },
  { id: "dal-atl", from: "dallas", to: "atlanta", label: 4 },
  { id: "chi-atl", from: "chicago", to: "atlanta", label: 4 },
  { id: "atl-mia", from: "atlanta", to: "miami", label: 3 },
  { id: "chi-nyc", from: "chicago", to: "nyc", label: 5 },
  { id: "atl-nyc", from: "atlanta", to: "nyc", label: 4 },
  { id: "nyc-bos", from: "nyc", to: "boston", label: 2 },
];

const playerColors: Record<string, string> = {
  "player-1": "#ef4444", // Red
  "player-2": "#3b82f6", // Blue
  "player-3": "#22c55e", // Green
};

// Interactive demo
function InteractiveDemo() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [claimedEdges] = useState<NetworkEdge[]>(
    citiesEdges.map((e, i) => ({
      ...e,
      owner: i < 4 ? "player-1" : i < 8 ? "player-2" : undefined,
    })),
  );

  // Find edges connected to selected node
  const highlightedEdgeIds = new Set(
    selectedNode
      ? claimedEdges
          .filter((e) => e.from === selectedNode || e.to === selectedNode)
          .map((e) => e.id)
      : [],
  );

  return (
    <Container title="Interactive Network (Click nodes)">
      <NetworkGraph
        nodes={citiesNodes}
        edges={claimedEdges}
        pieces={[]}
        width={800}
        height={500}
        renderNode={(node) => (
          <DefaultNetworkNode
            label={node.label}
            isSelected={selectedNode === node.id}
            onClick={() =>
              setSelectedNode(node.id === selectedNode ? null : node.id)
            }
          />
        )}
        renderEdge={(edge, fromNode, toNode) => (
          <DefaultNetworkEdge
            from={fromNode.position}
            to={toNode.position}
            color={playerColors[edge.owner ?? ""] ?? "#64748b"}
            isHighlighted={highlightedEdgeIds.has(edge.id)}
            label={edge.label}
          />
        )}
        renderPiece={(piece) => (
          <DefaultNetworkPiece
            color={playerColors[piece.owner ?? ""] ?? "#f59e0b"}
          />
        )}
      />
      <div className="mt-4 text-slate-400 text-sm">
        {selectedNode
          ? `Selected: ${citiesNodes.find((n) => n.id === selectedNode)?.label}`
          : "Click a city to see its connections"}
      </div>
    </Container>
  );
}

// Pandemic-style network with pieces
function PandemicDemo() {
  const pieces: NetworkPiece[] = [
    { id: "cube-1", nodeId: "atlanta", owner: "player-1", type: "cube" },
    { id: "cube-2", nodeId: "atlanta", owner: "player-2", type: "cube" },
    { id: "cube-3", nodeId: "chicago", owner: "player-1", type: "cube" },
    { id: "pawn-1", nodeId: "miami", owner: "player-3", type: "pawn" },
  ];

  return (
    <Container title="With Pieces (Pandemic-style)">
      <NetworkGraph
        nodes={citiesNodes}
        edges={citiesEdges}
        pieces={pieces}
        width={800}
        height={500}
        renderNode={(node) => <DefaultNetworkNode label={node.label} />}
        renderEdge={(edge, fromNode, toNode) => (
          <DefaultNetworkEdge
            from={fromNode.position}
            to={toNode.position}
            color="#64748b"
          />
        )}
        renderPiece={(piece) => (
          <DefaultNetworkPiece
            color={playerColors[piece.owner ?? ""] ?? "#f59e0b"}
            shape={piece.type === "cube" ? "square" : "circle"}
          />
        )}
      />
      <div className="mt-4 flex gap-4 text-sm">
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500" /> Player 1
        </span>
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500" /> Player 2
        </span>
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500" /> Player 3
        </span>
      </div>
    </Container>
  );
}

// Simple triangle network
function SimpleDemo() {
  const nodes: NetworkNode[] = [
    { id: "a", label: "A", position: { x: 200, y: 50 } },
    { id: "b", label: "B", position: { x: 100, y: 200 } },
    { id: "c", label: "C", position: { x: 300, y: 200 } },
  ];

  const edges: NetworkEdge[] = [
    { id: "a-b", from: "a", to: "b", label: 3 },
    { id: "b-c", from: "b", to: "c", label: 4 },
    { id: "a-c", from: "a", to: "c", label: 2 },
  ];

  return (
    <Container title="Simple Triangle Network">
      <NetworkGraph
        nodes={nodes}
        edges={edges}
        pieces={[]}
        width={400}
        height={280}
        nodeRadius={30}
        renderNode={(node) => (
          <DefaultNetworkNode label={node.label} radius={30} />
        )}
        renderEdge={(edge, fromNode, toNode) => (
          <DefaultNetworkEdge
            from={fromNode.position}
            to={toNode.position}
            strokeWidth={4}
            label={edge.label}
          />
        )}
        renderPiece={(piece) => (
          <DefaultNetworkPiece
            color={playerColors[piece.owner ?? ""] ?? "#f59e0b"}
          />
        )}
      />
    </Container>
  );
}

// Highlighted routes demo
function HighlightedDemo() {
  const highlightedNodeIds = new Set([
    "seattle",
    "slc",
    "denver",
    "okc",
    "dallas",
    "atlanta",
    "miami",
  ]);
  const highlightedEdgeIds = new Set([
    "sea-slc",
    "slc-den",
    "den-okc",
    "okc-dal",
    "dal-atl",
    "atl-mia",
  ]);

  return (
    <Container title="Highlighted Route (Seattle to Miami)">
      <NetworkGraph
        nodes={citiesNodes}
        edges={citiesEdges}
        pieces={[]}
        width={800}
        height={500}
        renderNode={(node) => (
          <DefaultNetworkNode
            label={node.label}
            isHighlighted={highlightedNodeIds.has(node.id)}
          />
        )}
        renderEdge={(edge, fromNode, toNode) => (
          <DefaultNetworkEdge
            from={fromNode.position}
            to={toNode.position}
            isHighlighted={highlightedEdgeIds.has(edge.id)}
            label={edge.label}
          />
        )}
        renderPiece={(piece) => (
          <DefaultNetworkPiece
            color={playerColors[piece.owner ?? ""] ?? "#f59e0b"}
          />
        )}
      />
    </Container>
  );
}

// Edge click demo
function EdgeClickDemo() {
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [edges, setEdges] = useState<NetworkEdge[]>(citiesEdges);

  const handleEdgeClick = (edgeId: string) => {
    setSelectedEdge(edgeId);
    // Claim the edge
    setEdges((prev) =>
      prev.map((e) =>
        e.id === edgeId && !e.owner ? { ...e, owner: "player-1" } : e,
      ),
    );
  };

  return (
    <Container title="Click to Claim Routes">
      <NetworkGraph
        nodes={citiesNodes}
        edges={edges}
        pieces={[]}
        width={800}
        height={500}
        renderNode={(node) => <DefaultNetworkNode label={node.label} />}
        renderEdge={(edge, fromNode, toNode) => (
          <DefaultNetworkEdge
            from={fromNode.position}
            to={toNode.position}
            color={playerColors[edge.owner ?? ""] ?? "#64748b"}
            isSelected={selectedEdge === edge.id}
            label={edge.label}
            onClick={() => handleEdgeClick(edge.id)}
          />
        )}
        renderPiece={(piece) => (
          <DefaultNetworkPiece
            color={playerColors[piece.owner ?? ""] ?? "#f59e0b"}
          />
        )}
      />
      <div className="mt-4 text-slate-400 text-sm">
        Click an unclaimed route (gray) to claim it as Player 1 (red)
      </div>
    </Container>
  );
}

// Responsive demo with pan & zoom
function ResponsiveDemo() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  return (
    <Container title="Responsive with Pan & Zoom (Mobile-Friendly)">
      <p className="text-slate-400 text-sm mb-4">
        Drag to pan, pinch/scroll to zoom. Works on touch devices.
      </p>
      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <NetworkGraph
          nodes={citiesNodes}
          edges={citiesEdges}
          pieces={[]}
          width="100%"
          height={450}
          enablePanZoom={true}
          initialZoom={0.9}
          minZoom={0.5}
          maxZoom={2.5}
          padding={50}
          renderNode={(node) => (
            <DefaultNetworkNode
              label={node.label}
              isSelected={selectedNode === node.id}
              onClick={() =>
                setSelectedNode(node.id === selectedNode ? null : node.id)
              }
            />
          )}
          renderEdge={(edge, fromNode, toNode) => (
            <DefaultNetworkEdge
              from={fromNode.position}
              to={toNode.position}
              label={edge.label}
            />
          )}
          renderPiece={(piece) => (
            <DefaultNetworkPiece
              color={playerColors[piece.owner ?? ""] ?? "#f59e0b"}
            />
          )}
        />
      </div>
      <div className="mt-4 text-slate-400 text-sm">
        {selectedNode
          ? `Selected: ${citiesNodes.find((n) => n.id === selectedNode)?.label}`
          : "Click a city to select it. Pan & zoom to explore."}
      </div>
    </Container>
  );
}

// Full width container demo
function FullWidthDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-4">
      <h2 className="text-xl font-bold text-white mb-4">
        Full Width Responsive
      </h2>
      <p className="text-slate-400 text-sm mb-4">
        Container width: 100% - resizes with viewport
      </p>
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <NetworkGraph
          nodes={citiesNodes}
          edges={citiesEdges}
          pieces={[]}
          width="100%"
          height={400}
          enablePanZoom={true}
          initialZoom={1}
          renderNode={(node) => <DefaultNetworkNode label={node.label} />}
          renderEdge={(edge, fromNode, toNode) => (
            <DefaultNetworkEdge
              from={fromNode.position}
              to={toNode.position}
              label={edge.label}
            />
          )}
          renderPiece={(piece) => (
            <DefaultNetworkPiece
              color={playerColors[piece.owner ?? ""] ?? "#f59e0b"}
            />
          )}
        />
      </div>
    </div>
  );
}

// Large network with pan/zoom
function LargeNetworkDemo() {
  // Generate a larger network
  const gridSize = 5;
  const largeNodes: NetworkNode[] = [];
  const largeEdges: NetworkEdge[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const id = `n${row}-${col}`;
      largeNodes.push({
        id,
        label: `${row},${col}`,
        position: { x: 80 + col * 140, y: 80 + row * 120 },
      });

      // Connect to right neighbor
      if (col < gridSize - 1) {
        largeEdges.push({
          id: `e${row}-${col}-r`,
          from: id,
          to: `n${row}-${col + 1}`,
          label: Math.floor(Math.random() * 5) + 1,
        });
      }
      // Connect to bottom neighbor
      if (row < gridSize - 1) {
        largeEdges.push({
          id: `e${row}-${col}-d`,
          from: id,
          to: `n${row + 1}-${col}`,
          label: Math.floor(Math.random() * 5) + 1,
        });
      }
    }
  }

  return (
    <Container title="Large Network with Pan & Zoom">
      <p className="text-slate-400 text-sm mb-4">
        25-node grid network. Pan and zoom to navigate. Great for mobile!
      </p>
      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <NetworkGraph
          nodes={largeNodes}
          edges={largeEdges}
          pieces={[]}
          width="100%"
          height={400}
          nodeRadius={25}
          enablePanZoom={true}
          initialZoom={0.6}
          minZoom={0.3}
          maxZoom={2}
          renderNode={(node) => (
            <DefaultNetworkNode label={node.label} radius={25} />
          )}
          renderEdge={(edge, fromNode, toNode) => (
            <DefaultNetworkEdge
              from={fromNode.position}
              to={toNode.position}
              label={edge.label}
            />
          )}
          renderPiece={(piece) => (
            <DefaultNetworkPiece
              color={playerColors[piece.owner ?? ""] ?? "#f59e0b"}
            />
          )}
        />
      </div>
    </Container>
  );
}

// @use-gesture powered gestures demo
function GesturesDemo() {
  return (
    <Container title="@use-gesture Powered Interactions">
      <div className="space-y-4">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-2">✨ Gesture Features</h3>
          <ul className="text-slate-300 text-sm space-y-1">
            <li>
              🖱️ <strong>Mouse drag</strong> - Pan around the board
            </li>
            <li>
              📱 <strong>Touch drag</strong> - Pan with one finger
            </li>
            <li>
              🤌 <strong>Pinch to zoom</strong> - Zoom with two fingers on
              mobile
            </li>
            <li>
              🖲️ <strong>Mouse wheel</strong> - Scroll to zoom on desktop
            </li>
            <li>
              🎯 <strong>Inertia</strong> - Natural momentum after releasing
            </li>
          </ul>
        </div>

        <p className="text-slate-400 text-sm">
          Try the gestures below! Works on both desktop and touch devices.
        </p>

        <div className="bg-slate-900 rounded-lg overflow-hidden border-2 border-dashed border-slate-600">
          <NetworkGraph
            nodes={citiesNodes}
            edges={citiesEdges}
            pieces={[]}
            width="100%"
            height={350}
            enablePanZoom={true}
            initialZoom={0.8}
            minZoom={0.4}
            maxZoom={2.5}
            renderNode={(node) => <DefaultNetworkNode label={node.label} />}
            renderEdge={(edge, fromNode, toNode) => (
              <DefaultNetworkEdge
                from={fromNode.position}
                to={toNode.position}
                label={edge.label}
              />
            )}
            renderPiece={(piece) => (
              <DefaultNetworkPiece
                color={playerColors[piece.owner ?? ""] ?? "#f59e0b"}
              />
            )}
          />
        </div>

        <p className="text-slate-500 text-xs text-center">
          Powered by @use-gesture/react for smooth, native-feeling interactions
        </p>
      </div>
    </Container>
  );
}

export default {
  interactive: <InteractiveDemo />,
  pandemic: <PandemicDemo />,
  simple: <SimpleDemo />,
  highlighted: <HighlightedDemo />,
  edgeClick: <EdgeClickDemo />,
  responsive: <ResponsiveDemo />,
  fullWidth: <FullWidthDemo />,
  largeNetwork: <LargeNetworkDemo />,
  gestures: <GesturesDemo />,

  default: (
    <Container title="Basic Network Graph">
      <NetworkGraph
        nodes={citiesNodes}
        edges={citiesEdges}
        pieces={[]}
        width={800}
        height={500}
        renderNode={(node) => <DefaultNetworkNode label={node.label} />}
        renderEdge={(edge, fromNode, toNode) => (
          <DefaultNetworkEdge
            from={fromNode.position}
            to={toNode.position}
            label={edge.label}
          />
        )}
        renderPiece={(piece) => (
          <DefaultNetworkPiece
            color={playerColors[piece.owner ?? ""] ?? "#f59e0b"}
          />
        )}
      />
    </Container>
  ),
};
