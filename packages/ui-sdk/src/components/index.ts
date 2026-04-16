/** Reducer-native UI primitives for building game interfaces. */

// Presentational components (no hooks, receive data as props)
export { Card, type CardProps, type CardItem } from "./Card.js";
export {
  Hand,
  type HandProps,
  type HandCardRenderProps,
  type HandDrawerRenderProps,
  type HandEmptyRenderProps,
  type HandContainerRenderProps,
} from "./Hand.js";
export { PlayArea, type PlayAreaProps } from "./PlayArea.js";

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
export {
  DiceRoller,
  type DiceRollerProps,
  type DiceRollerRenderProps,
} from "./DiceRoller.js";
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
  type InteractiveSquareEdge,
  type InteractiveSquareVertex,
  type SquareEdgePosition,
  type SquareGridEdge,
  type SquareGridVertex,
  type SquareVertexPosition,
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
  type InteractiveVertex,
  type InteractiveEdge,
  type DefaultHexTileProps,
  type DefaultHexEdgeProps,
  type DefaultHexVertexProps,
} from "./board/HexGrid.js";
export type {
  HexTileState,
  HexEdgeState,
  HexVertexState,
} from "../types/player-state.js";
