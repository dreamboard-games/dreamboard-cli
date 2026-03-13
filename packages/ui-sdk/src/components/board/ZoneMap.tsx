/**
 * ZoneMap component - Area control visualization for territory games
 *
 * Design Philosophy: "Territorial Conquest"
 * - SVG-based zone/area rendering
 * - Support for polygon, path, and circle shapes
 * - Piece/army placement within zones
 * - Required render functions for full customization
 *
 * Use cases: Risk, Small World, El Grande, Diplomacy
 *
 * @example Basic usage with helper components
 * ```tsx
 * <ZoneMap
 *   zones={zones}
 *   pieces={pieces}
 *   width={600}
 *   height={450}
 *   renderZone={(zone, zonePieces) => (
 *     <DefaultZone
 *       zone={zone}
 *       isHighlighted={highlightedZones.has(zone.id)}
 *       isSelected={selectedZone === zone.id}
 *       onClick={() => handleZoneClick(zone.id)}
 *     >
 *       <DefaultZonePieces
 *         pieces={zonePieces}
 *         zone={zone}
 *         playerColors={playerColors}
 *       />
 *     </DefaultZone>
 *   )}
 * />
 * ```
 */

import { useMemo, type ReactNode } from "react";
import { clsx } from "clsx";
import { usePanZoom } from "../../hooks/usePanZoom.js";

export interface ZoneShape {
  /** Shape type */
  type: "polygon" | "path" | "circle";
  /** Points for polygon shape */
  points?: Array<{ x: number; y: number }>;
  /** SVG path data for path shape */
  path?: string;
  /** Center point (for circle or label placement) */
  center?: { x: number; y: number };
  /** Radius for circle shape */
  radius?: number;
}

export interface ZoneDefinition {
  /** Unique zone identifier */
  id: string;
  /** Display name */
  name: string;
  /** Adjacent zone IDs */
  adjacentTo: string[];
  /** Shape definition for rendering */
  shape?: ZoneShape;
  /** Base value of the zone */
  value?: number;
  /** Zone type/terrain */
  type?: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface ZonePiece {
  /** Unique piece identifier */
  id: string;
  /** Zone ID where piece is located */
  zoneId: string;
  /** Piece type */
  type: string;
  /** Owner player ID */
  owner?: string;
  /** Count for stackable pieces (armies) */
  count?: number;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface ZoneMapProps {
  /** Zone definitions */
  zones: ZoneDefinition[];
  /** Pieces in zones */
  pieces: ZonePiece[];
  /** Required zone renderer - receives zone data and pieces in that zone */
  renderZone: (zone: ZoneDefinition, pieces: ZonePiece[]) => ReactNode;
  /** Background image URL */
  backgroundImage?: string;
  /** Container width (use "100%" for responsive) */
  width?: number | string;
  /** Container height (use "100%" for responsive) */
  height?: number | string;
  /** Enable pan and zoom */
  enablePanZoom?: boolean;
  /** Initial zoom level */
  initialZoom?: number;
  /** Min zoom level */
  minZoom?: number;
  /** Max zoom level */
  maxZoom?: number;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

export type ZoneHighlightType =
  | "valid"
  | "selected"
  | "attack"
  | "defend"
  | "neutral";

// Highlight colors by type
const HIGHLIGHT_COLORS: Record<ZoneHighlightType, string> = {
  valid: "rgba(34, 197, 94, 0.4)", // Green
  selected: "rgba(59, 130, 246, 0.4)", // Blue
  attack: "rgba(239, 68, 68, 0.4)", // Red
  defend: "rgba(234, 179, 8, 0.4)", // Yellow
  neutral: "rgba(148, 163, 184, 0.4)", // Slate
};

const HIGHLIGHT_STROKES: Record<ZoneHighlightType, string> = {
  valid: "#22c55e",
  selected: "#3b82f6",
  attack: "#ef4444",
  defend: "#eab308",
  neutral: "#94a3b8",
};

export interface DefaultZoneProps {
  /** The zone data */
  zone: ZoneDefinition;
  /** Fill color (overridden by highlight) */
  fill?: string;
  /** Stroke color (overridden by highlight/selection) */
  stroke?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Whether the zone is highlighted */
  isHighlighted?: boolean;
  /** Highlight type for different styling */
  highlightType?: ZoneHighlightType;
  /** Whether the zone is selected */
  isSelected?: boolean;
  /** Whether to show the zone label */
  showLabel?: boolean;
  /** Whether to show the zone value */
  showValue?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Hover handler */
  onHover?: (hovering: boolean) => void;
  /** Custom className */
  className?: string;
  /** Children (pieces rendered in this zone) */
  children?: ReactNode;
}

/**
 * Default zone renderer - renders the zone shape with optional label and value
 */
export function DefaultZone({
  zone,
  fill = "rgba(100, 116, 139, 0.2)",
  stroke = "#475569",
  strokeWidth = 1,
  isHighlighted = false,
  highlightType,
  isSelected = false,
  showLabel = true,
  showValue = false,
  onClick,
  onHover,
  className,
  children,
}: DefaultZoneProps) {
  // Calculate colors based on state
  let computedFill = fill;
  let computedStroke = stroke;
  let computedStrokeWidth = strokeWidth;

  if (isHighlighted && highlightType && HIGHLIGHT_COLORS[highlightType]) {
    computedFill = HIGHLIGHT_COLORS[highlightType];
    computedStroke = HIGHLIGHT_STROKES[highlightType];
    computedStrokeWidth = 3;
  } else if (isSelected) {
    computedFill = HIGHLIGHT_COLORS.selected;
    computedStroke = HIGHLIGHT_STROKES.selected;
    computedStrokeWidth = 3;
  }

  // Render zone shape
  const renderShape = () => {
    if (!zone.shape) return null;

    switch (zone.shape.type) {
      case "polygon":
        if (!zone.shape.points) return null;
        return (
          <polygon
            points={zone.shape.points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill={computedFill}
            stroke={computedStroke}
            strokeWidth={computedStrokeWidth}
          />
        );

      case "path":
        if (!zone.shape.path) return null;
        return (
          <path
            d={zone.shape.path}
            fill={computedFill}
            stroke={computedStroke}
            strokeWidth={computedStrokeWidth}
          />
        );

      case "circle":
        if (!zone.shape.center) return null;
        return (
          <circle
            cx={zone.shape.center.x}
            cy={zone.shape.center.y}
            r={zone.shape.radius || 30}
            fill={computedFill}
            stroke={computedStroke}
            strokeWidth={computedStrokeWidth}
          />
        );

      default:
        return null;
    }
  };

  return (
    <g
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={clsx(onClick && "cursor-pointer", className)}
      role="listitem"
      aria-label={zone.name}
    >
      {/* Zone shape */}
      {renderShape()}

      {/* Zone label */}
      {showLabel && zone.shape?.center && (
        <text
          x={zone.shape.center.x}
          y={zone.shape.center.y - (showValue ? 8 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={12}
          fontWeight="bold"
          style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
        >
          {zone.name}
        </text>
      )}

      {/* Zone value */}
      {showValue && zone.value !== undefined && zone.shape?.center && (
        <text
          x={zone.shape.center.x}
          y={zone.shape.center.y + 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fbbf24"
          fontSize={10}
          fontWeight="bold"
          style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
        >
          +{zone.value}
        </text>
      )}

      {/* Children (pieces) */}
      {children}
    </g>
  );
}

export interface DefaultZonePiecesProps {
  /** Pieces in the zone */
  pieces: ZonePiece[];
  /** The zone (for positioning) */
  zone: ZoneDefinition;
  /** Player colors map */
  playerColors?: Record<string, string>;
  /** Piece radius */
  radius?: number;
  /** Spacing between pieces */
  spacing?: number;
  /** Y offset from zone center */
  yOffset?: number;
  /** Custom className */
  className?: string;
}

/**
 * Default zone pieces renderer - renders piece counts grouped by owner
 */
export function DefaultZonePieces({
  pieces,
  zone,
  playerColors = {},
  radius = 14,
  spacing = 25,
  yOffset = 20,
  className,
}: DefaultZonePiecesProps) {
  if (pieces.length === 0 || !zone.shape?.center) return null;

  const centerX = zone.shape.center.x;
  const centerY = zone.shape.center.y;

  // Group pieces by owner
  const piecesByOwner: Record<string, ZonePiece[]> = {};
  pieces.forEach((p) => {
    const owner = p.owner || "neutral";
    const existing = piecesByOwner[owner];
    if (existing) {
      existing.push(p);
    } else {
      piecesByOwner[owner] = [p];
    }
  });

  const owners = Object.keys(piecesByOwner);
  const startOffset = -((owners.length - 1) * spacing) / 2;

  return (
    <g className={clsx("zone-pieces", className)}>
      {owners.map((owner, i) => {
        const ownerPieces = piecesByOwner[owner] || [];
        const totalCount = ownerPieces.reduce(
          (sum, p) => sum + (p.count || 1),
          0,
        );
        const offsetX = startOffset + i * spacing;

        return (
          <g
            key={owner}
            transform={`translate(${centerX + offsetX}, ${centerY + yOffset})`}
          >
            {/* Piece circle */}
            <circle
              r={radius}
              fill={playerColors[owner] || "#64748b"}
              stroke="white"
              strokeWidth={2}
            />
            {/* Count */}
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={10}
              fontWeight="bold"
            >
              {totalCount}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export interface DefaultZonePieceProps {
  /** The piece data */
  piece: ZonePiece;
  /** X position relative to zone center */
  x?: number;
  /** Y position relative to zone center */
  y?: number;
  /** Piece radius */
  radius?: number;
  /** Piece color */
  color?: string;
  /** Click handler */
  onClick?: () => void;
  /** Custom className */
  className?: string;
}

/**
 * Default single zone piece renderer - for custom piece positioning
 */
export function DefaultZonePiece({
  piece,
  x = 0,
  y = 0,
  radius = 14,
  color = "#64748b",
  onClick,
  className,
}: DefaultZonePieceProps) {
  const count = piece.count || 1;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={clsx(onClick && "cursor-pointer", className)}
    >
      <circle r={radius} fill={color} stroke="white" strokeWidth={2} />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={10}
        fontWeight="bold"
      >
        {count}
      </text>
    </g>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ZoneMap component for area control games
 *
 * Features:
 * - Multiple shape types (polygon, path, circle)
 * - Required render functions for full customization
 * - Pan and zoom with @use-gesture
 * - Helper components for common rendering patterns
 */
export function ZoneMap({
  zones,
  pieces,
  renderZone,
  backgroundImage,
  width = 800,
  height = 600,
  enablePanZoom = false,
  initialZoom = 1,
  minZoom = 0.5,
  maxZoom = 3,
  className,
}: ZoneMapProps) {
  // Use the unified pan/zoom hook
  const { transform, bind, isDragging } = usePanZoom({
    enabled: enablePanZoom,
    initialZoom,
    minZoom,
    maxZoom,
    mode: "viewbox",
  });

  // Group pieces by zone
  const piecesByZone = useMemo(() => {
    const map: Record<string, ZonePiece[]> = {};
    pieces.forEach((p) => {
      const existing = map[p.zoneId];
      if (existing) {
        existing.push(p);
      } else {
        map[p.zoneId] = [p];
      }
    });
    return map;
  }, [pieces]);

  // Calculate viewBox dimensions
  const baseWidth = typeof width === "number" ? width : 800;
  const baseHeight = typeof height === "number" ? height : 600;
  const viewBoxWidth = baseWidth / transform.zoom;
  const viewBoxHeight = baseHeight / transform.zoom;
  const viewBoxX = (baseWidth - viewBoxWidth) / 2 - transform.pan.x;
  const viewBoxY = (baseHeight - viewBoxHeight) / 2 - transform.pan.y;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
      className={clsx(
        "overflow-visible",
        enablePanZoom && "touch-none",
        isDragging && "cursor-grabbing",
        enablePanZoom && !isDragging && "cursor-grab",
        className,
      )}
      {...bind()}
      role="img"
      aria-label="Zone map"
    >
      {/* Background image */}
      {backgroundImage && (
        <image href={backgroundImage} width={width} height={height} />
      )}

      {/* Zones */}
      <g className="zones" role="list" aria-label="Map zones">
        {zones.map((zone) => {
          const zonePieces = piecesByZone[zone.id] || [];
          return <g key={zone.id}>{renderZone(zone, zonePieces)}</g>;
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
