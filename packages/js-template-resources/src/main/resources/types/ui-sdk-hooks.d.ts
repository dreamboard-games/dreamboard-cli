import { PlayerId, CardIdsByDeckId, CardIdsByHandId, HandId, CardId, CardProperties, GlobalState, PlayerState, StateName, BoardId, TileId, TileTypeId, TilePropertiesByBoardId, EdgeTypeId, EdgePropertiesByBoardId, VertexTypeId, VertexPropertiesByBoardId, PieceId, PieceTypeId, SpaceId, SpaceTypeId, DieId, ActionName, ActivePlayerStateName, ActionsForPhase, ActionParametersFor, ResourceId, EdgeId, VertexId } from '@dreamboard/manifest';
import { AnyUIArgs, UIArgsResult } from '@dreamboard/ui-args';
import { RefObject } from 'react';

interface Player {
    
    playerId: PlayerId;
    
    name: string;
    
    isHost?: boolean;
    
    color?: string;
}

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

interface HexBoardState<B extends BoardId = BoardId> {
    
    id: BoardId;
    
    tiles: Array<HexTileState<B>>;
    
    edges: Array<HexEdgeState<B>>;
    
    vertices: Array<HexVertexState<B>>;
}

interface NetworkNodeState {
    
    id: TileId;
    
    x: number;
    
    y: number;
    
    typeId?: TileTypeId;
    
    label?: string;
    
    owner?: PlayerId;
    
    properties?: string;
}

interface NetworkEdgeState {
    
    id: string;
    
    from: TileId;
    
    to: TileId;
    
    typeId?: string;
    
    label?: string;
    
    owner?: PlayerId;
    
    properties?: string;
}

interface NetworkPieceState {
    
    id: PieceId;
    
    nodeId: TileId;
    
    typeId?: PieceTypeId;
    
    owner?: PlayerId;
    
    properties?: string;
}

interface NetworkBoardState {
    
    id: BoardId;
    
    nodes: NetworkNodeState[];
    
    edges: NetworkEdgeState[];
    
    pieces: NetworkPieceState[];
}

interface SquareCellState {
    
    row: number;
    
    col: number;
    
    typeId?: TileTypeId;
    
    owner?: PlayerId;
    
    properties?: string;
}

interface SquarePieceState {
    
    id: PieceId;
    
    row: number;
    
    col: number;
    
    typeId: PieceTypeId;
    
    owner?: PlayerId;
    
    properties?: string;
}

interface SquareBoardState {
    
    id: BoardId;
    
    rows: number;
    
    cols: number;
    
    cells: SquareCellState[];
    
    pieces: SquarePieceState[];
}

interface TrackSpaceState {
    
    id: SpaceId;
    
    index: number;
    
    x: number;
    
    y: number;
    
    name?: string;
    
    typeId?: SpaceTypeId;
    
    owner?: PlayerId;
    
    nextSpaces?: SpaceId[];
    
    properties?: string;
}

interface TrackPieceState {
    
    id: PieceId;
    
    spaceId: SpaceId;
    
    owner: PlayerId;
    
    typeId?: PieceTypeId;
    
    properties?: string;
}

interface TrackBoardState {
    
    id: BoardId;
    
    spaces: TrackSpaceState[];
    
    pieces: TrackPieceState[];
}

interface DieState {
    
    id: DieId;
    
    sides: number;
    
    currentValue?: number;
    
    color?: string;
}

interface BoardStates {
    
    hex: Record<BoardId, HexBoardState>;
    
    network: Record<BoardId, NetworkBoardState>;
    
    square: Record<BoardId, SquareBoardState>;
    
    track: Record<BoardId, TrackBoardState>;
}

type DiceStates = Record<DieId, DieState>;

interface CardInfo {
    
    id: CardId;
    cardName?: string;
    cardType: string;
    description?: string;
    
    properties: CardProperties;
}

type PublicHandsByPlayerId = Record<PlayerId, CardId[]>;

type PublicHandsByHandId = Record<HandId, PublicHandsByPlayerId>;
interface GameState {
    
    currentPlayerIds: PlayerId[];
    decks: CardIdsByDeckId;
    hands: CardIdsByHandId;
    
    publicHands: PublicHandsByHandId;
    
    cards: Record<CardId, CardInfo>;
    globalVariables: GlobalState;
    playerVariables: Record<PlayerId, PlayerState>;
    
    playerResources: Record<PlayerId, Record<string, number>>;
    currentState: StateName;
    isMyTurn: boolean;
    uiArgs?: Record<PlayerId, AnyUIArgs>;
    boards: BoardStates;
    dice: DiceStates;
}

declare function useGameState(): GameState;

declare function useGameSelector<T>(selector: (state: GameState) => T): T;

declare function useUIArgs(): UIArgsResult;

declare function useCard(cardId: CardId | null): CardItem | undefined;
declare function useCards(cardIds: CardId[]): Array<CardItem | undefined>;

declare function useMyHand(handId: HandId): CardId[];

declare function usePublicHands(handId: HandId): PublicHandsByPlayerId;

interface SeatAssignment {
    playerId: PlayerId;
    controllerUserId?: string;
    displayName: string;
    playerColor?: string;
    isHost?: boolean;
}
interface HistoryEntrySummary {
    id: string;
    version: number;
    timestamp: string;
    description: string;
    playerId?: PlayerId;
    actionType?: ActionName;
    isCurrent: boolean;
}

interface LobbyState {
    
    seats: SeatAssignment[];
    
    canStart: boolean;
    
    hostUserId: string;
}

type NotificationType = "YOUR_TURN" | "ACTION_EXECUTED" | "ACTION_REJECTED" | "TURN_CHANGED" | "STATE_CHANGED" | "GAME_ENDED" | "ERROR";

interface YourTurnPayload {
    type: "YOUR_TURN";
}

interface ActionExecutedPayload {
    type: "ACTION_EXECUTED";
    playerId: string;
    actionType: string;
}

interface ActionRejectedPayload {
    type: "ACTION_REJECTED";
    reason: string;
    targetPlayer?: string;
}

interface StateChangedPayload {
    type: "STATE_CHANGED";
    newState: string;
}

interface TurnChangedPayload {
    type: "TURN_CHANGED";
    previousPlayers: string[];
    currentPlayers: string[];
}

interface GameEndedPayload {
    type: "GAME_ENDED";
    winner?: string;
    finalScores: Record<string, number>;
    reason: string;
}

interface ErrorPayload {
    type: "ERROR";
    message: string;
    code?: string;
}

type NotificationPayload = YourTurnPayload | ActionExecutedPayload | ActionRejectedPayload | TurnChangedPayload | StateChangedPayload | GameEndedPayload | ErrorPayload;

interface Notification {
    
    id: string;
    
    type: NotificationType;
    
    payload: NotificationPayload;
    
    timestamp: number;
    
    read: boolean;
}

interface PluginSessionState$1 {
    
    sessionId: string | null;
    
    controllablePlayerIds: string[];
    
    controllingPlayerId: string | null;
    
    userId: string | null;
}

interface HistoryState {
    
    entries: HistoryEntrySummary[];
    
    currentIndex: number;
    
    canGoBack: boolean;
    
    canGoForward: boolean;
}

interface PluginStateSnapshot {
    
    game: GameState | null;
    
    lobby: LobbyState | null;
    
    notifications: Notification[];
    
    session: PluginSessionState$1;
    
    history: HistoryState | null;
    
    syncId: number;
}

declare function useLobby(): LobbyState;

declare class ValidationError extends Error {
    readonly errorCode?: string | undefined;
    constructor(errorCode?: string | undefined, message?: string);
}

declare function useAction(): UseActionResult;
type ActionSubmitter<A extends ActionName> = (params: ActionParametersFor<A>) => Promise<void>;
type PhaseActionSubmitters<P extends ActivePlayerStateName> = {
    [K in ActionsForPhase[P][number]]: ActionSubmitter<K>;
};
type UseActionResult = {
    [P in ActivePlayerStateName as `${P}Actions`]: PhaseActionSubmitters<P> | null;
};

interface GameNotificationHandlers {
    
    onYourTurn?: () => void;
    
    onActionRejected?: (message: {
        reason: string;
        targetPlayer?: string;
    }) => void;
    
    onTurnChanged?: (message: {
        previousPlayers: string[];
        currentPlayers: string[];
    }) => void;
    
    onGameEnded?: (message: {
        winner?: string;
        finalScores: Record<string, number>;
        reason: string;
    }) => void;
    
    onError?: (message: {
        message: string;
        code?: string;
    }) => void;
}

declare function useGameNotifications(handlers: GameNotificationHandlers): void;

declare function useNotifications(): {
    notifications: Notification[];
    markAsRead: (notificationId: string) => void;
    unreadCount: number;
};

declare function useMe(): Player;

declare function usePlayerInfo(): Map<PlayerId, Player>;

type PlayerResources = Record<ResourceId, number>;

declare function useMyResources(): PlayerResources;

declare function usePlayerResources(playerId: PlayerId): PlayerResources;

declare function useAllPlayerResources(): Record<PlayerId, PlayerResources>;

interface ValidationResult {
    
    valid: boolean;
    
    errorCode?: string;
    
    message?: string;
}

interface PluginSessionState {
    
    status: "loading" | "ready";
    
    sessionId: string | null;
    
    controllablePlayerIds: string[];
    
    controllingPlayerId: string | null;
    
    userId: string | null;
}

interface RuntimeAPI {
    
    validateAction: (playerId: string, actionType: string, params: Record<string, unknown>) => Promise<ValidationResult>;
    
    submitAction: (playerId: string, actionType: string, params: Record<string, unknown>) => Promise<void>;
    
    getSessionState: () => PluginSessionState;
    
    disconnect: () => void;
    
    switchPlayer?: (playerId: string) => void;
}

interface PluginRuntimeAPI extends RuntimeAPI {
    
    getSnapshot: () => PluginStateSnapshot | null;
    
    subscribeToState: (listener: (state: PluginStateSnapshot) => void) => () => void;
    
    _subscribeToSessionState: (listener: (state: PluginSessionState) => void) => () => void;
    
    restoreHistory?: (entryId: string) => void;
}

interface UsePluginRuntimeOptions {
    
    timeout?: number;
}
interface UsePluginRuntimeResult {
    
    runtime: PluginRuntimeAPI;
    
    isReady: boolean;
    
    error: string | null;
}

declare function usePluginRuntime(options?: UsePluginRuntimeOptions): UsePluginRuntimeResult;

declare function useHistory(): HistoryState | null;

declare function useIsHost(): boolean;

type CardSize = "sm" | "md" | "lg";
type HandLayout = "spread" | "stack" | "overlap";
interface CardPositionProps {
    
    x: number;
    
    y: number;
    
    zIndex: number;
    
    transformOrigin: string;
}
interface UseHandLayoutOptions {
    
    cardCount: number;
    
    cardSize?: CardSize;
    
    layout?: HandLayout;
    
    containerPadding?: number;
}
interface UseHandLayoutReturn {
    
    containerRef: RefObject<HTMLDivElement | null>;
    
    cardsContainerRef: RefObject<HTMLDivElement | null>;
    
    containerWidth: number;
    
    cardOffset: number;
    
    totalWidth: number;
    
    useDrawerMode: boolean;
    
    cardDimensions: {
        width: number;
        height: number;
    };
    
    constants: {
        hoverLift: number;
        selectedLift: number;
    };
    
    hoveredIndex: number | null;
    
    handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    
    handleMouseLeave: () => void;
    
    getCardPosition: (index: number, isHovered: boolean, isSelected: boolean) => CardPositionProps;
}

declare function useHandLayout({ cardCount, cardSize, layout, containerPadding, }: UseHandLayoutOptions): UseHandLayoutReturn;

declare function useIsMobile(breakpoint?: number): boolean;

declare function useInteractionMode<T extends string | number | symbol>(

derivedMode?: T | null): {
    
    mode: T | null;
    
    isActive: boolean;
    
    isPhaseDriven: boolean;
    
    setMode: (mode: T | null) => void;
    
    clearMode: () => void;
    
    toggleMode: (mode: T) => void;
    
    userMode: T | null;
};
type InteractionModeResult<T extends string | number | symbol> = ReturnType<typeof useInteractionMode<T>>;

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

interface NetworkGraphApi {
    
    getNode: (nodeId: string) => NetworkNode | undefined;
    
    getEdge: (edgeId: string) => NetworkEdge | undefined;
    
    getConnectedNodes: (nodeId: string) => string[];
    
    getEdgesForNode: (nodeId: string) => NetworkEdge[];
    
    getEdgesBetween: (nodeA: string, nodeB: string) => NetworkEdge[];
    
    areAdjacent: (nodeA: string, nodeB: string) => boolean;
    
    getPiecesOnNode: (nodeId: string) => NetworkPiece[];
}

declare function useNetworkGraph(nodes: NetworkNode[], edges: NetworkEdge[], pieces?: NetworkPiece[]): NetworkGraphApi;

interface HexTileData {
    
    id: string;
    
    q: number;
    
    r: number;
    
    type?: string;
    
    data?: Record<string, unknown>;
}
interface UseHexGridReturn {
    
    getTile: (tileId: string) => HexTileData | undefined;
    
    getTileAt: (q: number, r: number) => HexTileData | undefined;
    
    getNeighbors: (tileId: string) => HexTileData[];
    
    getDistance: (fromId: string, toId: string) => number;
    
    getHexesInRange: (centerId: string, range: number) => HexTileData[];
    
    axialToCube: (q: number, r: number) => {
        x: number;
        y: number;
        z: number;
    };
    
    cubeToAxial: (x: number, y: number, z: number) => {
        q: number;
        r: number;
    };
}
declare function useHexGrid(tiles: HexTileData[]): UseHexGridReturn;

interface GridPieceData {
    
    id: string;
    
    row: number;
    
    col: number;
    
    type: string;
    
    owner?: string;
    
    data?: Record<string, unknown>;
}
interface CellData {
    
    row: number;
    
    col: number;
    
    blocked?: boolean;
    
    type?: string;
    
    data?: Record<string, unknown>;
}
type DistanceType = "manhattan" | "chebyshev" | "euclidean";
type NeighborType = "orthogonal" | "diagonal" | "all";
interface UseSquareGridOptions {
    
    rows: number;
    
    cols: number;
    
    pieces?: GridPieceData[];
    
    blockedCells?: Array<{
        row: number;
        col: number;
    }>;
    
    neighborType?: NeighborType;
}
interface UseSquareGridReturn {
    
    getPieceAt: (row: number, col: number) => GridPieceData | undefined;
    
    getPiecesByOwner: (owner: string) => GridPieceData[];
    
    getNeighbors: (row: number, col: number, type?: NeighborType) => Array<{
        row: number;
        col: number;
    }>;
    
    getDistance: (r1: number, c1: number, r2: number, c2: number, type?: DistanceType) => number;
    
    isValidCell: (row: number, col: number) => boolean;
    
    isBlocked: (row: number, col: number) => boolean;
    
    isOccupied: (row: number, col: number) => boolean;
    
    getCellsInRect: (topRow: number, leftCol: number, bottomRow: number, rightCol: number) => Array<{
        row: number;
        col: number;
    }>;
    
    toAlgebraic: (row: number, col: number) => string;
    
    fromAlgebraic: (notation: string) => {
        row: number;
        col: number;
    } | null;
}
declare function useSquareGrid(options: UseSquareGridOptions): UseSquareGridReturn;

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

interface UseZoneMapReturn {
    
    getZone(zoneId: string): ZoneDefinition | undefined;
    
    getAdjacentZones(zoneId: string): string[];
    
    isAdjacent(zone1: string, zone2: string): boolean;
    
    getPiecesInZone(zoneId: string): ZonePiece[];
    
    getPiece(pieceId: string): ZonePiece | undefined;
    
    getPiecesByOwner(playerId: string): ZonePiece[];
    
    getOccupiedZones(): string[];
    
    getEmptyZones(): string[];
    
    getZonesByType(type: string): ZoneDefinition[];
    
    getAllZoneIds(): string[];
    
    getZonesWithOwner(playerId: string): string[];
    
    getZoneCount(): number;
}

declare function useZoneMap(zones: ZoneDefinition[], pieces: ZonePiece[]): UseZoneMapReturn;

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

interface SlotSystemApi {
    
    getSlot: (slotId: string) => SlotDefinition | undefined;
    
    getOccupantsOfSlot: (slotId: string) => SlotOccupant[];
    
    getOccupantsByPlayer: (playerId: string) => SlotOccupant[];
    
    isFull: (slotId: string) => boolean;
    
    isOccupied: (slotId: string) => boolean;
    
    getRemainingCapacity: (slotId: string) => number;
    
    getSlotOfPiece: (pieceId: string) => string | undefined;
    
    getSlotsByGroup: (group: string) => SlotDefinition[];
    
    getSlotsByType: (type: string) => SlotDefinition[];
}

declare function useSlotSystem(slots: SlotDefinition[], occupants: SlotOccupant[]): SlotSystemApi;

interface UseHexBoardReturn {
    
    board: HexBoardState;
    
    tiles: HexTileState[];
    
    edges: HexEdgeState[];
    
    vertices: HexVertexState[];
    
    getTile: (tileId: TileId) => HexTileState | undefined;
    
    getTileAt: (q: number, r: number) => HexTileState | undefined;
    
    getTilesByOwner: (ownerId: PlayerId) => HexTileState[];
    
    getTilesByType: (typeId: TileTypeId) => HexTileState[];
    
    getNeighbors: (tileId: TileId) => HexTileState[];
    
    getEdge: (edgeId: EdgeId) => HexEdgeState | undefined;
    
    getEdgesByOwner: (ownerId: PlayerId) => HexEdgeState[];
    
    getEdgesByType: (typeId: EdgeTypeId) => HexEdgeState[];
    
    getEdgesForTile: (tileId: TileId) => HexEdgeState[];
    
    getVertex: (vertexId: VertexId) => HexVertexState | undefined;
    
    getVerticesByOwner: (ownerId: PlayerId) => HexVertexState[];
    
    getVerticesByType: (typeId: VertexTypeId) => HexVertexState[];
    
    getVerticesForTile: (tileId: TileId) => HexVertexState[];
    
    getDistance: (tileId1: TileId, tileId2: TileId) => number;
}

declare function normalizeEdgeId(edgeId: EdgeId): string;

declare function normalizeVertexId(vertexId: VertexId): string;

declare function useHexBoard(boardId: BoardId): UseHexBoardReturn;

declare function useHexBoardOptional(boardId: BoardId): HexBoardState | undefined;

declare function useHexBoardIds(): BoardId[];

declare function normalizeNetworkEdgeId(edgeId: EdgeId): string;
interface UseNetworkBoardReturn {
    
    board: NetworkBoardState;
    
    nodes: NetworkNodeState[];
    
    edges: NetworkEdgeState[];
    
    pieces: NetworkPieceState[];
    
    getNode: (nodeId: TileId) => NetworkNodeState | undefined;
    
    getNodesByOwner: (ownerId: PlayerId) => NetworkNodeState[];
    
    getNodesByType: (typeId: TileTypeId) => NetworkNodeState[];
    
    getConnectedNodes: (nodeId: TileId) => NetworkNodeState[];
    
    getEdge: (edgeId: EdgeId) => NetworkEdgeState | undefined;
    
    getEdgesByOwner: (ownerId: PlayerId) => NetworkEdgeState[];
    
    getEdgesByType: (typeId: EdgeTypeId) => NetworkEdgeState[];
    
    getEdgesForNode: (nodeId: TileId) => NetworkEdgeState[];
    
    getEdgeBetween: (nodeId1: TileId, nodeId2: TileId) => NetworkEdgeState | undefined;
    
    getPiece: (pieceId: PieceId) => NetworkPieceState | undefined;
    
    getPiecesByOwner: (ownerId: PlayerId) => NetworkPieceState[];
    
    getPiecesByType: (typeId: PieceTypeId) => NetworkPieceState[];
    
    getPiecesOnNode: (nodeId: TileId) => NetworkPieceState[];
    
    areConnected: (nodeId1: TileId, nodeId2: TileId) => boolean;
}

declare function useNetworkBoard(boardId: BoardId): UseNetworkBoardReturn;

declare function useNetworkBoardOptional(boardId: BoardId): NetworkBoardState | undefined;

declare function useNetworkBoardIds(): BoardId[];

interface UseSquareBoardReturn {
    
    board: SquareBoardState;
    
    rows: number;
    
    cols: number;
    
    cells: SquareCellState[];
    
    pieces: SquarePieceState[];
    
    getCell: (row: number, col: number) => SquareCellState | undefined;
    
    getCellsByOwner: (ownerId: PlayerId) => SquareCellState[];
    
    getCellsByType: (typeId: TileTypeId) => SquareCellState[];
    
    getPiece: (pieceId: PieceId) => SquarePieceState | undefined;
    
    getPieceAt: (row: number, col: number) => SquarePieceState | undefined;
    
    getPiecesByOwner: (ownerId: PlayerId) => SquarePieceState[];
    
    getPiecesByType: (typeId: PieceTypeId) => SquarePieceState[];
    
    isValidPosition: (row: number, col: number) => boolean;
    
    isOccupied: (row: number, col: number) => boolean;
    
    getAdjacentPositions: (row: number, col: number) => Array<{
        row: number;
        col: number;
    }>;
}

declare function useSquareBoard(boardId: BoardId): UseSquareBoardReturn;

declare function useSquareBoardOptional(boardId: BoardId): SquareBoardState | undefined;

declare function useSquareBoardIds(): BoardId[];

interface UseTrackBoardReturn {
    
    board: TrackBoardState;
    
    spaces: TrackSpaceState[];
    
    pieces: TrackPieceState[];
    
    getSpace: (spaceId: SpaceId) => TrackSpaceState | undefined;
    
    getSpaceByIndex: (index: number) => TrackSpaceState | undefined;
    
    getSpacesByOwner: (ownerId: PlayerId) => TrackSpaceState[];
    
    getSpacesByType: (typeId: SpaceTypeId) => TrackSpaceState[];
    
    getNextSpaces: (spaceId: SpaceId) => TrackSpaceState[];
    
    getSpacesInOrder: () => TrackSpaceState[];
    
    getPiece: (pieceId: PieceId) => TrackPieceState | undefined;
    
    getPiecesByOwner: (ownerId: PlayerId) => TrackPieceState[];
    
    getPiecesByType: (typeId: PieceTypeId) => TrackPieceState[];
    
    getPiecesOnSpace: (spaceId: SpaceId) => TrackPieceState[];
    
    getDistance: (spaceId1: SpaceId, spaceId2: SpaceId) => number;
    
    getSpaceAfterSteps: (fromSpaceId: SpaceId, steps: number) => TrackSpaceState | undefined;
}

declare function useTrackBoard(boardId: BoardId): UseTrackBoardReturn;

declare function useTrackBoardIds(): BoardId[];

interface UseDieReturn {
    die: DieState;
    id: DieId;
    sides: number;
    currentValue: number | undefined;
    hasRolled: boolean;
    color: string | undefined;
}
interface UseDiceReturn {
    dice: Record<DieId, DieState>;
    diceArray: DieState[];
    count: number;
    values: Array<number | undefined>;
    sum: number | undefined;
    allRolled: boolean;
    getDie: (dieId: DieId) => DieState | undefined;
}
interface UseAllDiceReturn {
    dice: Record<DieId, DieState>;
    diceIds: DieId[];
    count: number;
    hasDice: boolean;
}

declare function useDie(dieId: DieId): UseDieReturn;

declare function useDice(dieIds: DieId[]): UseDiceReturn;

declare function useAllDice(): UseAllDiceReturn;

declare function useDiceIds(): DieId[];

export { ValidationError, normalizeEdgeId, normalizeNetworkEdgeId, normalizeVertexId, useAction, useAllDice, useAllPlayerResources, useCard, useCards, useDice, useDiceIds, useDie, useGameNotifications, useGameSelector, useGameState, useHandLayout, useHexBoard, useHexBoardIds, useHexBoardOptional, useHexGrid, useHistory, useInteractionMode, useIsHost, useIsMobile, useLobby, useMe, useMyHand, useMyResources, useNetworkBoard, useNetworkBoardIds, useNetworkBoardOptional, useNetworkGraph, useNotifications, usePlayerInfo, usePlayerResources, usePluginRuntime, usePublicHands, useSlotSystem, useSquareBoard, useSquareBoardIds, useSquareBoardOptional, useSquareGrid, useTrackBoard, useTrackBoardIds, useUIArgs, useZoneMap };
export type { CardPositionProps, CardSize, CellData, DistanceType, GameNotificationHandlers, GridPieceData, HandLayout, HexTileData, HistoryEntrySummary, HistoryState, InteractionModeResult, LobbyState, NeighborType, NetworkGraphApi, Player, PlayerResources, SlotSystemApi, UseAllDiceReturn, UseDiceReturn, UseDieReturn, UseHandLayoutOptions, UseHandLayoutReturn, UseHexBoardReturn, UseHexGridReturn, UseNetworkBoardReturn, UsePluginRuntimeOptions, UsePluginRuntimeResult, UseSquareBoardReturn, UseSquareGridOptions, UseSquareGridReturn, UseTrackBoardReturn, UseZoneMapReturn };
