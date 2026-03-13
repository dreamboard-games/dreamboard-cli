/**
 * SquareGrid component - Square grid visualization for grid-based games
 *
 * Design Philosophy: "Classic Precision"
 * - SVG-based square grid with row/column coordinates
 * - All rendering controlled by parent via required render functions
 * - Pre-built helper components provided for easy customization
 * - Pan and zoom support using @use-gesture
 *
 * Use cases: Chess, Checkers, Go, Scrabble, Battleship
 *
 * @example Basic usage with pre-built components
 * ```tsx
 * <SquareGrid
 *   rows={8}
 *   cols={8}
 *   pieces={pieces}
 *   cellSize={60}
 *   renderCell={(row, col) => (
 *     <DefaultGridCell
 *       size={60}
 *       isLight={(row + col) % 2 === 0}
 *       isHighlighted={highlightedCells.has(`${row}-${col}`)}
 *       onClick={() => handleCellClick(row, col)}
 *     />
 *   )}
 *   renderPiece={(piece) => (
 *     <DefaultGridPiece
 *       size={60}
 *       color={playerColors[piece.owner]}
 *       label={piece.type.charAt(0).toUpperCase()}
 *       onClick={() => handlePieceClick(piece.id)}
 *     />
 *   )}
 * />
 * ```
 */

import { useRef, type ReactNode } from "react";
import { clsx } from "clsx";
import { usePanZoom } from "../../hooks/usePanZoom.js";

// ============================================================================
// Types
// ============================================================================

export interface GridCell {
  /** Row index (0-based) */
  row: number;
  /** Column index (0-based) */
  col: number;
  /** Cell type for custom rendering */
  type?: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface GridPiece {
  /** Unique piece identifier */
  id: string;
  /** Row position (0-based) */
  row: number;
  /** Column position (0-based) */
  col: number;
  /** Piece type (e.g., 'king', 'queen', 'pawn') */
  type: string;
  /** Owner player ID */
  owner?: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface SquareGridProps {
  /** Number of rows */
  rows: number;
  /** Number of columns */
  cols: number;
  /** Pieces on the board - defaults to empty */
  pieces: GridPiece[];
  /** Cell size in pixels */
  cellSize?: number;
  /** Custom cell renderer - required, receives row/col centered at cell position */
  renderCell: (row: number, col: number) => ReactNode;
  /** Custom piece renderer - required, receives piece centered at cell center */
  renderPiece: (piece: GridPiece) => ReactNode;
  /** Show coordinate labels */
  showCoordinates?: boolean;
  /** Coordinate style */
  coordinateStyle?: "algebraic" | "numeric" | "none";
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
// Pre-built Helper Components
// ============================================================================

export interface DefaultGridCellProps {
  /** Cell size in pixels */
  size: number;
  /** Light or dark cell (for alternating pattern) */
  isLight?: boolean;
  /** Light cell color */
  lightColor?: string;
  /** Dark cell color */
  darkColor?: string;
  /** Whether cell is highlighted */
  isHighlighted?: boolean;
  /** Highlight color */
  highlightColor?: string;
  /** Whether cell is selected */
  isSelected?: boolean;
  /** Selection color */
  selectedColor?: string;
  /** Whether to show valid move indicator */
  isValidMove?: boolean;
  /** Whether to show capture indicator */
  isCapture?: boolean;
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
 * Pre-built grid cell component for use in renderCell
 *
 * @example
 * ```tsx
 * renderCell={(row, col) => (
 *   <DefaultGridCell
 *     size={60}
 *     isLight={(row + col) % 2 === 0}
 *     lightColor="#f0d9b5"
 *     darkColor="#b58863"
 *     isHighlighted={selectedPiece?.row === row && selectedPiece?.col === col}
 *     onClick={() => handleCellClick(row, col)}
 *   />
 * )}
 * ```
 */
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
  /** Cell size for scaling */
  size: number;
  /** Piece color */
  color?: string;
  /** Stroke color (for contrast) */
  strokeColor?: string;
  /** Label to display (e.g., piece type initial) */
  label?: string;
  /** Whether piece is being dragged */
  isDragging?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Pointer down handler (for drag start) */
  onPointerDown?: (e: React.PointerEvent) => void;
  /** Additional className */
  className?: string;
}

/**
 * Pre-built grid piece component for use in renderPiece
 *
 * @example
 * ```tsx
 * renderPiece={(piece) => (
 *   <DefaultGridPiece
 *     size={60}
 *     color={piece.owner === 'white' ? '#f8fafc' : '#1e293b'}
 *     label={piece.type.charAt(0).toUpperCase()}
 *     onClick={() => handlePieceClick(piece.id)}
 *   />
 * )}
 * ```
 */
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
  /** Cell size for scaling */
  size: number;
  /** Piece type (king, queen, rook, bishop, knight, pawn) */
  type: string;
  /** Player color (white or black) */
  owner: "white" | "black";
  /** Click handler */
  onClick?: () => void;
  /** Pointer down handler (for drag start) */
  onPointerDown?: (e: React.PointerEvent) => void;
  /** Additional className */
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

/**
 * Pre-built chess piece component for use in renderPiece
 *
 * @example
 * ```tsx
 * renderPiece={(piece) => (
 *   <DefaultChessPiece
 *     size={60}
 *     type={piece.type}
 *     owner={piece.owner as 'white' | 'black'}
 *     onClick={() => handlePieceClick(piece.id)}
 *   />
 * )}
 * ```
 */
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

// ============================================================================
// Component
// ============================================================================

export function SquareGrid({
  rows,
  cols,
  pieces = [],
  cellSize = 60,
  renderCell,
  renderPiece,
  showCoordinates = true,
  coordinateStyle = "algebraic",
  width,
  height,
  enablePanZoom = false,
  initialZoom = 1,
  minZoom = 0.5,
  maxZoom = 3,
  className,
}: SquareGridProps) {
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

  const svgRef = useRef<SVGSVGElement>(null);

  // Coordinate label margin
  const labelMargin = showCoordinates && coordinateStyle !== "none" ? 24 : 0;

  // Calculate grid dimensions
  const gridWidth = cols * cellSize;
  const gridHeight = rows * cellSize;
  const totalWidth = gridWidth + labelMargin;
  const totalHeight = gridHeight + labelMargin;

  // Generate cells
  const cells: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({ row, col });
    }
  }

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
      ref={svgRef}
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
        {cells.map(({ row, col }) => {
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
