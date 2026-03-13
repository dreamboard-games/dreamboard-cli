/**
 * TrackBoard component - Linear/circular track visualization for racing games
 *
 * Design Philosophy: "Progressive Journey"
 * - SVG-based track/path rendering
 * - Support for linear, circular, and branching tracks
 * - Jump connections (snakes & ladders)
 * - Piece movement along track
 * - Required render functions for full customization
 *
 * Use cases: Monopoly, Game of Life, racing games, Snakes & Ladders
 *
 * @example Basic usage with helper components
 * ```tsx
 * <TrackBoard
 *   spaces={spaces}
 *   pieces={pieces}
 *   type="circular"
 *   width={560}
 *   height={560}
 *   renderSpace={(space, spacePieces) => (
 *     <DefaultTrackSpace
 *       space={space}
 *       size={45}
 *       onClick={() => handleSpaceClick(space.id)}
 *     >
 *       {spacePieces.map((piece, i) => (
 *         <DefaultTrackPiece
 *           key={piece.id}
 *           piece={piece}
 *           index={i}
 *           total={spacePieces.length}
 *           color={playerColors[piece.owner]}
 *           onClick={() => handlePieceClick(piece.id)}
 *         />
 *       ))}
 *     </DefaultTrackSpace>
 *   )}
 *   renderConnection={(from, to) => (
 *     <DefaultTrackConnection from={from} to={to} />
 *   )}
 * />
 * ```
 */

import { useMemo, type ReactNode } from "react";
import { clsx } from "clsx";
import { usePanZoom } from "../../hooks/usePanZoom.js";

export interface TrackSpace {
  /** Unique space identifier */
  id: string;
  /** Position on track (0-indexed) */
  index: number;
  /** Display name */
  name?: string;
  /** Space type for rendering */
  type?: string;
  /** Override next spaces (for branching) */
  nextSpaces?: string[];
  /** Jump to another space (snakes/ladders) */
  jumpTo?: string;
  /** Position for rendering */
  position: { x: number; y: number };
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface TrackPiece {
  /** Unique piece identifier */
  id: string;
  /** Space ID where piece is located */
  spaceId: string;
  /** Owner player ID */
  owner: string;
  /** Piece type for rendering */
  type?: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface TrackBoardProps {
  /** Track spaces */
  spaces: TrackSpace[];
  /** Pieces on the track */
  pieces: TrackPiece[];
  /** Track type (affects connection rendering for circular tracks) */
  type?: "linear" | "circular" | "branching";
  /** Required space renderer - receives space data and pieces on that space */
  renderSpace: (space: TrackSpace, pieces: TrackPiece[]) => ReactNode;
  /** Optional connection renderer - receives from/to positions */
  renderConnection?: (
    from: { x: number; y: number },
    to: { x: number; y: number },
    fromSpace: TrackSpace,
    toSpace: TrackSpace,
  ) => ReactNode;
  /** Optional jump renderer - receives from/to positions and direction */
  renderJump?: (
    from: { x: number; y: number },
    to: { x: number; y: number },
    fromSpace: TrackSpace,
    toSpace: TrackSpace,
    isUp: boolean,
  ) => ReactNode;
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

export interface DefaultTrackSpaceProps {
  /** The space data */
  space: TrackSpace;
  /** Size of the space (width and height) */
  size?: number;
  /** Fill color */
  fill?: string;
  /** Stroke color */
  stroke?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Whether the space is highlighted */
  isHighlighted?: boolean;
  /** Whether the space is selected */
  isSelected?: boolean;
  /** Whether to show jump indicator */
  showJumpIndicator?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Hover handler */
  onHover?: (hovering: boolean) => void;
  /** Custom className */
  className?: string;
  /** Children (pieces rendered on this space) */
  children?: ReactNode;
}

/**
 * Default track space renderer - renders a rounded rectangle with optional name/index
 */
export function DefaultTrackSpace({
  space,
  size = 50,
  fill = "#1e293b",
  stroke = "#475569",
  strokeWidth = 1,
  isHighlighted = false,
  isSelected = false,
  showJumpIndicator = true,
  onClick,
  onHover,
  className,
  children,
}: DefaultTrackSpaceProps) {
  const halfSize = size / 2;

  const computedFill = isHighlighted ? "rgba(59, 130, 246, 0.3)" : fill;
  const computedStroke = isSelected
    ? "#3b82f6"
    : isHighlighted
      ? "#60a5fa"
      : stroke;
  const computedStrokeWidth = isHighlighted || isSelected ? 3 : strokeWidth;

  return (
    <g
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={clsx(onClick && "cursor-pointer", className)}
      role="listitem"
      aria-label={space.name || `Space ${space.index}`}
    >
      {/* Space background */}
      <rect
        x={-halfSize}
        y={-halfSize}
        width={size}
        height={size}
        rx={8}
        fill={computedFill}
        stroke={computedStroke}
        strokeWidth={computedStrokeWidth}
      />

      {/* Space name or index */}
      {space.name ? (
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={space.name.length > 4 ? 8 : 10}
          fontWeight="bold"
        >
          {space.name.length > 8 ? space.name.slice(0, 7) + "…" : space.name}
        </text>
      ) : (
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#94a3b8"
          fontSize={12}
          fontWeight="bold"
        >
          {space.index}
        </text>
      )}

      {/* Jump indicator */}
      {showJumpIndicator && space.jumpTo && (
        <g transform={`translate(${halfSize - 6}, ${-halfSize + 6})`}>
          <circle r={6} fill="#fbbf24" />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="black"
            fontSize={8}
            fontWeight="bold"
          >
            ↗
          </text>
        </g>
      )}

      {/* Pieces */}
      {children}
    </g>
  );
}

export interface DefaultTrackPieceProps {
  /** The piece data */
  piece: TrackPiece;
  /** Piece index (for positioning multiple pieces) */
  index?: number;
  /** Total pieces on this space (for positioning) */
  total?: number;
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
 * Default track piece renderer - renders a colored circle
 */
export function DefaultTrackPiece({
  piece,
  index = 0,
  total = 1,
  radius = 8,
  color = "#f59e0b",
  onClick,
  className,
}: DefaultTrackPieceProps) {
  // Arrange pieces in a circle around the space center
  const spacing = radius * 2.2;
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const offset = total > 1 ? spacing : 0;
  const px = Math.cos(angle) * offset;
  const py = Math.sin(angle) * offset;

  return (
    <circle
      cx={px}
      cy={py}
      r={radius}
      fill={color}
      stroke="white"
      strokeWidth={2}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={clsx(onClick && "cursor-pointer", className)}
      aria-label={`Piece ${piece.id} owned by ${piece.owner}`}
    />
  );
}

export interface DefaultTrackConnectionProps {
  /** Start position */
  from: { x: number; y: number };
  /** End position */
  to: { x: number; y: number };
  /** Stroke color */
  stroke?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Custom className */
  className?: string;
}

/**
 * Default track connection renderer - renders a line between spaces
 */
export function DefaultTrackConnection({
  from,
  to,
  stroke = "#475569",
  strokeWidth = 2,
  className,
}: DefaultTrackConnectionProps) {
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
    />
  );
}

export interface DefaultTrackJumpProps {
  /** Start position */
  from: { x: number; y: number };
  /** End position */
  to: { x: number; y: number };
  /** Whether the jump goes up (forward) or down (backward) */
  isUp: boolean;
  /** Space size for offset calculation */
  spaceSize?: number;
  /** Custom up color */
  upColor?: string;
  /** Custom down color */
  downColor?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Custom className */
  className?: string;
}

/**
 * Default track jump renderer - renders a dashed arrow for snakes/ladders
 */
export function DefaultTrackJump({
  from,
  to,
  isUp,
  spaceSize = 50,
  upColor = "#22c55e",
  downColor = "#ef4444",
  strokeWidth = 3,
  className,
}: DefaultTrackJumpProps) {
  const color = isUp ? upColor : downColor;

  // Calculate arrow direction
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const unitX = dx / len;
  const unitY = dy / len;

  // Offset start and end points
  const startX = from.x + unitX * (spaceSize / 2 + 5);
  const startY = from.y + unitY * (spaceSize / 2 + 5);
  const endX = to.x - unitX * (spaceSize / 2 + 5);
  const endY = to.y - unitY * (spaceSize / 2 + 5);

  // Generate unique marker IDs
  const markerId = `arrow-${isUp ? "up" : "down"}-${from.x}-${from.y}`;

  return (
    <g className={className}>
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
      </defs>
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray="6,4"
        markerEnd={`url(#${markerId})`}
      />
    </g>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * TrackBoard component for track-based and racing games
 *
 * Features:
 * - Multiple track types (linear, circular, branching)
 * - Required render functions for full customization
 * - Pan and zoom with @use-gesture
 * - Helper components for common rendering patterns
 */
export function TrackBoard({
  spaces,
  pieces,
  type = "linear",
  renderSpace,
  renderConnection,
  renderJump,
  width = 800,
  height = 600,
  enablePanZoom = false,
  initialZoom = 1,
  minZoom = 0.5,
  maxZoom = 3,
  className,
}: TrackBoardProps) {
  // Use the unified pan/zoom hook
  const { transform, bind, isDragging } = usePanZoom({
    enabled: enablePanZoom,
    initialZoom,
    minZoom,
    maxZoom,
    mode: "viewbox",
  });

  // Group pieces by space
  const piecesBySpace = useMemo(() => {
    const map: Record<string, TrackPiece[]> = {};
    pieces.forEach((p) => {
      const existing = map[p.spaceId];
      if (existing) {
        existing.push(p);
      } else {
        map[p.spaceId] = [p];
      }
    });
    return map;
  }, [pieces]);

  // Sort spaces by index for drawing connections
  const sortedSpaces = useMemo(() => {
    return [...spaces].sort((a, b) => a.index - b.index);
  }, [spaces]);

  // Create space lookup
  const spaceMap = useMemo(() => {
    return new Map(spaces.map((s) => [s.id, s]));
  }, [spaces]);

  // Render connections between spaces
  const renderConnections = () => {
    if (!renderConnection) return null;

    return sortedSpaces.map((space, i) => {
      const nextSpace = sortedSpaces[i + 1];
      const firstSpace = sortedSpaces[0];
      const nextSpaceIds =
        space.nextSpaces ||
        (i < sortedSpaces.length - 1 && nextSpace
          ? [nextSpace.id]
          : type === "circular" && firstSpace
            ? [firstSpace.id]
            : []);

      return nextSpaceIds.map((nextId) => {
        const targetSpace = spaceMap.get(nextId);
        if (!targetSpace) return null;

        return (
          <g key={`${space.id}-${nextId}`}>
            {renderConnection(
              space.position,
              targetSpace.position,
              space,
              targetSpace,
            )}
          </g>
        );
      });
    });
  };

  // Render jump arrows (snakes/ladders)
  const renderJumps = () => {
    if (!renderJump) return null;

    return spaces
      .filter((s): s is TrackSpace & { jumpTo: string } => !!s.jumpTo)
      .map((space) => {
        const targetSpace = spaceMap.get(space.jumpTo);
        if (!targetSpace) return null;

        const isUp = targetSpace.index > space.index;

        return (
          <g key={`jump-${space.id}`}>
            {renderJump(
              space.position,
              targetSpace.position,
              space,
              targetSpace,
              isUp,
            )}
          </g>
        );
      });
  };

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
      aria-label="Track board"
    >
      {/* Connections layer */}
      <g className="track-connections">{renderConnections()}</g>

      {/* Jump arrows layer */}
      <g className="track-jumps">{renderJumps()}</g>

      {/* Spaces layer */}
      <g className="track-spaces" role="list" aria-label="Track spaces">
        {spaces.map((space) => {
          const spacePieces = piecesBySpace[space.id] || [];

          return (
            <g
              key={space.id}
              transform={`translate(${space.position.x}, ${space.position.y})`}
            >
              {renderSpace(space, spacePieces)}
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
