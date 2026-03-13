import { PlayerId, CardIdsByDeckId, CardIdsByHandId, HandId, CardId, CardProperties, GlobalState, PlayerState, StateName, BoardId, TileId, TileTypeId, TilePropertiesByBoardId, EdgeTypeId, EdgePropertiesByBoardId, VertexTypeId, VertexPropertiesByBoardId, PieceId, PieceTypeId, SpaceId, SpaceTypeId, DieId, ActionName } from '@dreamboard/manifest';
import { AnyUIArgs } from '@dreamboard/ui-args';
import * as react_jsx_runtime from 'react/jsx-runtime';

interface ValidationResult {
    
    valid: boolean;
    
    errorCode?: string;
    
    message?: string;
}

interface PluginSessionState$1 {
    
    status: "loading" | "ready";
    
    sessionId: string | null;
    
    controllablePlayerIds: string[];
    
    controllingPlayerId: string | null;
    
    userId: string | null;
}

interface RuntimeAPI {
    
    validateAction: (playerId: string, actionType: string, params: Record<string, unknown>) => Promise<ValidationResult>;
    
    submitAction: (playerId: string, actionType: string, params: Record<string, unknown>) => Promise<void>;
    
    getSessionState: () => PluginSessionState$1;
    
    disconnect: () => void;
    
    switchPlayer?: (playerId: string) => void;
}

interface PluginContext {
    
    runtime: RuntimeAPI;
    
    sessionId: string;
    
    playerId: string | null;
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

interface PluginSessionState {
    
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
    
    session: PluginSessionState;
    
    history: HistoryState | null;
    
    syncId: number;
}

interface StateSyncMessage {
    type: "state-sync";
    
    syncId: number;
    
    state: PluginStateSnapshot;
}

interface StateAckMessage {
    type: "state-ack";
    
    syncId: number;
}

interface PluginStateProviderProps {
    children: React.ReactNode;
    
    loadingComponent?: React.ReactNode;
}

declare function PluginStateProvider({ children, loadingComponent, }: PluginStateProviderProps): react_jsx_runtime.JSX.Element;

declare function usePluginStateSnapshot(): PluginStateSnapshot;

declare function usePluginState<T>(selector: (state: PluginStateSnapshot) => T): T;

declare function usePluginActions(): {
    
    markNotificationRead: (notificationId: string) => void;
    
    switchPlayer: (playerId: string) => void;
    
    submitAction: (playerId: string, actionType: string, params: Record<string, unknown>) => Promise<void>;
};

export { PluginStateProvider, usePluginActions, usePluginState, usePluginStateSnapshot };
export type { ActionRejectedPayload, BoardStates, CardInfo, DiceStates, DieState, ErrorPayload, GameEndedPayload, GameState, HexBoardState, HexEdgeState, HexTileState, HexVertexState, LobbyState, NetworkBoardState, NetworkEdgeState, NetworkNodeState, NetworkPieceState, Notification, NotificationPayload, NotificationType, PluginContext, PluginSessionState$1 as PluginSessionState, PluginStateProviderProps, PluginStateSnapshot, PublicHandsByHandId, PublicHandsByPlayerId, RuntimeAPI, SquareBoardState, SquareCellState, SquarePieceState, StateAckMessage, StateSyncMessage, TrackBoardState, TrackPieceState, TrackSpaceState, TurnChangedPayload, ValidationResult, YourTurnPayload };
