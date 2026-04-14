/**
 * SVG-based hex grid for hex-based games (Catan, wargames, Hive, Twilight Imperium).
 * Supports tiles, edges (roads), vertices (settlements), and interactive placement overlays.
 * Pan/zoom enabled on mobile via @use-gesture.
 */

import { useMemo, useCallback, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { usePanZoom, calculateViewBox } from "../../hooks/usePanZoom.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import type { HexTileState, HexVertexState } from "../../types/player-state.js";
import type { HexEdgeState } from "../../types/player-state.js";

// ============================================================================
// Types
// ============================================================================

export type HexOrientation = "pointy-top" | "flat-top";

export interface EdgePosition {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  midX: number;
  midY: number;
  angle: number;
}

/** Auto-generated corner point where 1-3 hexes meet (for settlement placement). */
export interface InteractiveVertex {
  id: string;
  position: { x: number; y: number };
  adjacentTileIds: string[];
  cornerIndex: number;
}

/** Auto-generated edge where 1-2 hexes meet (for road placement). */
export interface InteractiveEdge {
  id: string;
  position: EdgePosition;
  adjacentTileIds: string[];
  edgeIndex: number;
}

export interface HexGridProps {
  tiles: HexTileState[];
  edges: HexEdgeState[];
  vertices: HexVertexState[];
  orientation?: HexOrientation;
  /** Hex radius in pixels */
  hexSize?: number;
  /** Receives tile data centered at (0,0) */
  renderTile: (tile: HexTileState) => ReactNode;
  renderEdge: (edge: HexEdgeState, position: EdgePosition) => ReactNode;
  renderVertex: (
    vertex: HexVertexState,
    position: { x: number; y: number },
  ) => ReactNode;
  width?: number | string;
  height?: number | string;
  enablePanZoom?: boolean;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  className?: string;

  // Interactive Vertices & Edges (for Catan-style placement)

  /** Auto-generates clickable vertex points (deduplicated where tiles meet) */
  interactiveVertices?: boolean;
  /** Auto-generates clickable edges (deduplicated where tiles meet) */
  interactiveEdges?: boolean;
  onInteractiveVertexClick?: (vertex: InteractiveVertex) => void;
  onInteractiveVertexEnter?: (vertex: InteractiveVertex) => void;
  onInteractiveVertexLeave?: (vertex: InteractiveVertex) => void;
  onInteractiveEdgeClick?: (edge: InteractiveEdge) => void;
  onInteractiveEdgeEnter?: (edge: InteractiveEdge) => void;
  onInteractiveEdgeLeave?: (edge: InteractiveEdge) => void;
  renderInteractiveVertex?: (
    vertex: InteractiveVertex,
    isHovered: boolean,
  ) => ReactNode;
  renderInteractiveEdge?: (
    edge: InteractiveEdge,
    isHovered: boolean,
  ) => ReactNode;
  interactiveVertexSize?: number;
  interactiveEdgeSize?: number;
}

// ============================================================================
// Pre-built Helper Components
// ============================================================================

export interface DefaultHexTileProps {
  /** Should match hexSize from HexGrid */
  size: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
  label?: string;
  showCoordinates?: boolean;
  coordinates?: { q: number; r: number };
  orientation?: HexOrientation;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  className?: string;
}

/** Pre-built hexagon tile for use in `renderTile`. */
export function DefaultHexTile({
  size,
  fill,
  stroke = "#1e293b",
  strokeWidth = 1.5,
  isSelected = false,
  isHighlighted = false,
  label,
  showCoordinates = false,
  coordinates,
  orientation = "pointy-top",
  onClick,
  onPointerEnter,
  onPointerLeave,
  className,
}: DefaultHexTileProps) {
  const effectiveFill = isSelected
    ? "rgba(59, 130, 246, 0.5)"
    : isHighlighted
      ? "rgba(34, 197, 94, 0.4)"
      : fill;

  const effectiveStroke = isSelected
    ? "#3b82f6"
    : isHighlighted
      ? "#22c55e"
      : stroke;

  const effectiveStrokeWidth = isSelected || isHighlighted ? 3 : strokeWidth;

  const points = hexUtils.getHexPoints(0, 0, size * 0.95, orientation);

  return (
    <g
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={clsx(
        "transition-all duration-150",
        onClick && "cursor-pointer hover:brightness-110",
        className,
      )}
    >
      <polygon
        points={points}
        fill={effectiveFill}
        stroke={effectiveStroke}
        strokeWidth={effectiveStrokeWidth}
        filter="url(#hexShadow)"
      />

      {label && (
        <text
          x={0}
          y={showCoordinates ? -8 : 0}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={size * 0.28}
          fontWeight="bold"
          style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
          pointerEvents="none"
        >
          {label}
        </text>
      )}

      {showCoordinates && coordinates && (
        <text
          x={0}
          y={label ? 10 : 0}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.7)"
          fontSize={size * 0.2}
          pointerEvents="none"
        >
          {coordinates.q},{coordinates.r}
        </text>
      )}
    </g>
  );
}

export interface DefaultHexEdgeProps {
  position: EdgePosition;
  color: string;
  hasOwner?: boolean;
  strokeWidth?: number;
  touchTargetSize?: number;
  onClick?: () => void;
  className?: string;
}

/** Pre-built edge/road component for use in `renderEdge`. */
export function DefaultHexEdge({
  position,
  color,
  hasOwner = true,
  strokeWidth = 6,
  touchTargetSize = 20,
  onClick,
  className,
}: DefaultHexEdgeProps) {
  return (
    <g
      onClick={onClick}
      className={clsx(
        "transition-all duration-150",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {/* Invisible touch target */}
      <line
        x1={position.x1}
        y1={position.y1}
        x2={position.x2}
        y2={position.y2}
        stroke="transparent"
        strokeWidth={touchTargetSize}
        strokeLinecap="round"
      />
      {/* Visible edge */}
      <line
        x1={position.x1}
        y1={position.y1}
        x2={position.x2}
        y2={position.y2}
        stroke={color}
        strokeWidth={hasOwner ? strokeWidth : strokeWidth / 2}
        strokeLinecap="round"
        className={hasOwner ? "" : "opacity-30"}
      />
    </g>
  );
}

export interface DefaultHexVertexProps {
  position: { x: number; y: number };
  color: string;
  stroke?: string;
  strokeWidth?: number;
  hasOwner?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  size?: number;
  touchTargetSize?: number;
  shape?: "circle" | "square";
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  className?: string;
}

/** Pre-built vertex/settlement component for use in `renderVertex`. */
export function DefaultHexVertex({
  position,
  color,
  stroke = "#1e293b",
  strokeWidth = 1.5,
  hasOwner = true,
  isSelected = false,
  isHighlighted = false,
  size = 10,
  touchTargetSize = 22,
  shape = "circle",
  onClick,
  onPointerEnter,
  onPointerLeave,
  className,
}: DefaultHexVertexProps) {
  const effectiveColor = isSelected
    ? "rgba(59, 130, 246, 0.8)"
    : isHighlighted
      ? "rgba(34, 197, 94, 0.8)"
      : color;

  const effectiveStroke = isSelected
    ? "#3b82f6"
    : isHighlighted
      ? "#22c55e"
      : stroke;

  const effectiveStrokeWidth = isSelected || isHighlighted ? 3 : strokeWidth;

  return (
    <g
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={clsx(
        "transition-all duration-150",
        onClick && "cursor-pointer hover:scale-110",
        className,
      )}
      style={{ transformOrigin: `${position.x}px ${position.y}px` }}
    >
      {/* Invisible touch target */}
      <circle
        cx={position.x}
        cy={position.y}
        r={touchTargetSize}
        fill="transparent"
      />
      {/* Visible vertex */}
      {shape === "square" ? (
        <rect
          x={position.x - size}
          y={position.y - size}
          width={size * 2}
          height={size * 2}
          fill={effectiveColor}
          stroke={effectiveStroke}
          strokeWidth={effectiveStrokeWidth}
          className={hasOwner ? "" : "opacity-30"}
        />
      ) : (
        <circle
          cx={position.x}
          cy={position.y}
          r={hasOwner ? size : size * 0.5}
          fill={effectiveColor}
          stroke={effectiveStroke}
          strokeWidth={effectiveStrokeWidth}
          className={hasOwner ? "" : "opacity-30"}
        />
      )}
    </g>
  );
}

// ============================================================================
// Interactive Helper Components (for placement UI)
// ============================================================================

export interface DefaultInteractiveVertexProps {
  vertex: InteractiveVertex;
  isHovered: boolean;
  size?: number;
  color?: string;
  hoverColor?: string;
  className?: string;
}
export function DefaultInteractiveVertex({
  vertex,
  isHovered,
  size = 8,
  color = "rgba(255, 255, 255, 0.2)",
  hoverColor = "rgba(34, 197, 94, 0.8)",
  className,
}: DefaultInteractiveVertexProps) {
  return (
    <circle
      cx={vertex.position.x}
      cy={vertex.position.y}
      r={isHovered ? size * 1.5 : size}
      fill={isHovered ? hoverColor : color}
      stroke={isHovered ? "#22c55e" : "rgba(255,255,255,0.4)"}
      strokeWidth={isHovered ? 2 : 1}
      className={clsx("transition-all duration-150", className)}
    />
  );
}

export interface DefaultInteractiveEdgeProps {
  edge: InteractiveEdge;
  isHovered: boolean;
  strokeWidth?: number;
  color?: string;
  hoverColor?: string;
  className?: string;
}
export function DefaultInteractiveEdge({
  edge,
  isHovered,
  strokeWidth = 4,
  color = "rgba(255, 255, 255, 0.15)",
  hoverColor = "rgba(251, 146, 60, 0.8)",
  className,
}: DefaultInteractiveEdgeProps) {
  return (
    <line
      x1={edge.position.x1}
      y1={edge.position.y1}
      x2={edge.position.x2}
      y2={edge.position.y2}
      stroke={isHovered ? hoverColor : color}
      strokeWidth={isHovered ? strokeWidth * 1.5 : strokeWidth}
      strokeLinecap="round"
      className={clsx("transition-all duration-150", className)}
    />
  );
}

// ============================================================================
// Hex Math Utilities
// ============================================================================

export const hexUtils = {
  /** Convert axial coordinates to pixel position. */
  axialToPixel(
    q: number,
    r: number,
    size: number,
    orientation: HexOrientation,
  ): { x: number; y: number } {
    if (orientation === "pointy-top") {
      const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
      const y = size * ((3 / 2) * r);
      return { x, y };
    } else {
      const x = size * ((3 / 2) * q);
      const y = size * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r);
      return { x, y };
    }
  },

  getNeighbors(q: number, r: number): Array<{ q: number; r: number }> {
    return [
      { q: q + 1, r: r },
      { q: q + 1, r: r - 1 },
      { q: q, r: r - 1 },
      { q: q - 1, r: r },
      { q: q - 1, r: r + 1 },
      { q: q, r: r + 1 },
    ];
  },

  getDistance(q1: number, r1: number, q2: number, r2: number): number {
    return (
      (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2
    );
  },

  getHexCorners(
    centerX: number,
    centerY: number,
    size: number,
    orientation: HexOrientation,
  ): Array<{ x: number; y: number }> {
    const corners: Array<{ x: number; y: number }> = [];
    const startAngle = orientation === "pointy-top" ? 30 : 0;

    for (let i = 0; i < 6; i++) {
      const angleDeg = startAngle + 60 * i;
      const angleRad = (Math.PI / 180) * angleDeg;
      corners.push({
        x: centerX + size * Math.cos(angleRad),
        y: centerY + size * Math.sin(angleRad),
      });
    }
    return corners;
  },

  getHexPoints(
    centerX: number,
    centerY: number,
    size: number,
    orientation: HexOrientation,
  ): string {
    const corners = this.getHexCorners(centerX, centerY, size, orientation);
    return corners.map((c) => `${c.x},${c.y}`).join(" ");
  },

  getEdgePosition(
    hex1Pos: { x: number; y: number },
    hex2Pos: { x: number; y: number },
    size: number,
  ): EdgePosition {
    const midX = (hex1Pos.x + hex2Pos.x) / 2;
    const midY = (hex1Pos.y + hex2Pos.y) / 2;
    const angle = Math.atan2(hex2Pos.y - hex1Pos.y, hex2Pos.x - hex1Pos.x);

    // Calculate edge endpoints perpendicular to the line between hex centers
    const perpAngle = angle + Math.PI / 2;
    const edgeLength = size * 0.8;

    return {
      x1: midX - (edgeLength / 2) * Math.cos(perpAngle),
      y1: midY - (edgeLength / 2) * Math.sin(perpAngle),
      x2: midX + (edgeLength / 2) * Math.cos(perpAngle),
      y2: midY + (edgeLength / 2) * Math.sin(perpAngle),
      midX,
      midY,
      angle: (angle * 180) / Math.PI,
    };
  },

  getVertexPosition(
    hex1Pos: { x: number; y: number },
    hex2Pos: { x: number; y: number },
    hex3Pos: { x: number; y: number },
  ): { x: number; y: number } {
    return {
      x: (hex1Pos.x + hex2Pos.x + hex3Pos.x) / 3,
      y: (hex1Pos.y + hex2Pos.y + hex3Pos.y) / 3,
    };
  },

  /** Generate deduplicated interactive vertices from tiles (shared corners merged). */
  generateInteractiveVertices(
    tiles: HexTileState[],
    hexSize: number,
    orientation: HexOrientation,
  ): InteractiveVertex[] {
    const vertexMap = new Map<string, InteractiveVertex>();
    const tolerance = 0.1;

    // Round to integer grid indices for stable deduplication
    const posKey = (x: number, y: number) =>
      `${Math.round(x / tolerance)},${Math.round(y / tolerance)}`;

    tiles.forEach((tile) => {
      const tilePos = this.axialToPixel(tile.q, tile.r, hexSize, orientation);
      const corners = this.getHexCorners(
        tilePos.x,
        tilePos.y,
        hexSize,
        orientation,
      );

      corners.forEach((corner, cornerIndex) => {
        const key = posKey(corner.x, corner.y);
        const existing = vertexMap.get(key);

        if (existing) {
          // Add this tile to existing vertex's adjacent tiles
          if (!existing.adjacentTileIds.includes(tile.id)) {
            existing.adjacentTileIds.push(tile.id);
          }
        } else {
          // Create new vertex
          vertexMap.set(key, {
            id: `vertex-${key}`,
            position: { x: corner.x, y: corner.y },
            adjacentTileIds: [tile.id],
            cornerIndex,
          });
        }
      });
    });

    return Array.from(vertexMap.values());
  },

  /** Generate deduplicated interactive edges from tiles (shared edges merged). */
  generateInteractiveEdges(
    tiles: HexTileState[],
    hexSize: number,
    orientation: HexOrientation,
  ): InteractiveEdge[] {
    const edgeMap = new Map<string, InteractiveEdge>();
    const tolerance = 0.1;

    const posKey = (x: number, y: number) =>
      `${Math.round(x / tolerance)},${Math.round(y / tolerance)}`;

    tiles.forEach((tile) => {
      const tilePos = this.axialToPixel(tile.q, tile.r, hexSize, orientation);
      const corners = this.getHexCorners(
        tilePos.x,
        tilePos.y,
        hexSize,
        orientation,
      );

      // Each edge connects two adjacent corners
      for (let i = 0; i < 6; i++) {
        const corner1 = corners[i];
        const corner2 = corners[(i + 1) % 6];
        // Guard check (corners always has exactly 6 elements from getHexCorners)
        if (!corner1 || !corner2) continue;

        const midX = (corner1.x + corner2.x) / 2;
        const midY = (corner1.y + corner2.y) / 2;
        const key = posKey(midX, midY);
        const existing = edgeMap.get(key);

        if (existing) {
          // Add this tile to existing edge's adjacent tiles
          if (!existing.adjacentTileIds.includes(tile.id)) {
            existing.adjacentTileIds.push(tile.id);
          }
        } else {
          // Calculate edge angle
          const angle = Math.atan2(
            corner2.y - corner1.y,
            corner2.x - corner1.x,
          );

          edgeMap.set(key, {
            id: `edge-${key}`,
            position: {
              x1: corner1.x,
              y1: corner1.y,
              x2: corner2.x,
              y2: corner2.y,
              midX,
              midY,
              angle: (angle * 180) / Math.PI,
            },
            adjacentTileIds: [tile.id],
            edgeIndex: i,
          });
        }
      }
    });

    return Array.from(edgeMap.values());
  },
};

// ============================================================================
// Component
// ============================================================================

export function HexGrid({
  tiles,
  edges = [],
  vertices = [],
  orientation = "pointy-top",
  hexSize = 50,
  renderTile,
  renderEdge,
  renderVertex,
  width = 800,
  height = 600,
  enablePanZoom = true,
  initialZoom = 1,
  minZoom = 0.5,
  maxZoom = 3,
  className,
  // Interactive props
  interactiveVertices = false,
  interactiveEdges = false,
  onInteractiveVertexClick,
  onInteractiveVertexEnter,
  onInteractiveVertexLeave,
  onInteractiveEdgeClick,
  onInteractiveEdgeEnter,
  onInteractiveEdgeLeave,
  renderInteractiveVertex,
  renderInteractiveEdge,
  interactiveVertexSize = 12,
  interactiveEdgeSize = 10,
}: HexGridProps) {
  // Pan/zoom is only enabled on mobile devices when the prop is true
  const isMobile = useIsMobile();
  const effectivePanZoom = enablePanZoom && isMobile;

  // Hover state for interactive elements
  const [hoveredVertexId, setHoveredVertexId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Use the unified pan/zoom hook
  const { transform, bind, isDragging } = usePanZoom({
    enabled: effectivePanZoom,
    initialZoom,
    minZoom,
    maxZoom,
    mode: "viewbox",
  });

  // Pre-compute tile positions
  const tilePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    tiles.forEach((tile) => {
      positions.set(
        tile.id,
        hexUtils.axialToPixel(tile.q, tile.r, hexSize, orientation),
      );
    });
    return positions;
  }, [tiles, hexSize, orientation]);

  // Generate interactive vertices when enabled
  const generatedVertices = useMemo(() => {
    if (!interactiveVertices) return [];
    return hexUtils.generateInteractiveVertices(tiles, hexSize, orientation);
  }, [interactiveVertices, tiles, hexSize, orientation]);

  // Generate interactive edges when enabled
  const generatedEdges = useMemo(() => {
    if (!interactiveEdges) return [];
    return hexUtils.generateInteractiveEdges(tiles, hexSize, orientation);
  }, [interactiveEdges, tiles, hexSize, orientation]);

  // Vertex event handlers
  const handleVertexEnter = useCallback(
    (vertex: InteractiveVertex) => {
      setHoveredVertexId(vertex.id);
      onInteractiveVertexEnter?.(vertex);
    },
    [onInteractiveVertexEnter],
  );

  const handleVertexLeave = useCallback(
    (vertex: InteractiveVertex) => {
      setHoveredVertexId(null);
      onInteractiveVertexLeave?.(vertex);
    },
    [onInteractiveVertexLeave],
  );

  const handleVertexClick = useCallback(
    (vertex: InteractiveVertex) => {
      onInteractiveVertexClick?.(vertex);
    },
    [onInteractiveVertexClick],
  );

  // Edge event handlers
  const handleEdgeEnter = useCallback(
    (edge: InteractiveEdge) => {
      setHoveredEdgeId(edge.id);
      onInteractiveEdgeEnter?.(edge);
    },
    [onInteractiveEdgeEnter],
  );

  const handleEdgeLeave = useCallback(
    (edge: InteractiveEdge) => {
      setHoveredEdgeId(null);
      onInteractiveEdgeLeave?.(edge);
    },
    [onInteractiveEdgeLeave],
  );

  const handleEdgeClick = useCallback(
    (edge: InteractiveEdge) => {
      onInteractiveEdgeClick?.(edge);
    },
    [onInteractiveEdgeClick],
  );

  // Calculate bounds for viewBox
  const bounds = useMemo(() => {
    if (tiles.length === 0) {
      return { minX: 0, minY: 0, width: 400, height: 300 };
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    tiles.forEach((tile) => {
      const pos = tilePositions.get(tile.id);
      if (pos) {
        minX = Math.min(minX, pos.x - hexSize);
        minY = Math.min(minY, pos.y - hexSize);
        maxX = Math.max(maxX, pos.x + hexSize);
        maxY = Math.max(maxY, pos.y + hexSize);
      }
    });

    const padding = hexSize;
    return {
      minX: minX - padding,
      minY: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  }, [tiles, tilePositions, hexSize]);

  // Get tile by ID
  const getTileById = useCallback(
    (id: string) => tiles.find((t) => t.id === id),
    [tiles],
  );

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
        "hex-grid",
        effectivePanZoom && "touch-none",
        isDragging && "cursor-grabbing",
        effectivePanZoom && !isDragging && "cursor-grab",
        className,
      )}
      {...bind()}
      role="img"
      aria-label="Hex grid game board"
    >
      <defs>
        {/* Gradient for ocean tiles */}
        <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        {/* Drop shadow filter */}
        <filter id="hexShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Tiles layer */}
      <g className="tiles" role="list" aria-label="Hex tiles">
        {tiles.map((tile) => {
          const pos = tilePositions.get(tile.id);
          if (!pos) return null;

          return (
            <g
              key={tile.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              role="listitem"
              aria-label={tile.label ?? `Tile ${tile.id}`}
            >
              {renderTile(tile)}
            </g>
          );
        })}
      </g>

      {/* Edges layer (for roads) */}
      {edges.length > 0 && (
        <g className="edges" role="list" aria-label="Hex edges">
          {edges.map((edge) => {
            const hex1 = getTileById(edge.hex1);
            const hex2 = getTileById(edge.hex2);
            if (!hex1 || !hex2) return null;

            const pos1 = tilePositions.get(edge.hex1);
            const pos2 = tilePositions.get(edge.hex2);
            if (!pos1 || !pos2) return null;

            const edgePos = hexUtils.getEdgePosition(pos1, pos2, hexSize);

            return (
              <g key={edge.id} role="listitem">
                {renderEdge(edge, edgePos)}
              </g>
            );
          })}
        </g>
      )}

      {/* Vertices layer (for settlements) */}
      {vertices.length > 0 && (
        <g className="vertices" role="list" aria-label="Hex vertices">
          {vertices.map((vertex) => {
            const pos0 = tilePositions.get(vertex.hexes[0]);
            const pos1 = tilePositions.get(vertex.hexes[1]);
            const pos2 = tilePositions.get(vertex.hexes[2]);

            if (!pos0 || !pos1 || !pos2) return null;

            const pos = hexUtils.getVertexPosition(pos0, pos1, pos2);

            return (
              <g key={vertex.id} role="listitem">
                {renderVertex(vertex, pos)}
              </g>
            );
          })}
        </g>
      )}

      {/* Interactive edges layer (for road placement) */}
      {interactiveEdges && generatedEdges.length > 0 && (
        <g
          className="interactive-edges"
          role="list"
          aria-label="Interactive edges for placement"
        >
          {generatedEdges.map((edge) => {
            const isHovered = hoveredEdgeId === edge.id;
            return (
              <g
                key={edge.id}
                role="listitem"
                className="cursor-pointer"
                onPointerEnter={() => handleEdgeEnter(edge)}
                onPointerLeave={() => handleEdgeLeave(edge)}
                onClick={() => handleEdgeClick(edge)}
              >
                {/* Invisible touch target */}
                <line
                  x1={edge.position.x1}
                  y1={edge.position.y1}
                  x2={edge.position.x2}
                  y2={edge.position.y2}
                  stroke="transparent"
                  strokeWidth={interactiveEdgeSize * 2}
                  strokeLinecap="round"
                />
                {/* Visible edge */}
                {renderInteractiveEdge ? (
                  renderInteractiveEdge(edge, isHovered)
                ) : (
                  <DefaultInteractiveEdge
                    edge={edge}
                    isHovered={isHovered}
                    strokeWidth={interactiveEdgeSize * 0.6}
                  />
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* Interactive vertices layer (for settlement placement) */}
      {interactiveVertices && generatedVertices.length > 0 && (
        <g
          className="interactive-vertices"
          role="list"
          aria-label="Interactive vertices for placement"
        >
          {generatedVertices.map((vertex) => {
            const isHovered = hoveredVertexId === vertex.id;
            return (
              <g
                key={vertex.id}
                role="listitem"
                className="cursor-pointer"
                onPointerEnter={() => handleVertexEnter(vertex)}
                onPointerLeave={() => handleVertexLeave(vertex)}
                onClick={() => handleVertexClick(vertex)}
              >
                {/* Invisible touch target */}
                <circle
                  cx={vertex.position.x}
                  cy={vertex.position.y}
                  r={interactiveVertexSize * 1.5}
                  fill="transparent"
                />
                {/* Visible vertex */}
                {renderInteractiveVertex ? (
                  renderInteractiveVertex(vertex, isHovered)
                ) : (
                  <DefaultInteractiveVertex
                    vertex={vertex}
                    isHovered={isHovered}
                    size={interactiveVertexSize * 0.6}
                  />
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* Zoom indicator (for mobile) */}
      {effectivePanZoom && transform.zoom !== 1 && (
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
