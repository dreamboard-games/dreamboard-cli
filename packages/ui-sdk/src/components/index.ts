/**
 * Game UI Components
 *
 * Accessible, mobile-first components for building game interfaces
 *
 * Component Architecture:
 * - Base components (Card, Hand, PlayArea) are presentational and receive data as props
 * - Connected components (ConnectedCard) use hooks to fetch data from context
 * - Use base components for fixtures/testing or manual data management
 * - Use connected components when RuntimeContext is set up
 */

// Presentational components (no hooks, receive data as props)
export { Card, type CardProps, type CardItem } from "./Card.js";
export { Hand, type HandProps } from "./Hand.js";
export { PlayArea, type PlayAreaProps } from "./PlayArea.js";

// Connected components (use hooks, require RuntimeContext)
export { ConnectedCard, type ConnectedCardProps } from "./ConnectedCard.js";

// Other UI components
export { PlayerInfo, type PlayerInfoProps } from "./PlayerInfo.js";
export { GameSkeleton, type GameSkeletonProps } from "./GameSkeleton.js";
export {
  ToastProvider,
  useToast,
  type Toast,
  type ToastType,
} from "./Toast.js";
export { ErrorBoundary, type ErrorBoundaryProps } from "./ErrorBoundary.js";
export { PluginRuntime, type PluginRuntimeProps } from "./PluginRuntime.js";
export { PlayerSwitcher, type PlayerSwitcherProps } from "./PlayerSwitcher.js";
export {
  HistoryNavigator,
  type HistoryNavigatorProps,
} from "./HistoryNavigator.js";
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "./Drawer.js";

// Game UI primitives (SDK v0.1.0+)
export {
  ResourceCounter,
  type ResourceCounterProps,
  type ResourceDisplayConfig,
} from "./ResourceCounter.js";
export {
  CostDisplay,
  type CostDisplayProps,
  type ResourceDefinition,
} from "./CostDisplay.js";
export { ActionButton, type ActionButtonProps } from "./ActionButton.js";
export {
  ActionPanel,
  ActionGroup,
  type ActionPanelProps,
  type ActionGroupProps,
} from "./ActionPanel.js";
export { DiceRoller, type DiceRollerProps } from "./DiceRoller.js";
export { PhaseIndicator, type PhaseIndicatorProps } from "./PhaseIndicator.js";
export {
  GameEndDisplay,
  type GameEndDisplayProps,
  type PlayerScore,
} from "./GameEndDisplay.js";

// Board primitives (SDK v0.2.0+)
export {
  NetworkGraph,
  type NetworkGraphProps,
  type NetworkNode,
  type NetworkEdge,
  type NetworkPiece,
} from "./board/NetworkGraph.js";

export {
  ZoneMap,
  type ZoneMapProps,
  type ZoneDefinition,
  type ZonePiece,
  type ZoneShape,
  type ZoneHighlightType,
} from "./board/ZoneMap.js";

export {
  TrackBoard,
  type TrackBoardProps,
  type TrackSpace,
  type TrackPiece,
} from "./board/TrackBoard.js";

export {
  SlotSystem,
  type SlotSystemProps,
  type SlotDefinition,
  type SlotOccupant,
} from "./board/SlotSystem.js";

export {
  SquareGrid,
  DefaultGridCell,
  DefaultGridPiece,
  DefaultChessPiece,
  toAlgebraic,
  toNumeric,
  type SquareGridProps,
  type GridCell,
  type GridPiece,
  type DefaultGridCellProps,
  type DefaultGridPieceProps,
  type DefaultChessPieceProps,
} from "./board/SquareGrid.js";

export {
  HexGrid,
  hexUtils,
  DefaultHexTile,
  DefaultHexEdge,
  DefaultHexVertex,
  type HexGridProps,
  type HexOrientation,
  type EdgePosition,
  type DefaultHexTileProps,
  type DefaultHexEdgeProps,
  type DefaultHexVertexProps,
} from "./board/HexGrid.js";
