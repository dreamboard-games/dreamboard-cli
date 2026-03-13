/**
 * NetworkGraph component - Graph/network visualization for route-building games
 *
 * Design Philosophy: "Connected Journeys"
 * - SVG-based network visualization
 * - Support for nodes, edges, and pieces
 * - All rendering controlled by parent via required render functions
 * - Pre-built helper components provided for easy customization
 *
 * Use cases: Ticket to Ride, Pandemic, Power Grid, Brass
 *
 * @example Basic usage with pre-built components
 * ```tsx
 * <NetworkGraph
 *   nodes={nodes}
 *   edges={edges}
 *   pieces={[]}
 *   renderNode={(node, pieces) => (
 *     <DefaultNetworkNode
 *       label={node.label}
 *       isSelected={selectedId === node.id}
 *       onClick={() => setSelectedId(node.id)}
 *     />
 *   )}
 *   renderEdge={(edge, fromNode, toNode) => (
 *     <DefaultNetworkEdge
 *       from={fromNode.position}
 *       to={toNode.position}
 *       color={playerColors[edge.owner]}
 *     />
 *   )}
 *   renderPiece={(piece) => (
 *     <DefaultNetworkPiece color={playerColors[piece.owner]} />
 *   )}
 * />
 * ```
 */

import { useMemo, type ReactNode } from "react";
import { clsx } from "clsx";
import { usePanZoom, calculateViewBox } from "../../hooks/usePanZoom.js";

// ============================================================================
// Types
// ============================================================================

export interface NetworkNode {
  /** Unique node identifier */
  id: string;
  /** Display label */
  label?: string;
  /** Position on the SVG canvas */
  position: { x: number; y: number };
  /** Node type for custom rendering */
  type?: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface NetworkEdge {
  /** Unique edge identifier */
  id: string;
  /** Source node ID */
  from: string;
  /** Target node ID */
  to: string;
  /** Edge label (e.g., weight, distance, cost, route name) */
  label?: string | number;
  /** Owner player ID if claimed */
  owner?: string;
  /** Edge type for custom rendering */
  type?: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface NetworkPiece {
  /** Unique piece identifier */
  id: string;
  /** Node ID where piece is located */
  nodeId: string;
  /** Owner player ID */
  owner?: string;
  /** Piece type for rendering */
  type?: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface NetworkGraphProps {
  /** Network nodes */
  nodes: NetworkNode[];
  /** Network edges - defaults to empty */
  edges: NetworkEdge[];
  /** Pieces/tokens on nodes - defaults to empty */
  pieces: NetworkPiece[];
  /** Custom node renderer - required, receives node centered at its position */
  renderNode: (node: NetworkNode, pieces: NetworkPiece[]) => ReactNode;
  /** Custom edge renderer - required */
  renderEdge: (
    edge: NetworkEdge,
    fromNode: NetworkNode,
    toNode: NetworkNode,
  ) => ReactNode;
  /** Custom piece renderer - required */
  renderPiece: (
    piece: NetworkPiece,
    position: { x: number; y: number },
  ) => ReactNode;
  /** Container width (use "100%" for responsive) */
  width?: number | string;
  /** Container height (use "100%" for responsive) */
  height?: number | string;
  /** Node radius for bounds calculation */
  nodeRadius?: number;
  /** Enable pan and zoom */
  enablePanZoom?: boolean;
  /** Initial zoom level */
  initialZoom?: number;
  /** Min zoom level */
  minZoom?: number;
  /** Max zoom level */
  maxZoom?: number;
  /** Padding around content */
  padding?: number;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Pre-built Helper Components
// ============================================================================

export interface DefaultNetworkNodeProps {
  /** Node radius */
  radius?: number;
  /** Fill color */
  fill?: string;
  /** Stroke color */
  stroke?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Whether node is selected */
  isSelected?: boolean;
  /** Whether node is highlighted */
  isHighlighted?: boolean;
  /** Label to display */
  label?: string;
  /** Max label length before truncation */
  maxLabelLength?: number;
  /** Click handler */
  onClick?: () => void;
  /** Pointer enter handler */
  onPointerEnter?: () => void;
  /** Pointer leave handler */
  onPointerLeave?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * Pre-built network node component for use in renderNode
 *
 * @example
 * ```tsx
 * renderNode={(node) => (
 *   <DefaultNetworkNode
 *     label={node.label}
 *     fill="#1e293b"
 *     isSelected={selectedId === node.id}
 *     onClick={() => setSelectedId(node.id)}
 *   />
 * )}
 * ```
 */
export function DefaultNetworkNode({
  radius = 20,
  fill = "#1e293b",
  stroke = "#475569",
  strokeWidth = 2,
  isSelected = false,
  isHighlighted = false,
  label,
  maxLabelLength = 6,
  onClick,
  onPointerEnter,
  onPointerLeave,
  className,
}: DefaultNetworkNodeProps) {
  const effectiveFill = isSelected
    ? "#3b82f6"
    : isHighlighted
      ? "#22c55e"
      : fill;

  const effectiveStroke = isSelected
    ? "#60a5fa"
    : isHighlighted
      ? "#4ade80"
      : stroke;

  const effectiveStrokeWidth = isSelected || isHighlighted ? 3 : strokeWidth;

  const displayLabel = label
    ? label.length > maxLabelLength
      ? label.slice(0, maxLabelLength - 1) + "…"
      : label
    : undefined;

  return (
    <g
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={clsx(
        "transition-all duration-150",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <circle
        r={radius}
        fill={effectiveFill}
        stroke={effectiveStroke}
        strokeWidth={effectiveStrokeWidth}
      />
      {displayLabel && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={10}
          fontWeight="bold"
        >
          {displayLabel}
        </text>
      )}
    </g>
  );
}

export interface DefaultNetworkEdgeProps {
  /** Start position */
  from: { x: number; y: number };
  /** End position */
  to: { x: number; y: number };
  /** Edge color */
  color?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Whether edge is selected */
  isSelected?: boolean;
  /** Whether edge is highlighted */
  isHighlighted?: boolean;
  /** Label to display at midpoint (e.g., weight, cost, distance) */
  label?: string | number;
  /** Click handler */
  onClick?: () => void;
  /** Pointer enter handler */
  onPointerEnter?: () => void;
  /** Pointer leave handler */
  onPointerLeave?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * Pre-built network edge component for use in renderEdge
 *
 * @example
 * ```tsx
 * renderEdge={(edge, fromNode, toNode) => (
 *   <DefaultNetworkEdge
 *     from={fromNode.position}
 *     to={toNode.position}
 *     color={playerColors[edge.owner] ?? '#64748b'}
 *     label={edge.label}
 *     onClick={() => handleClaimEdge(edge.id)}
 *   />
 * )}
 * ```
 */
export function DefaultNetworkEdge({
  from,
  to,
  color = "#64748b",
  strokeWidth = 3,
  isSelected = false,
  isHighlighted = false,
  label,
  onClick,
  onPointerEnter,
  onPointerLeave,
  className,
}: DefaultNetworkEdgeProps) {
  const effectiveColor = isSelected
    ? "#3b82f6"
    : isHighlighted
      ? "#22c55e"
      : color;

  const effectiveWidth =
    isSelected || isHighlighted ? strokeWidth + 2 : strokeWidth;

  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  return (
    <g
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={clsx(
        "transition-all duration-150",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={effectiveColor}
        strokeWidth={effectiveWidth}
        strokeLinecap="round"
      />
      {label !== undefined && (
        <>
          <circle
            cx={midX}
            cy={midY}
            r={12}
            fill="#1e293b"
            stroke="#475569"
            strokeWidth={1}
          />
          <text
            x={midX}
            y={midY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={10}
            fontWeight="bold"
          >
            {label}
          </text>
        </>
      )}
    </g>
  );
}

export interface DefaultNetworkPieceProps {
  /** Piece color */
  color?: string;
  /** Piece radius */
  radius?: number;
  /** Piece shape */
  shape?: "circle" | "square";
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * Pre-built network piece component for use in renderPiece
 *
 * @example
 * ```tsx
 * renderPiece={(piece, position) => (
 *   <DefaultNetworkPiece
 *     color={playerColors[piece.owner] ?? '#f59e0b'}
 *     shape={piece.type === 'cube' ? 'square' : 'circle'}
 *   />
 * )}
 * ```
 */
export function DefaultNetworkPiece({
  color = "#f59e0b",
  radius = 6,
  shape = "circle",
  onClick,
  className,
}: DefaultNetworkPieceProps) {
  return (
    <g
      onClick={onClick}
      className={clsx(onClick && "cursor-pointer", className)}
    >
      {shape === "square" ? (
        <rect
          x={-radius}
          y={-radius}
          width={radius * 2}
          height={radius * 2}
          fill={color}
          stroke="white"
          strokeWidth={1.5}
        />
      ) : (
        <circle r={radius} fill={color} stroke="white" strokeWidth={1.5} />
      )}
    </g>
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * NetworkGraph component for route-building and network games
 *
 * Features:
 * - SVG-based visualization
 * - All rendering controlled by parent
 * - Piece placement on nodes
 * - Pan and zoom with @use-gesture
 * - Accessibility support
 */
export function NetworkGraph({
  nodes,
  edges = [],
  pieces = [],
  renderNode,
  renderEdge,
  renderPiece,
  width = 800,
  height = 600,
  nodeRadius = 20,
  enablePanZoom = false,
  initialZoom = 1,
  minZoom = 0.5,
  maxZoom = 3,
  padding = 40,
  className,
}: NetworkGraphProps) {
  // Use the unified pan/zoom hook
  const { transform, bind, isDragging } = usePanZoom({
    enabled: enablePanZoom,
    initialZoom,
    minZoom,
    maxZoom,
    mode: "viewbox",
  });

  // Group pieces by node
  const piecesByNode = useMemo(() => {
    const map: Record<string, NetworkPiece[]> = {};
    pieces.forEach((p) => {
      const nodeId = p.nodeId;
      const existing = map[nodeId];
      if (existing) {
        existing.push(p);
      } else {
        map[nodeId] = [p];
      }
    });
    return map;
  }, [pieces]);

  // Create node lookup map
  const nodeMap = useMemo(() => {
    return Object.fromEntries(nodes.map((n) => [n.id, n]));
  }, [nodes]);

  // Calculate bounds for viewBox
  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, width: 400, height: 300 };
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    nodes.forEach((node) => {
      minX = Math.min(minX, node.position.x - nodeRadius);
      minY = Math.min(minY, node.position.y - nodeRadius);
      maxX = Math.max(maxX, node.position.x + nodeRadius);
      maxY = Math.max(maxY, node.position.y + nodeRadius);
    });

    return {
      minX: minX - padding,
      minY: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  }, [nodes, nodeRadius, padding]);

  // Calculate viewBox with pan and zoom
  const viewBox = calculateViewBox(bounds, transform);

  // Parse viewBox for zoom indicator positioning
  const viewBoxParts = viewBox.split(" ").map(Number);
  const viewBoxX = viewBoxParts[0] ?? 0;
  const viewBoxY = viewBoxParts[1] ?? 0;
  const viewBoxHeight = viewBoxParts[3] ?? 0;

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      className={clsx(
        "overflow-visible",
        enablePanZoom && "touch-none",
        isDragging && "cursor-grabbing",
        enablePanZoom && !isDragging && "cursor-grab",
        className,
      )}
      {...bind()}
      role="img"
      aria-label="Network graph"
    >
      {/* Render edges first (below nodes) */}
      <g className="network-edges" role="list" aria-label="Network connections">
        {edges.map((edge) => {
          const fromNode = nodeMap[edge.from];
          const toNode = nodeMap[edge.to];
          if (!fromNode || !toNode) return null;

          return (
            <g
              key={edge.id}
              role="listitem"
              aria-label={`Edge from ${fromNode.label ?? fromNode.id} to ${toNode.label ?? toNode.id}`}
            >
              {renderEdge(edge, fromNode, toNode)}
            </g>
          );
        })}
      </g>

      {/* Render nodes */}
      <g className="network-nodes" role="list" aria-label="Network nodes">
        {nodes.map((node) => {
          const nodePieces = piecesByNode[node.id] ?? [];

          return (
            <g
              key={node.id}
              transform={`translate(${node.position.x}, ${node.position.y})`}
              role="listitem"
              aria-label={node.label ?? node.id}
            >
              {renderNode(node, nodePieces)}

              {/* Render pieces around the node */}
              {nodePieces.length > 0 && (
                <g className="node-pieces">
                  {nodePieces.map((piece, i) => {
                    const angle =
                      (i / nodePieces.length) * 2 * Math.PI - Math.PI / 2;
                    const pieceX = Math.cos(angle) * (nodeRadius + 8);
                    const pieceY = Math.sin(angle) * (nodeRadius + 8);

                    return (
                      <g
                        key={piece.id}
                        transform={`translate(${pieceX}, ${pieceY})`}
                      >
                        {renderPiece(piece, { x: pieceX, y: pieceY })}
                      </g>
                    );
                  })}
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Zoom indicator */}
      {enablePanZoom && transform.zoom !== 1 && (
        <g
          transform={`translate(${viewBoxX + 10}, ${viewBoxY + viewBoxHeight - 30})`}
        >
          <rect
            x={0}
            y={0}
            width={60}
            height={20}
            rx={4}
            fill="rgba(0,0,0,0.6)"
          />
          <text x={30} y={14} textAnchor="middle" fill="white" fontSize={12}>
            {Math.round(transform.zoom * 100)}%
          </text>
        </g>
      )}
    </svg>
  );
}
