import * as react_jsx_runtime from 'react/jsx-runtime';
import { HTMLMotionProps } from 'framer-motion';
import { CardId, CardProperties, BoardId, TileId, TileTypeId, PlayerId, TilePropertiesByBoardId, EdgeTypeId, EdgePropertiesByBoardId, VertexTypeId, VertexPropertiesByBoardId, ResourceId } from '@dreamboard/manifest';
import * as React$1 from 'react';
import React__default, { ReactNode, Component, ErrorInfo, ComponentType } from 'react';

interface CardItem {
    
    id: CardId;
    
    type: string;
    
    cardName?: string;
    
    description?: string;
    
    properties: CardProperties;
}
interface HexTileState<B extends BoardId = BoardId> {
    
    id: TileId;
    
    q: number;
    
    r: number;
    
    typeId?: TileTypeId;
    
    label?: string;
    
    owner?: PlayerId;
    
    properties?: B extends keyof TilePropertiesByBoardId ? TilePropertiesByBoardId[B] : undefined;
}

interface HexEdgeState<B extends BoardId = BoardId> {
    
    id: string;
    
    hex1: TileId;
    
    hex2: TileId;
    
    typeId?: EdgeTypeId;
    
    owner?: PlayerId;
    
    properties?: B extends keyof EdgePropertiesByBoardId ? EdgePropertiesByBoardId[B] : undefined;
}

interface HexVertexState<B extends BoardId = BoardId> {
    
    id: string;
    
    hexes: [TileId, TileId, TileId];
    
    typeId?: VertexTypeId;
    
    owner?: PlayerId;
    
    properties?: B extends keyof VertexPropertiesByBoardId ? VertexPropertiesByBoardId[B] : undefined;
}

interface CardProps extends Omit<HTMLMotionProps<"button">, "children"> {
    
    card: CardItem;
    
    selected?: boolean;
    
    disabled?: boolean;
    
    size?: "sm" | "md" | "lg";
    
    faceDown?: boolean;
    
    renderContent?: (card: CardItem) => React.ReactNode;
    
    onCardClick?: (cardId: string) => void;
    
    "aria-label"?: string;
}

declare function Card({ card, selected, disabled, size, faceDown, renderContent, onCardClick, className, "aria-label": ariaLabel, ...motionProps }: CardProps): react_jsx_runtime.JSX.Element;

type CardSize = "sm" | "md" | "lg";
type HandLayout = "spread" | "stack" | "overlap";

interface HandCardRenderProps {
    
    card: CardItem;
    
    index: number;
    
    isHovered: boolean;
    
    isSelected: boolean;
    
    x: number;
    
    y: number;
    
    zIndex: number;
    
    cardDimensions: {
        width: number;
        height: number;
    };
}
interface HandDrawerRenderProps {
    
    cards: CardItem[];
    
    selectedIds: string[];
    
    cardCount: number;
    
    selectedCount: number;
    
    disabled: boolean;
    
    cardDimensions: {
        width: number;
        height: number;
    };
}
interface HandEmptyRenderProps {
    
    layout: HandLayout;
}
interface HandContainerRenderProps {
    
    totalWidth: number;
    
    totalHeight: number;
    
    cardDimensions: {
        width: number;
        height: number;
    };
    
    children: ReactNode;
    
    onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    
    onMouseLeave: () => void;
}
interface HandProps {
    
    cards: CardItem[];
    
    selectedIds?: string[];
    
    disabled?: boolean;
    
    cardSize?: CardSize;
    
    layout?: HandLayout;
    
    "aria-label"?: string;
    
    renderCard: (props: HandCardRenderProps) => ReactNode;
    
    renderDrawer: (props: HandDrawerRenderProps) => ReactNode;
    
    renderEmpty: (props: HandEmptyRenderProps) => ReactNode;
    
    renderContainer?: (props: HandContainerRenderProps) => ReactNode;
    
    className?: string;
}

declare function Hand({ cards, selectedIds, disabled, cardSize, layout, "aria-label": ariaLabel, renderCard, renderDrawer, renderEmpty, renderContainer, className, }: HandProps): react_jsx_runtime.JSX.Element;

interface PlayAreaProps {
    
    cards: CardItem[];
    
    filter?: (card: CardItem) => boolean;
    
    cardSize?: CardProps["size"];
    
    renderCard?: CardProps["renderContent"];
    
    layout?: "grid" | "row";
    
    interactive?: boolean;
    
    onCardClick?: (cardId: string) => void;
    
    "aria-label"?: string;
    className?: string;
}

declare function PlayArea({ cards, filter, cardSize, renderCard, layout, interactive, onCardClick, "aria-label": ariaLabel, className, }: PlayAreaProps): react_jsx_runtime.JSX.Element;

interface ConnectedCardProps extends Omit<CardProps, "card"> {
    
    cardId: CardId;
}

declare function ConnectedCard({ cardId, ...props }: ConnectedCardProps): react_jsx_runtime.JSX.Element | null;

interface PlayerInfoProps {
    
    playerId: PlayerId;
    
    name?: string;
    
    isActive?: boolean;
    
    isCurrentPlayer?: boolean;
    
    isHost?: boolean;
    
    color?: string;
    
    score?: number;
    
    metadata?: Record<string, unknown>;
    
    size?: "sm" | "md" | "lg";
    
    orientation?: "horizontal" | "vertical";
    
    avatar?: React.ReactNode;
    className?: string;
}

declare function PlayerInfo({ playerId, name, isActive, isCurrentPlayer, isHost, color, score, metadata, size, orientation, avatar, className, }: PlayerInfoProps): react_jsx_runtime.JSX.Element;

interface GameSkeletonProps {
    
    variant?: "default" | "cards" | "players" | "minimal";
    
    message?: string;
    className?: string;
}

declare function GameSkeleton({ variant, message, className, }: GameSkeletonProps): react_jsx_runtime.JSX.Element;

type ToastType = "success" | "error" | "info" | "warning";
interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}
interface ToastContextValue {
    toasts: Toast[];
    show: (message: string, type?: ToastType, duration?: number) => void;
    dismiss: (id: string) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
}

declare function ToastProvider({ children }: {
    children: ReactNode;
}): react_jsx_runtime.JSX.Element;

declare function useToast(): ToastContextValue;

interface ErrorBoundaryProps {
    
    children: ReactNode;
    
    fallback?: (error: Error, reset: () => void) => ReactNode;
    
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

declare class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    handleReset: () => void;
    render(): ReactNode;
}

interface PluginRuntimeProps {
    
    children: React__default.ReactNode;
    
    timeout?: number;
    
    loadingComponent?: React__default.ReactNode;
    
    errorComponent?: (error: string) => React__default.ReactNode;
}

declare function PluginRuntime({ children, timeout, loadingComponent, errorComponent, }: PluginRuntimeProps): react_jsx_runtime.JSX.Element;

interface PlayerSwitcherProps {
    
    className?: string;
    
    position?: "top-left" | "top-right" | "top-center";
}

declare function PlayerSwitcher({ className, position, }: PlayerSwitcherProps): react_jsx_runtime.JSX.Element | null;

interface HistoryNavigatorProps {
    
    className?: string;
    
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

declare function HistoryNavigator({ className, position, }: HistoryNavigatorProps): react_jsx_runtime.JSX.Element | null;

declare const NODES: readonly ["a", "button", "div", "form", "h2", "h3", "img", "input", "label", "li", "nav", "ol", "p", "select", "span", "svg", "ul"];
type Primitives = {
    [E in (typeof NODES)[number]]: PrimitiveForwardRefComponent<E>;
};
type PrimitivePropsWithRef<E extends React$1.ElementType> = React$1.ComponentPropsWithRef<E> & {
    asChild?: boolean;
};
interface PrimitiveForwardRefComponent<E extends React$1.ElementType> extends React$1.ForwardRefExoticComponent<PrimitivePropsWithRef<E>> {
}
declare const Primitive: Primitives;

type PrimitiveDivProps$3 = React$1.ComponentPropsWithoutRef<typeof Primitive.div>;
interface DismissableLayerProps$1 extends PrimitiveDivProps$3 {
    
    disableOutsidePointerEvents?: boolean;
    
    onEscapeKeyDown?: (event: KeyboardEvent) => void;
    
    onPointerDownOutside?: (event: PointerDownOutsideEvent) => void;
    
    onFocusOutside?: (event: FocusOutsideEvent) => void;
    
    onInteractOutside?: (event: PointerDownOutsideEvent | FocusOutsideEvent) => void;
    
    onDismiss?: () => void;
}
declare const DismissableLayer: React$1.ForwardRefExoticComponent<DismissableLayerProps$1 & React$1.RefAttributes<HTMLDivElement>>;
type PointerDownOutsideEvent = CustomEvent<{
    originalEvent: PointerEvent;
}>;
type FocusOutsideEvent = CustomEvent<{
    originalEvent: FocusEvent;
}>;

type PrimitiveDivProps$2 = React$1.ComponentPropsWithoutRef<typeof Primitive.div>;
interface FocusScopeProps$1 extends PrimitiveDivProps$2 {
    
    loop?: boolean;
    
    trapped?: boolean;
    
    onMountAutoFocus?: (event: Event) => void;
    
    onUnmountAutoFocus?: (event: Event) => void;
}
declare const FocusScope: React$1.ForwardRefExoticComponent<FocusScopeProps$1 & React$1.RefAttributes<HTMLDivElement>>;

type PrimitiveDivProps$1 = React$1.ComponentPropsWithoutRef<typeof Primitive.div>;
interface PortalProps$2 extends PrimitiveDivProps$1 {
    
    container?: Element | DocumentFragment | null;
}
declare const Portal$2: React$1.ForwardRefExoticComponent<PortalProps$2 & React$1.RefAttributes<HTMLDivElement>>;

type PrimitiveButtonProps = React$1.ComponentPropsWithoutRef<typeof Primitive.button>;
interface DialogTriggerProps extends PrimitiveButtonProps {
}
type PortalProps$1 = React$1.ComponentPropsWithoutRef<typeof Portal$2>;
interface DialogPortalProps {
    children?: React$1.ReactNode;
    
    container?: PortalProps$1['container'];
    
    forceMount?: true;
}
interface DialogOverlayProps extends DialogOverlayImplProps {
    
    forceMount?: true;
}
type PrimitiveDivProps = React$1.ComponentPropsWithoutRef<typeof Primitive.div>;
interface DialogOverlayImplProps extends PrimitiveDivProps {
}
interface DialogContentProps extends DialogContentTypeProps {
    
    forceMount?: true;
}
interface DialogContentTypeProps extends Omit<DialogContentImplProps, 'trapFocus' | 'disableOutsidePointerEvents'> {
}
type DismissableLayerProps = React$1.ComponentPropsWithoutRef<typeof DismissableLayer>;
type FocusScopeProps = React$1.ComponentPropsWithoutRef<typeof FocusScope>;
interface DialogContentImplProps extends Omit<DismissableLayerProps, 'onDismiss'> {
    
    trapFocus?: FocusScopeProps['trapped'];
    
    onOpenAutoFocus?: FocusScopeProps['onMountAutoFocus'];
    
    onCloseAutoFocus?: FocusScopeProps['onUnmountAutoFocus'];
}
type PrimitiveHeading2Props = React$1.ComponentPropsWithoutRef<typeof Primitive.h2>;
interface DialogTitleProps extends PrimitiveHeading2Props {
}
type PrimitiveParagraphProps = React$1.ComponentPropsWithoutRef<typeof Primitive.p>;
interface DialogDescriptionProps extends PrimitiveParagraphProps {
}
interface DialogCloseProps extends PrimitiveButtonProps {
}
declare const Portal$1: React$1.FC<DialogPortalProps>;

interface WithFadeFromProps {
    
    snapPoints: (number | string)[];
    
    fadeFromIndex: number;
}
interface WithoutFadeFromProps {
    
    snapPoints?: (number | string)[];
    fadeFromIndex?: never;
}
type DialogProps = {
    activeSnapPoint?: number | string | null;
    setActiveSnapPoint?: (snapPoint: number | string | null) => void;
    children?: React__default.ReactNode;
    open?: boolean;
    
    closeThreshold?: number;
    
    noBodyStyles?: boolean;
    onOpenChange?: (open: boolean) => void;
    shouldScaleBackground?: boolean;
    
    setBackgroundColorOnScale?: boolean;
    
    scrollLockTimeout?: number;
    
    fixed?: boolean;
    
    handleOnly?: boolean;
    
    dismissible?: boolean;
    onDrag?: (event: React__default.PointerEvent<HTMLDivElement>, percentageDragged: number) => void;
    onRelease?: (event: React__default.PointerEvent<HTMLDivElement>, open: boolean) => void;
    
    modal?: boolean;
    nested?: boolean;
    onClose?: () => void;
    
    direction?: 'top' | 'bottom' | 'left' | 'right';
    
    defaultOpen?: boolean;
    
    disablePreventScroll?: boolean;
    
    repositionInputs?: boolean;
    
    snapToSequentialPoint?: boolean;
    container?: HTMLElement | null;
    
    onAnimationEnd?: (open: boolean) => void;
    preventScrollRestoration?: boolean;
    autoFocus?: boolean;
} & (WithFadeFromProps | WithoutFadeFromProps);
declare function Root({ open: openProp, onOpenChange, children, onDrag: onDragProp, onRelease: onReleaseProp, snapPoints, shouldScaleBackground, setBackgroundColorOnScale, closeThreshold, scrollLockTimeout, dismissible, handleOnly, fadeFromIndex, activeSnapPoint: activeSnapPointProp, setActiveSnapPoint: setActiveSnapPointProp, fixed, modal, onClose, nested, noBodyStyles, direction, defaultOpen, disablePreventScroll, snapToSequentialPoint, preventScrollRestoration, repositionInputs, onAnimationEnd, container, autoFocus, }: DialogProps): React__default.JSX.Element;
declare function NestedRoot({ onDrag, onOpenChange, open: nestedIsOpen, ...rest }: DialogProps): React__default.JSX.Element;
type PortalProps = React__default.ComponentPropsWithoutRef<typeof Portal$1>;
declare function Portal(props: PortalProps): React__default.JSX.Element;
declare const Drawer$1: {
    Root: typeof Root;
    NestedRoot: typeof NestedRoot;
    Content: React__default.ForwardRefExoticComponent<Omit<DialogContentProps & React__default.RefAttributes<HTMLDivElement>, "ref"> & React__default.RefAttributes<HTMLDivElement>>;
    Overlay: React__default.ForwardRefExoticComponent<Omit<DialogOverlayProps & React__default.RefAttributes<HTMLDivElement>, "ref"> & React__default.RefAttributes<HTMLDivElement>>;
    Trigger: React__default.ForwardRefExoticComponent<DialogTriggerProps & React__default.RefAttributes<HTMLButtonElement>>;
    Portal: typeof Portal;
    Handle: React__default.ForwardRefExoticComponent<Omit<React__default.DetailedHTMLProps<React__default.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
        preventCycle?: boolean | undefined;
    } & React__default.RefAttributes<HTMLDivElement>>;
    Close: React__default.ForwardRefExoticComponent<DialogCloseProps & React__default.RefAttributes<HTMLButtonElement>>;
    Title: React__default.ForwardRefExoticComponent<DialogTitleProps & React__default.RefAttributes<HTMLHeadingElement>>;
    Description: React__default.ForwardRefExoticComponent<DialogDescriptionProps & React__default.RefAttributes<HTMLParagraphElement>>;
};

declare function Drawer({ ...props }: React$1.ComponentProps<typeof Drawer$1.Root>): react_jsx_runtime.JSX.Element;
declare function DrawerTrigger({ ...props }: React$1.ComponentProps<typeof Drawer$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function DrawerPortal({ ...props }: React$1.ComponentProps<typeof Drawer$1.Portal>): react_jsx_runtime.JSX.Element;
declare function DrawerClose({ ...props }: React$1.ComponentProps<typeof Drawer$1.Close>): react_jsx_runtime.JSX.Element;
declare function DrawerOverlay({ className, ...props }: React$1.ComponentProps<typeof Drawer$1.Overlay>): react_jsx_runtime.JSX.Element;
interface DrawerContentProps extends React$1.ComponentPropsWithoutRef<typeof Drawer$1.Content> {
    
    showHandle?: boolean;
    
    children?: React$1.ReactNode;
}
declare function DrawerContent({ className, children, showHandle, ...props }: DrawerContentProps): react_jsx_runtime.JSX.Element;
declare function DrawerHeader({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function DrawerFooter({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function DrawerTitle({ className, ...props }: React$1.ComponentProps<typeof Drawer$1.Title>): react_jsx_runtime.JSX.Element;
declare function DrawerDescription({ className, ...props }: React$1.ComponentProps<typeof Drawer$1.Description>): react_jsx_runtime.JSX.Element;

interface ResourceDisplayConfig {
    
    type: ResourceId;
    
    label: string;
    
    icon: ComponentType<{
        className?: string;
        strokeWidth?: number;
        "aria-hidden"?: string;
    }>;
    
    iconColor?: string;
    
    bgColor?: string;
    
    textColor?: string;
}
interface ResourceCounterProps {
    
    resources: ResourceDisplayConfig[];
    
    counts: Record<ResourceId, number>;
    
    layout?: "row" | "grid" | "compact";
    
    columns?: number;
    
    showZero?: boolean;
    
    size?: "sm" | "md" | "lg";
    
    onResourceClick?: (resourceType: ResourceId) => void;
    
    className?: string;
}

declare function ResourceCounter({ resources, counts, layout, columns, showZero, size, onResourceClick, className, }: ResourceCounterProps): react_jsx_runtime.JSX.Element;

interface ResourceDefinition {
    
    type: string;
    
    label: string;
    
    icon?: ComponentType<{
        className?: string;
    }>;
    
    color?: string;
}
interface CostDisplayProps {
    
    cost: Record<string, number>;
    
    currentResources?: Record<string, number>;
    
    resourceDefs: ResourceDefinition[];
    
    size?: "sm" | "md";
    
    layout?: "inline" | "stacked";
    
    className?: string;
}

declare function CostDisplay({ cost, currentResources, resourceDefs, size, layout, className, }: CostDisplayProps): react_jsx_runtime.JSX.Element | null;

interface ActionButtonProps {
    
    label: string;
    
    description?: string;
    
    cost?: Record<string, number>;
    
    currentResources?: Record<string, number>;
    
    resourceDefs?: ResourceDefinition[];
    
    available?: boolean;
    
    disabledReason?: string;
    
    loading?: boolean;
    
    icon?: ComponentType<{
        className?: string;
        strokeWidth?: number;
        "aria-hidden"?: string;
    }>;
    
    variant?: "primary" | "secondary" | "danger" | "success";
    
    size?: "sm" | "md" | "lg";
    
    onClick: () => void;
    
    className?: string;
}

declare function ActionButton({ label, description, cost, currentResources, resourceDefs, available, disabledReason, loading, icon: Icon, variant, size, onClick, className, }: ActionButtonProps): react_jsx_runtime.JSX.Element;

interface ActionPanelProps {
    
    title?: string;
    
    state?: string;
    
    stateLabels?: Record<string, string>;
    
    collapsible?: boolean;
    
    defaultExpanded?: boolean;
    
    children: ReactNode;
    
    className?: string;
}

declare function ActionPanel({ title, state, stateLabels, collapsible, defaultExpanded, children, className, }: ActionPanelProps): react_jsx_runtime.JSX.Element;
interface ActionGroupProps {
    
    title: string;
    
    description?: string;
    
    visible?: boolean;
    
    variant?: "default" | "warning" | "danger" | "success";
    
    children: ReactNode;
    
    className?: string;
}

declare function ActionGroup({ title, description, visible, variant, children, className, }: ActionGroupProps): react_jsx_runtime.JSX.Element | null;

interface DiceRollerRenderProps {
    
    values: Array<number | undefined> | undefined;
    
    sum: number | undefined;
    
    diceCount: number;
    
    allRolled: boolean;
}
interface DiceRollerProps {
    
    values?: Array<number | undefined>;
    
    diceCount?: number;
    
    render: (props: DiceRollerRenderProps) => ReactNode;
    
    className?: string;
}

declare function DiceRoller({ values, diceCount, render, className, }: DiceRollerProps): react_jsx_runtime.JSX.Element;

interface PhaseIndicatorProps {
    
    currentPhase: string;
    
    phaseLabels?: Record<string, string>;
    
    isMyTurn?: boolean;
    
    activePlayerNames?: string[];
    
    variant?: "badge" | "bar" | "minimal";
    
    className?: string;
}

declare function PhaseIndicator({ currentPhase, phaseLabels, isMyTurn, activePlayerNames, variant, className, }: PhaseIndicatorProps): react_jsx_runtime.JSX.Element;

interface PlayerScore {
    
    playerId: string;
    
    name: string;
    
    score: number;
    
    isWinner?: boolean;
    
    details?: Record<string, number>;
}
interface GameEndDisplayProps {
    
    isGameOver: boolean;
    
    scores: PlayerScore[];
    
    winnerMessage?: string;
    
    showDetails?: boolean;
    
    onReturnToLobby?: () => void;
    
    className?: string;
}

declare function GameEndDisplay({ isGameOver, scores, winnerMessage, showDetails, onReturnToLobby, className, }: GameEndDisplayProps): react_jsx_runtime.JSX.Element | null;

interface NetworkNode {
    
    id: string;
    
    label?: string;
    
    position: {
        x: number;
        y: number;
    };
    
    type?: string;
    
    data?: Record<string, unknown>;
}
interface NetworkEdge {
    
    id: string;
    
    from: string;
    
    to: string;
    
    label?: string | number;
    
    owner?: string;
    
    type?: string;
    
    data?: Record<string, unknown>;
}
interface NetworkPiece {
    
    id: string;
    
    nodeId: string;
    
    owner?: string;
    
    type?: string;
    
    data?: Record<string, unknown>;
}
interface NetworkGraphProps {
    
    nodes: NetworkNode[];
    
    edges: NetworkEdge[];
    
    pieces: NetworkPiece[];
    
    renderNode: (node: NetworkNode, pieces: NetworkPiece[]) => ReactNode;
    
    renderEdge: (edge: NetworkEdge, fromNode: NetworkNode, toNode: NetworkNode) => ReactNode;
    
    renderPiece: (piece: NetworkPiece, position: {
        x: number;
        y: number;
    }) => ReactNode;
    
    width?: number | string;
    
    height?: number | string;
    
    nodeRadius?: number;
    
    enablePanZoom?: boolean;
    
    initialZoom?: number;
    
    minZoom?: number;
    
    maxZoom?: number;
    
    padding?: number;
    
    className?: string;
}

declare function NetworkGraph({ nodes, edges, pieces, renderNode, renderEdge, renderPiece, width, height, nodeRadius, enablePanZoom, initialZoom, minZoom, maxZoom, padding, className, }: NetworkGraphProps): react_jsx_runtime.JSX.Element;

interface ZoneShape {
    
    type: "polygon" | "path" | "circle";
    
    points?: Array<{
        x: number;
        y: number;
    }>;
    
    path?: string;
    
    center?: {
        x: number;
        y: number;
    };
    
    radius?: number;
}
interface ZoneDefinition {
    
    id: string;
    
    name: string;
    
    adjacentTo: string[];
    
    shape?: ZoneShape;
    
    value?: number;
    
    type?: string;
    
    data?: Record<string, unknown>;
}
interface ZonePiece {
    
    id: string;
    
    zoneId: string;
    
    type: string;
    
    owner?: string;
    
    count?: number;
    
    data?: Record<string, unknown>;
}
interface ZoneMapProps {
    
    zones: ZoneDefinition[];
    
    pieces: ZonePiece[];
    
    renderZone: (zone: ZoneDefinition, pieces: ZonePiece[]) => ReactNode;
    
    backgroundImage?: string;
    
    width?: number | string;
    
    height?: number | string;
    
    enablePanZoom?: boolean;
    
    initialZoom?: number;
    
    minZoom?: number;
    
    maxZoom?: number;
    
    className?: string;
}
type ZoneHighlightType = "valid" | "selected" | "attack" | "defend" | "neutral";

declare function ZoneMap({ zones, pieces, renderZone, backgroundImage, width, height, enablePanZoom, initialZoom, minZoom, maxZoom, className, }: ZoneMapProps): react_jsx_runtime.JSX.Element;

interface TrackSpace {
    
    id: string;
    
    index: number;
    
    name?: string;
    
    type?: string;
    
    nextSpaces?: string[];
    
    jumpTo?: string;
    
    position: {
        x: number;
        y: number;
    };
    
    data?: Record<string, unknown>;
}
interface TrackPiece {
    
    id: string;
    
    spaceId: string;
    
    owner: string;
    
    type?: string;
    
    data?: Record<string, unknown>;
}
interface TrackBoardProps {
    
    spaces: TrackSpace[];
    
    pieces: TrackPiece[];
    
    type?: "linear" | "circular" | "branching";
    
    renderSpace: (space: TrackSpace, pieces: TrackPiece[]) => ReactNode;
    
    renderConnection?: (from: {
        x: number;
        y: number;
    }, to: {
        x: number;
        y: number;
    }, fromSpace: TrackSpace, toSpace: TrackSpace) => ReactNode;
    
    renderJump?: (from: {
        x: number;
        y: number;
    }, to: {
        x: number;
        y: number;
    }, fromSpace: TrackSpace, toSpace: TrackSpace, isUp: boolean) => ReactNode;
    
    width?: number | string;
    
    height?: number | string;
    
    enablePanZoom?: boolean;
    
    initialZoom?: number;
    
    minZoom?: number;
    
    maxZoom?: number;
    
    className?: string;
}

declare function TrackBoard({ spaces, pieces, type, renderSpace, renderConnection, renderJump, width, height, enablePanZoom, initialZoom, minZoom, maxZoom, className, }: TrackBoardProps): react_jsx_runtime.JSX.Element;

interface SlotDefinition {
    
    id: string;
    
    name: string;
    
    description?: string;
    
    capacity: number;
    
    exclusive?: boolean;
    
    owner?: string;
    
    group?: string;
    
    cost?: Record<string, number>;
    
    reward?: Record<string, number>;
    
    type?: string;
    
    position?: {
        x: number;
        y: number;
    };
    
    data?: Record<string, unknown>;
}
interface SlotOccupant {
    
    pieceId: string;
    
    playerId: string;
    
    slotId: string;
    
    data?: Record<string, unknown>;
}
interface SlotSystemProps {
    
    slots: SlotDefinition[];
    
    occupants: SlotOccupant[];
    
    renderSlot: (slot: SlotDefinition, occupants: SlotOccupant[]) => ReactNode;
    
    layout?: "grid" | "list" | "grouped";
    
    width?: number | string;
    
    height?: number | string;
    
    minSlotWidth?: number;
    
    className?: string;
}

declare function SlotSystem({ slots, occupants, renderSlot, layout, width, height, minSlotWidth, className, }: SlotSystemProps): react_jsx_runtime.JSX.Element;

interface GridCell {
    
    row: number;
    
    col: number;
    
    type?: string;
    
    data?: Record<string, unknown>;
}
interface GridPiece {
    
    id: string;
    
    row: number;
    
    col: number;
    
    type: string;
    
    owner?: string;
    
    data?: Record<string, unknown>;
}
interface SquareGridProps {
    
    rows: number;
    
    cols: number;
    
    pieces: GridPiece[];
    
    cellSize?: number;
    
    renderCell: (row: number, col: number) => ReactNode;
    
    renderPiece: (piece: GridPiece) => ReactNode;
    
    showCoordinates?: boolean;
    
    coordinateStyle?: "algebraic" | "numeric" | "none";
    
    width?: number | string;
    
    height?: number | string;
    
    enablePanZoom?: boolean;
    
    initialZoom?: number;
    
    minZoom?: number;
    
    maxZoom?: number;
    
    className?: string;
}
interface DefaultGridCellProps {
    
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

declare function DefaultGridCell({ size, isLight, lightColor, darkColor, isHighlighted, highlightColor, isSelected, selectedColor, isValidMove, isCapture, onClick, onPointerEnter, onPointerLeave, className, }: DefaultGridCellProps): react_jsx_runtime.JSX.Element;
interface DefaultGridPieceProps {
    
    size: number;
    
    color?: string;
    
    strokeColor?: string;
    
    label?: string;
    
    isDragging?: boolean;
    
    onClick?: () => void;
    
    onPointerDown?: (e: React.PointerEvent) => void;
    
    className?: string;
}

declare function DefaultGridPiece({ size, color, strokeColor, label, isDragging, onClick, onPointerDown, className, }: DefaultGridPieceProps): react_jsx_runtime.JSX.Element;
interface DefaultChessPieceProps {
    
    size: number;
    
    type: string;
    
    owner: "white" | "black";
    
    onClick?: () => void;
    
    onPointerDown?: (e: React.PointerEvent) => void;
    
    className?: string;
}

declare function DefaultChessPiece({ size, type, owner, onClick, onPointerDown, className, }: DefaultChessPieceProps): react_jsx_runtime.JSX.Element;

declare function toAlgebraic(row: number, col: number, totalRows: number): string;

declare function toNumeric(row: number, col: number): string;
declare function SquareGrid({ rows, cols, pieces, cellSize, renderCell, renderPiece, showCoordinates, coordinateStyle, width, height, enablePanZoom, initialZoom, minZoom, maxZoom, className, }: SquareGridProps): react_jsx_runtime.JSX.Element;

type HexOrientation = "pointy-top" | "flat-top";
interface EdgePosition {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    midX: number;
    midY: number;
    angle: number;
}

interface InteractiveVertex {
    
    id: string;
    
    position: {
        x: number;
        y: number;
    };
    
    adjacentTileIds: string[];
    
    cornerIndex: number;
}

interface InteractiveEdge {
    
    id: string;
    
    position: EdgePosition;
    
    adjacentTileIds: string[];
    
    edgeIndex: number;
}
interface HexGridProps {
    
    tiles: HexTileState[];
    
    edges: HexEdgeState[];
    
    vertices: HexVertexState[];
    
    orientation?: HexOrientation;
    
    hexSize?: number;
    
    renderTile: (tile: HexTileState) => ReactNode;
    
    renderEdge: (edge: HexEdgeState, position: EdgePosition) => ReactNode;
    
    renderVertex: (vertex: HexVertexState, position: {
        x: number;
        y: number;
    }) => ReactNode;
    
    width?: number | string;
    
    height?: number | string;
    
    enablePanZoom?: boolean;
    
    initialZoom?: number;
    
    minZoom?: number;
    
    maxZoom?: number;
    
    className?: string;
    
    interactiveVertices?: boolean;
    
    interactiveEdges?: boolean;
    
    onInteractiveVertexClick?: (vertex: InteractiveVertex) => void;
    
    onInteractiveVertexEnter?: (vertex: InteractiveVertex) => void;
    
    onInteractiveVertexLeave?: (vertex: InteractiveVertex) => void;
    
    onInteractiveEdgeClick?: (edge: InteractiveEdge) => void;
    
    onInteractiveEdgeEnter?: (edge: InteractiveEdge) => void;
    
    onInteractiveEdgeLeave?: (edge: InteractiveEdge) => void;
    
    renderInteractiveVertex?: (vertex: InteractiveVertex, isHovered: boolean) => ReactNode;
    
    renderInteractiveEdge?: (edge: InteractiveEdge, isHovered: boolean) => ReactNode;
    
    interactiveVertexSize?: number;
    
    interactiveEdgeSize?: number;
}
interface DefaultHexTileProps {
    
    size: number;
    
    fill: string;
    
    stroke?: string;
    
    strokeWidth?: number;
    
    isSelected?: boolean;
    
    isHighlighted?: boolean;
    
    label?: string;
    
    showCoordinates?: boolean;
    
    coordinates?: {
        q: number;
        r: number;
    };
    
    orientation?: HexOrientation;
    
    onClick?: () => void;
    
    onPointerEnter?: () => void;
    
    onPointerLeave?: () => void;
    
    className?: string;
}

declare function DefaultHexTile({ size, fill, stroke, strokeWidth, isSelected, isHighlighted, label, showCoordinates, coordinates, orientation, onClick, onPointerEnter, onPointerLeave, className, }: DefaultHexTileProps): react_jsx_runtime.JSX.Element;
interface DefaultHexEdgeProps {
    
    position: EdgePosition;
    
    color: string;
    
    hasOwner?: boolean;
    
    strokeWidth?: number;
    
    touchTargetSize?: number;
    
    onClick?: () => void;
    
    className?: string;
}

declare function DefaultHexEdge({ position, color, hasOwner, strokeWidth, touchTargetSize, onClick, className, }: DefaultHexEdgeProps): react_jsx_runtime.JSX.Element;
interface DefaultHexVertexProps {
    
    position: {
        x: number;
        y: number;
    };
    
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

declare function DefaultHexVertex({ position, color, stroke, strokeWidth, hasOwner, isSelected, isHighlighted, size, touchTargetSize, shape, onClick, onPointerEnter, onPointerLeave, className, }: DefaultHexVertexProps): react_jsx_runtime.JSX.Element;
declare const hexUtils: {
    
    axialToPixel(q: number, r: number, size: number, orientation: HexOrientation): {
        x: number;
        y: number;
    };
    
    getNeighbors(q: number, r: number): Array<{
        q: number;
        r: number;
    }>;
    
    getDistance(q1: number, r1: number, q2: number, r2: number): number;
    
    getHexCorners(centerX: number, centerY: number, size: number, orientation: HexOrientation): Array<{
        x: number;
        y: number;
    }>;
    
    getHexPoints(centerX: number, centerY: number, size: number, orientation: HexOrientation): string;
    
    getEdgePosition(hex1Pos: {
        x: number;
        y: number;
    }, hex2Pos: {
        x: number;
        y: number;
    }, size: number): EdgePosition;
    
    getVertexPosition(hex1Pos: {
        x: number;
        y: number;
    }, hex2Pos: {
        x: number;
        y: number;
    }, hex3Pos: {
        x: number;
        y: number;
    }): {
        x: number;
        y: number;
    };
    
    generateInteractiveVertices(tiles: HexTileState[], hexSize: number, orientation: HexOrientation): InteractiveVertex[];
    
    generateInteractiveEdges(tiles: HexTileState[], hexSize: number, orientation: HexOrientation): InteractiveEdge[];
};
declare function HexGrid({ tiles, edges, vertices, orientation, hexSize, renderTile, renderEdge, renderVertex, width, height, enablePanZoom, initialZoom, minZoom, maxZoom, className, interactiveVertices, interactiveEdges, onInteractiveVertexClick, onInteractiveVertexEnter, onInteractiveVertexLeave, onInteractiveEdgeClick, onInteractiveEdgeEnter, onInteractiveEdgeLeave, renderInteractiveVertex, renderInteractiveEdge, interactiveVertexSize, interactiveEdgeSize, }: HexGridProps): react_jsx_runtime.JSX.Element;

export { ActionButton, ActionGroup, ActionPanel, Card, ConnectedCard, CostDisplay, DefaultChessPiece, DefaultGridCell, DefaultGridPiece, DefaultHexEdge, DefaultHexTile, DefaultHexVertex, DiceRoller, Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerPortal, DrawerTitle, DrawerTrigger, ErrorBoundary, GameEndDisplay, GameSkeleton, Hand, HexGrid, HistoryNavigator, NetworkGraph, PhaseIndicator, PlayArea, PlayerInfo, PlayerSwitcher, PluginRuntime, ResourceCounter, SlotSystem, SquareGrid, ToastProvider, TrackBoard, ZoneMap, hexUtils, toAlgebraic, toNumeric, useToast };
export type { ActionButtonProps, ActionGroupProps, ActionPanelProps, CardItem, CardProps, ConnectedCardProps, CostDisplayProps, DefaultChessPieceProps, DefaultGridCellProps, DefaultGridPieceProps, DefaultHexEdgeProps, DefaultHexTileProps, DefaultHexVertexProps, DiceRollerProps, EdgePosition, ErrorBoundaryProps, GameEndDisplayProps, GameSkeletonProps, GridCell, GridPiece, HandProps, HexGridProps, HexOrientation, HistoryNavigatorProps, NetworkEdge, NetworkGraphProps, NetworkNode, NetworkPiece, PhaseIndicatorProps, PlayAreaProps, PlayerInfoProps, PlayerScore, PlayerSwitcherProps, PluginRuntimeProps, ResourceCounterProps, ResourceDefinition, ResourceDisplayConfig, SlotDefinition, SlotOccupant, SlotSystemProps, SquareGridProps, Toast, ToastType, TrackBoardProps, TrackPiece, TrackSpace, ZoneDefinition, ZoneHighlightType, ZoneMapProps, ZonePiece, ZoneShape };
