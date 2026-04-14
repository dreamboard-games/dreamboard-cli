/**
 * SVG-based square grid for grid-based games (Chess, Checkers, Go, Scrabble, Battleship).
 * All rendering controlled by parent via required render functions.
 */

import { useMemo, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { usePanZoom } from "../../hooks/usePanZoom.js";

// ============================================================================
// Types
// ============================================================================

export interface GridCell {
  id?: string;
  row: number;
  col: number;
  label?: string;
  type?: string;
  data?: Record<string, unknown>;
}

type ResolvedCell = GridCell & { id: string };

export interface GridPiece {
  id: string;
  row: number;
  col: number;
  type: string;
  owner?: string;
  data?: Record<string, unknown>;
}

export interface SquareGridEdge {
  id: string;
  spaceIds: string[];
  type?: string;
  owner?: string;
  label?: string;
  data?: Record<string, unknown>;
}

export interface SquareGridVertex {
  id: string;
  spaceIds: string[];
  type?: string;
  owner?: string;
  label?: string;
  data?: Record<string, unknown>;
}

export interface SquareEdgePosition {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  midX: number;
  midY: number;
  angle: number;
}

export interface SquareVertexPosition {
  x: number;
  y: number;
}

export interface InteractiveSquareEdge {
  id: string;
  spaceIds: string[];
  position: SquareEdgePosition;
}

export interface InteractiveSquareVertex {
  id: string;
  spaceIds: string[];
  position: SquareVertexPosition;
}

export interface SquareGridProps {
  rows: number;
  cols: number;
  cells?: GridCell[];
  pieces: GridPiece[];
  edges?: SquareGridEdge[];
  vertices?: SquareGridVertex[];
  cellSize?: number;
  /** Receives row/col with transform centered at cell position */
  renderCell: (row: number, col: number) => ReactNode;
  /** Receives piece with transform centered at cell center */
  renderPiece: (piece: GridPiece) => ReactNode;
  renderEdge?: (
    edge: SquareGridEdge,
    position: SquareEdgePosition,
  ) => ReactNode;
  renderVertex?: (
    vertex: SquareGridVertex,
    position: SquareVertexPosition,
  ) => ReactNode;
  showCoordinates?: boolean;
  coordinateStyle?: "algebraic" | "numeric" | "none";
  width?: number | string;
  height?: number | string;
  enablePanZoom?: boolean;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
  interactiveEdges?: boolean;
  interactiveVertices?: boolean;
  onInteractiveEdgeClick?: (edge: InteractiveSquareEdge) => void;
  onInteractiveEdgeEnter?: (edge: InteractiveSquareEdge) => void;
  onInteractiveEdgeLeave?: (edge: InteractiveSquareEdge) => void;
  onInteractiveVertexClick?: (vertex: InteractiveSquareVertex) => void;
  onInteractiveVertexEnter?: (vertex: InteractiveSquareVertex) => void;
  onInteractiveVertexLeave?: (vertex: InteractiveSquareVertex) => void;
  renderInteractiveEdge?: (
    edge: InteractiveSquareEdge,
    isHovered: boolean,
  ) => ReactNode;
  renderInteractiveVertex?: (
    vertex: InteractiveSquareVertex,
    isHovered: boolean,
  ) => ReactNode;
}

// ============================================================================
// Pre-built Helper Components
// ============================================================================

export interface DefaultGridCellProps {
  size: number;
  isLight?: boolean;
  lightColor?: string;
  darkColor?: string;
  isHighlighted?: boolean;
  highlightColor?: string;
  isSelected?: boolean;
  selectedColor?: string;
  isValidMove?: boolean;
  isCapture?: boolean;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  className?: string;
}

/** Pre-built grid cell component for use in `renderCell`. */
export function DefaultGridCell({
  size,
  isLight = true,
  lightColor = "#f0d9b5",
  darkColor = "#b58863",
  isHighlighted = false,
  highlightColor = "rgba(250, 204, 21, 0.4)",
  isSelected = false,
  selectedColor = "rgba(59, 130, 246, 0.5)",
  isValidMove = false,
  isCapture = false,
  onClick,
  onPointerEnter,
  onPointerLeave,
  className,
}: DefaultGridCellProps) {
  const baseColor = isLight ? lightColor : darkColor;

  return (
    <g
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={clsx(
        "transition-colors duration-100",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {/* Base cell */}
      <rect width={size} height={size} fill={baseColor} />

      {/* Selected overlay */}
      {isSelected && (
        <rect
          width={size}
          height={size}
          fill={selectedColor}
          pointerEvents="none"
        />
      )}

      {/* Highlight overlay */}
      {isHighlighted && !isSelected && (
        <rect
          width={size}
          height={size}
          fill={highlightColor}
          pointerEvents="none"
        />
      )}

      {/* Valid move indicator (dot) */}
      {isValidMove && !isCapture && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.15}
          fill="rgba(34, 197, 94, 0.6)"
          pointerEvents="none"
        />
      )}

      {/* Capture indicator (ring) */}
      {isCapture && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.42}
          fill="none"
          stroke="rgba(239, 68, 68, 0.8)"
          strokeWidth={size * 0.08}
          pointerEvents="none"
        />
      )}
    </g>
  );
}

export interface DefaultGridPieceProps {
  size: number;
  color?: string;
  strokeColor?: string;
  label?: string;
  isDragging?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  className?: string;
}

/** Pre-built grid piece component for use in `renderPiece`. */
export function DefaultGridPiece({
  size,
  color = "#94a3b8",
  strokeColor,
  label,
  isDragging = false,
  onClick,
  onPointerDown,
  className,
}: DefaultGridPieceProps) {
  const radius = size * 0.38;
  const effectiveStroke =
    strokeColor ??
    (color === "#f8fafc" || color === "#ffffff" ? "#1e293b" : "#f8fafc");

  return (
    <g
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={clsx(
        "transition-transform duration-150",
        (onClick || onPointerDown) && "cursor-pointer hover:scale-105",
        className,
      )}
      opacity={isDragging ? 0.8 : 1}
    >
      <circle
        r={isDragging ? radius * 1.1 : radius}
        fill={color}
        stroke={effectiveStroke}
        strokeWidth={2}
        style={{ filter: "drop-shadow(1px 2px 2px rgba(0,0,0,0.4))" }}
      />
      {label && (
        <text
          y={4}
          textAnchor="middle"
          fill={effectiveStroke}
          fontSize={size * 0.35}
          fontWeight="bold"
          pointerEvents="none"
        >
          {label}
        </text>
      )}
    </g>
  );
}

export interface DefaultChessPieceProps {
  size: number;
  type: string;
  owner: "white" | "black";
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  className?: string;
}

const CHESS_SYMBOLS: Record<string, Record<string, string>> = {
  white: {
    king: "♔",
    queen: "♕",
    rook: "♖",
    bishop: "♗",
    knight: "♘",
    pawn: "♙",
  },
  black: {
    king: "♚",
    queen: "♛",
    rook: "♜",
    bishop: "♝",
    knight: "♞",
    pawn: "♟",
  },
};

/** Pre-built chess piece component using Unicode symbols. */
export function DefaultChessPiece({
  size,
  type,
  owner,
  onClick,
  onPointerDown,
  className,
}: DefaultChessPieceProps) {
  const symbol = CHESS_SYMBOLS[owner]?.[type] ?? "?";
  const textColor = owner === "white" ? "#f8fafc" : "#1e293b";
  const shadowFilter =
    owner === "white"
      ? "drop-shadow(1px 1px 1px rgba(0,0,0,0.5))"
      : "drop-shadow(1px 1px 1px rgba(255,255,255,0.3))";

  return (
    <g
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={clsx(
        (onClick || onPointerDown) && "cursor-pointer",
        className,
      )}
    >
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.7}
        fill={textColor}
        style={{ filter: shadowFilter }}
      >
        {symbol}
      </text>
    </g>
  );
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Convert row/col to algebraic notation (a1, b2, etc.)
 */
export function toAlgebraic(
  row: number,
  col: number,
  totalRows: number,
): string {
  const file = String.fromCharCode(97 + col); // a, b, c, ...
  const rank = totalRows - row; // 8, 7, 6, ... (bottom to top)
  return `${file}${rank}`;
}

/**
 * Convert row/col to numeric notation (1,1, 2,3, etc.)
 */
export function toNumeric(row: number, col: number): string {
  return `${row + 1},${col + 1}`;
}

function getCellId(cell: GridCell): string {
  return cell.id ?? `${cell.row},${cell.col}`;
}

function edgePositionForCells(
  firstCell: GridCell,
  secondCell: GridCell,
  cellSize: number,
  labelMargin: number,
): SquareEdgePosition | null {
  if (
    Math.abs(firstCell.row - secondCell.row) +
      Math.abs(firstCell.col - secondCell.col) !==
    1
  ) {
    return null;
  }

  const minRow = Math.min(firstCell.row, secondCell.row);
  const minCol = Math.min(firstCell.col, secondCell.col);

  if (firstCell.row === secondCell.row) {
    const x = labelMargin + (minCol + 1) * cellSize;
    const y1 = minRow * cellSize;
    const y2 = y1 + cellSize;
    return {
      x1: x,
      y1,
      x2: x,
      y2,
      midX: x,
      midY: (y1 + y2) / 2,
      angle: 90,
    };
  }

  const y = (minRow + 1) * cellSize;
  const x1 = labelMargin + minCol * cellSize;
  const x2 = x1 + cellSize;
  return {
    x1,
    y1: y,
    x2,
    y2: y,
    midX: (x1 + x2) / 2,
    midY: y,
    angle: 0,
  };
}

function edgePositionForSide(
  cell: GridCell,
  side: "north" | "east" | "south" | "west",
  cellSize: number,
  labelMargin: number,
): SquareEdgePosition {
  const x = labelMargin + cell.col * cellSize;
  const y = cell.row * cellSize;

  switch (side) {
    case "north":
      return {
        x1: x,
        y1: y,
        x2: x + cellSize,
        y2: y,
        midX: x + cellSize / 2,
        midY: y,
        angle: 0,
      };
    case "east":
      return {
        x1: x + cellSize,
        y1: y,
        x2: x + cellSize,
        y2: y + cellSize,
        midX: x + cellSize,
        midY: y + cellSize / 2,
        angle: 90,
      };
    case "south":
      return {
        x1: x,
        y1: y + cellSize,
        x2: x + cellSize,
        y2: y + cellSize,
        midX: x + cellSize / 2,
        midY: y + cellSize,
        angle: 0,
      };
    case "west":
      return {
        x1: x,
        y1: y,
        x2: x,
        y2: y + cellSize,
        midX: x,
        midY: y + cellSize / 2,
        angle: 90,
      };
  }
}

function cornerKeysForCell(
  cell: GridCell,
): Record<string, SquareVertexPosition> {
  return {
    [`${cell.col},${cell.row}`]: { x: cell.col, y: cell.row },
    [`${cell.col + 1},${cell.row}`]: { x: cell.col + 1, y: cell.row },
    [`${cell.col + 1},${cell.row + 1}`]: {
      x: cell.col + 1,
      y: cell.row + 1,
    },
    [`${cell.col},${cell.row + 1}`]: { x: cell.col, y: cell.row + 1 },
  };
}

function vertexPositionForCells(
  cells: readonly ResolvedCell[],
  cellSize: number,
  labelMargin: number,
): SquareVertexPosition | null {
  if (cells.length === 0) {
    return null;
  }

  const candidateKeys = cells.map(
    (cell) => new Set(Object.keys(cornerKeysForCell(cell))),
  );
  const sharedKeys = [...candidateKeys[0]!].filter((key) =>
    candidateKeys.every((keySet) => keySet.has(key)),
  );
  if (sharedKeys.length !== 1) {
    return null;
  }

  const sharedKey = sharedKeys[0];
  if (!sharedKey) {
    return null;
  }
  const [colToken, rowToken] = sharedKey.split(",");
  if (colToken == null || rowToken == null) {
    return null;
  }
  const col = Number(colToken);
  const row = Number(rowToken);
  if (!Number.isFinite(col) || !Number.isFinite(row)) {
    return null;
  }

  return {
    x: labelMargin + col * cellSize,
    y: row * cellSize,
  };
}

// ============================================================================
// Component
// ============================================================================

export function SquareGrid({
  rows,
  cols,
  cells: providedCells,
  pieces = [],
  edges = [],
  vertices = [],
  cellSize = 60,
  renderCell,
  renderPiece,
  renderEdge,
  renderVertex,
  showCoordinates = true,
  coordinateStyle = "algebraic",
  width,
  height,
  enablePanZoom = false,
  initialZoom = 1,
  minZoom = 0.5,
  maxZoom = 3,
  className,
  interactiveEdges = false,
  interactiveVertices = false,
  onInteractiveEdgeClick,
  onInteractiveEdgeEnter,
  onInteractiveEdgeLeave,
  onInteractiveVertexClick,
  onInteractiveVertexEnter,
  onInteractiveVertexLeave,
  renderInteractiveEdge,
  renderInteractiveVertex,
}: SquareGridProps) {
  const [hoveredInteractiveEdgeId, setHoveredInteractiveEdgeId] = useState<
    string | null
  >(null);
  const [hoveredInteractiveVertexId, setHoveredInteractiveVertexId] = useState<
    string | null
  >(null);

  // Use the unified pan/zoom hook
  const {
    transform,
    bind,
    isDragging: isPanning,
  } = usePanZoom({
    enabled: enablePanZoom,
    initialZoom,
    minZoom,
    maxZoom,
    mode: "viewbox",
  });

  // Coordinate label margin
  const labelMargin = showCoordinates && coordinateStyle !== "none" ? 24 : 0;

  // Calculate grid dimensions
  const gridWidth = cols * cellSize;
  const gridHeight = rows * cellSize;
  const totalWidth = gridWidth + labelMargin;
  const totalHeight = gridHeight + labelMargin;

  const renderableCells = useMemo(() => {
    const result: Array<{ row: number; col: number }> = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        result.push({ row, col });
      }
    }
    return result;
  }, [rows, cols]);

  const resolvedCells = useMemo<ResolvedCell[]>(() => {
    if (providedCells && providedCells.length > 0) {
      return providedCells.map((cell) => ({
        ...cell,
        id: getCellId(cell),
      }));
    }

    return renderableCells.map(({ row, col }) => ({
      id: `${row},${col}`,
      row,
      col,
    }));
  }, [providedCells, renderableCells]);

  const cellsById = useMemo(
    () => new Map(resolvedCells.map((cell) => [cell.id, cell] as const)),
    [resolvedCells],
  );

  const resolvedEdgePositions = useMemo(
    () =>
      edges
        .map((edge) => {
          if (edge.spaceIds.length < 2) {
            return null;
          }
          const firstCell = cellsById.get(edge.spaceIds[0] ?? "");
          const secondCell = cellsById.get(edge.spaceIds[1] ?? "");
          if (!firstCell || !secondCell) {
            return null;
          }
          const position = edgePositionForCells(
            firstCell,
            secondCell,
            cellSize,
            labelMargin,
          );
          return position ? { edge, position } : null;
        })
        .filter(
          (
            edge,
          ): edge is { edge: SquareGridEdge; position: SquareEdgePosition } =>
            edge != null,
        ),
    [cellSize, cellsById, edges, labelMargin],
  );

  const resolvedVertexPositions = useMemo(
    () =>
      vertices
        .map((vertex) => {
          const vertexCells = vertex.spaceIds
            .map((spaceId) => cellsById.get(spaceId))
            .filter((cell): cell is ResolvedCell => cell != null);
          const position = vertexPositionForCells(
            vertexCells,
            cellSize,
            labelMargin,
          );
          return position ? { vertex, position } : null;
        })
        .filter(
          (
            vertex,
          ): vertex is {
            vertex: SquareGridVertex;
            position: SquareVertexPosition;
          } => vertex != null,
        ),
    [cellSize, cellsById, labelMargin, vertices],
  );

  const autoInteractiveEdges = useMemo(() => {
    if (!interactiveEdges) {
      return [] as InteractiveSquareEdge[];
    }

    const edgeMap = new Map<string, InteractiveSquareEdge>();
    const sideConfigs = [
      {
        side: "north" as const,
        key: (cell: GridCell) =>
          `${cell.col},${cell.row}::${cell.col + 1},${cell.row}`,
      },
      {
        side: "east" as const,
        key: (cell: GridCell) =>
          `${cell.col + 1},${cell.row}::${cell.col + 1},${cell.row + 1}`,
      },
      {
        side: "south" as const,
        key: (cell: GridCell) =>
          `${cell.col},${cell.row + 1}::${cell.col + 1},${cell.row + 1}`,
      },
      {
        side: "west" as const,
        key: (cell: GridCell) =>
          `${cell.col},${cell.row}::${cell.col},${cell.row + 1}`,
      },
    ];

    for (const cell of resolvedCells) {
      for (const { side, key } of sideConfigs) {
        const geometryKey = key(cell);
        const existing = edgeMap.get(geometryKey);
        edgeMap.set(geometryKey, {
          id: `interactive-edge:${geometryKey}`,
          spaceIds: existing
            ? [...new Set([...existing.spaceIds, cell.id])]
            : [cell.id],
          position:
            existing?.position ??
            edgePositionForSide(cell, side, cellSize, labelMargin),
        });
      }
    }

    return [...edgeMap.values()].sort((left, right) =>
      left.id.localeCompare(right.id),
    );
  }, [cellSize, interactiveEdges, labelMargin, resolvedCells]);

  const autoInteractiveVertices = useMemo(() => {
    if (!interactiveVertices) {
      return [] as InteractiveSquareVertex[];
    }

    const vertexMap = new Map<string, InteractiveSquareVertex>();

    for (const cell of resolvedCells) {
      for (const [geometryKey, gridPoint] of Object.entries(
        cornerKeysForCell(cell),
      )) {
        const existing = vertexMap.get(geometryKey);
        vertexMap.set(geometryKey, {
          id: `interactive-vertex:${geometryKey}`,
          spaceIds: existing
            ? [...new Set([...existing.spaceIds, cell.id])]
            : [cell.id],
          position: existing?.position ?? {
            x: labelMargin + gridPoint.x * cellSize,
            y: gridPoint.y * cellSize,
          },
        });
      }
    }

    return [...vertexMap.values()].sort((left, right) =>
      left.id.localeCompare(right.id),
    );
  }, [cellSize, interactiveVertices, labelMargin, resolvedCells]);

  // Calculate viewBox for pan/zoom
  const viewBoxWidth = totalWidth / transform.zoom;
  const viewBoxHeight = totalHeight / transform.zoom;
  const viewBoxX = (totalWidth - viewBoxWidth) / 2 - transform.pan.x;
  const viewBoxY = (totalHeight - viewBoxHeight) / 2 - transform.pan.y;

  // Determine SVG dimensions
  const svgWidth = width ?? totalWidth;
  const svgHeight = height ?? totalHeight;

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={
        enablePanZoom
          ? `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`
          : `0 0 ${totalWidth} ${totalHeight}`
      }
      className={clsx(
        "square-grid",
        enablePanZoom && "touch-none",
        isPanning && "cursor-grabbing",
        enablePanZoom && !isPanning && "cursor-grab",
        className,
      )}
      {...bind()}
      role="img"
      aria-label={`${rows}x${cols} game grid`}
    >
      <defs>
        {/* Drop shadow for pieces */}
        <filter id="pieceShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Cells layer */}
      <g className="cells" role="list" aria-label="Grid cells">
        {renderableCells.map(({ row, col }) => {
          const x = labelMargin + col * cellSize;
          const y = row * cellSize;

          return (
            <g
              key={`${row}-${col}`}
              transform={`translate(${x}, ${y})`}
              role="listitem"
              aria-label={
                coordinateStyle === "algebraic"
                  ? toAlgebraic(row, col, rows)
                  : toNumeric(row, col)
              }
            >
              {renderCell(row, col)}
            </g>
          );
        })}
      </g>

      {renderEdge && resolvedEdgePositions.length > 0 && (
        <g className="edges" aria-label="Board edges">
          {resolvedEdgePositions.map(({ edge, position }) => (
            <g key={edge.id}>{renderEdge(edge, position)}</g>
          ))}
        </g>
      )}

      {interactiveEdges && (
        <g className="interactive-edges" aria-label="Interactive edges">
          {autoInteractiveEdges.map((edge) => (
            <g
              key={edge.id}
              onClick={() => onInteractiveEdgeClick?.(edge)}
              onPointerEnter={() => {
                setHoveredInteractiveEdgeId(edge.id);
                onInteractiveEdgeEnter?.(edge);
              }}
              onPointerLeave={() => {
                setHoveredInteractiveEdgeId((currentId) =>
                  currentId === edge.id ? null : currentId,
                );
                onInteractiveEdgeLeave?.(edge);
              }}
              className={clsx(
                (onInteractiveEdgeClick ||
                  onInteractiveEdgeEnter ||
                  onInteractiveEdgeLeave) &&
                  "cursor-pointer",
              )}
            >
              {renderInteractiveEdge ? (
                renderInteractiveEdge(
                  edge,
                  hoveredInteractiveEdgeId === edge.id,
                )
              ) : (
                <line
                  x1={edge.position.x1}
                  y1={edge.position.y1}
                  x2={edge.position.x2}
                  y2={edge.position.y2}
                  stroke="transparent"
                  strokeWidth={Math.max(12, cellSize * 0.18)}
                />
              )}
            </g>
          ))}
        </g>
      )}

      {renderVertex && resolvedVertexPositions.length > 0 && (
        <g className="vertices" aria-label="Board vertices">
          {resolvedVertexPositions.map(({ vertex, position }) => (
            <g key={vertex.id}>{renderVertex(vertex, position)}</g>
          ))}
        </g>
      )}

      {interactiveVertices && (
        <g className="interactive-vertices" aria-label="Interactive vertices">
          {autoInteractiveVertices.map((vertex) => (
            <g
              key={vertex.id}
              onClick={() => onInteractiveVertexClick?.(vertex)}
              onPointerEnter={() => {
                setHoveredInteractiveVertexId(vertex.id);
                onInteractiveVertexEnter?.(vertex);
              }}
              onPointerLeave={() => {
                setHoveredInteractiveVertexId((currentId) =>
                  currentId === vertex.id ? null : currentId,
                );
                onInteractiveVertexLeave?.(vertex);
              }}
              className={clsx(
                (onInteractiveVertexClick ||
                  onInteractiveVertexEnter ||
                  onInteractiveVertexLeave) &&
                  "cursor-pointer",
              )}
            >
              {renderInteractiveVertex ? (
                renderInteractiveVertex(
                  vertex,
                  hoveredInteractiveVertexId === vertex.id,
                )
              ) : (
                <circle
                  cx={vertex.position.x}
                  cy={vertex.position.y}
                  r={Math.max(8, cellSize * 0.12)}
                  fill="transparent"
                />
              )}
            </g>
          ))}
        </g>
      )}

      {/* Coordinate labels */}
      {showCoordinates && coordinateStyle !== "none" && (
        <g className="coordinates" aria-hidden="true">
          {/* File labels (a-h) - bottom */}
          {Array.from({ length: cols }).map((_, col) => {
            const label =
              coordinateStyle === "algebraic"
                ? String.fromCharCode(97 + col)
                : String(col + 1);
            return (
              <text
                key={`file-${col}`}
                x={labelMargin + col * cellSize + cellSize / 2}
                y={gridHeight + 16}
                textAnchor="middle"
                fill="#64748b"
                fontSize={12}
                fontWeight="500"
              >
                {label}
              </text>
            );
          })}
          {/* Rank labels (1-8) - left */}
          {Array.from({ length: rows }).map((_, row) => {
            const label =
              coordinateStyle === "algebraic"
                ? String(rows - row)
                : String(row + 1);
            return (
              <text
                key={`rank-${row}`}
                x={10}
                y={row * cellSize + cellSize / 2 + 4}
                textAnchor="middle"
                fill="#64748b"
                fontSize={12}
                fontWeight="500"
              >
                {label}
              </text>
            );
          })}
        </g>
      )}

      {/* Pieces layer */}
      <g className="pieces" role="list" aria-label="Game pieces">
        {pieces.map((piece) => {
          const x = labelMargin + piece.col * cellSize + cellSize / 2;
          const y = piece.row * cellSize + cellSize / 2;

          return (
            <g
              key={piece.id}
              transform={`translate(${x}, ${y})`}
              role="listitem"
              aria-label={`${piece.owner ?? ""} ${piece.type}`}
            >
              {renderPiece(piece)}
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
