declare module "@dreamboard/ui-contract" {
  export type ViewName = string;
  export type GameView = Record<string, unknown>;
  export type InferView<_Name extends ViewName> = GameView;

  export type ActionName = string;
  export type ActionParams<_Name extends ActionName> = Record<string, unknown>;
  export type ActionArgs<_Name extends ActionName> =
    | []
    | [Record<string, unknown>];
  export type PhaseName = string;
  export type ActionNameForPhase<_Phase extends PhaseName> = ActionName;
  export type ActionParamsForPhase<
    _Phase extends PhaseName,
    _Name extends ActionNameForPhase<_Phase>,
  > = Record<string, unknown>;
  export type ActionArgsForPhase<
    _Phase extends PhaseName,
    _Name extends ActionNameForPhase<_Phase>,
  > = [] | [Record<string, unknown>];
  export type ActionCommandForPhase<_Phase extends PhaseName> =
    | { type: string }
    | { type: string; params?: Record<string, unknown> };
  export type PhaseCommands<_Phase extends PhaseName> = Record<
    string,
    (...args: [] | [Record<string, unknown>]) => {
      type: string;
      params?: Record<string, unknown>;
    }
  >;

  export type PromptId = string;
  export type PromptResponse<_Name extends PromptId> = unknown;
  export type PromptInstanceId<_Name extends PromptId> = string;

  const uiContract: any;
  export default uiContract;
  export const uiStateSchema: any;
  export const uiContractSchema: any;
  export const phaseCommands: Record<string, PhaseCommands<string>>;
}

declare module "@dreamboard/manifest-contract" {
  export type PlayerId = string;
  export type ResourceId = string;
  export type CardId = string;
  export type DeckId = string;
  export type HandId = string;
  export type CardProperties = Record<string, unknown>;
  export type CardPropertiesByType = Record<string, CardProperties>;
  export type CardIdsByDeckId = Record<DeckId, CardId[]>;
  export type CardIdsByHandId = Record<HandId, CardId[]>;
  export type StateName = string;
  export type ActivePlayerStateName = string;
  export const AllActivePlayerStateNames: ActivePlayerStateName[];
  export type GlobalState = Record<string, unknown>;
  export type PlayerState = Record<string, unknown>;
  export type ActionName = string;
  export type ActionParametersFor<_ extends ActionName> = Record<
    string,
    unknown
  >;
  export type ActionsForPhase = Record<ActivePlayerStateName, ActionName[]>;
  export const ActionsByPhase: {
    [K in ActivePlayerStateName]: ActionsForPhase[K];
  };
  export type BoardId = string;
  export type DieId = string;
  export type TileId = string;
  export type TileTypeId = string;
  export type EdgeId = [TileId, TileId];
  export type EdgeTypeId = string;
  export type VertexId = [TileId, TileId, TileId];
  export type VertexTypeId = string;
  export type SpaceId = string;
  export type SpaceTypeId = string;
  export type PieceId = string;
  export type PieceTypeId = string;
  export type TilePropertiesByBoardId = Record<BoardId, Record<string, string>>;
  export type EdgePropertiesByBoardId = Record<BoardId, Record<string, string>>;
  export type VertexPropertiesByBoardId = Record<
    BoardId,
    Record<string, string>
  >;
  export type SpacePropertiesByBoardId = Record<
    BoardId,
    Record<string, string>
  >;
  export type PiecePropertiesByBoardId = Record<
    BoardId,
    Record<string, string>
  >;
  export type BoardState<BoardIdValue extends BoardId = BoardId> = Record<
    string,
    unknown
  > & { id: BoardIdValue };
  export type BoardFields<BoardIdValue extends BoardId = BoardId> = Record<
    string,
    unknown
  >;
  export type BoardSpaceStateByBoardId = Record<
    BoardId,
    Record<string, unknown>
  >;
  export type BoardSpaceState<BoardIdValue extends BoardId = BoardId> = Record<
    string,
    unknown
  >;
  export type BoardSpaceFields<BoardIdValue extends BoardId = BoardId> = Record<
    string,
    unknown
  >;
  export type BoardRelationStateByBoardId = Record<
    BoardId,
    Record<string, unknown>
  >;
  export type BoardRelationState<BoardIdValue extends BoardId = BoardId> =
    Record<string, unknown>;
  export type BoardRelationFields<BoardIdValue extends BoardId = BoardId> =
    Record<string, unknown>;
  export type BoardContainerStateByBoardId = Record<
    BoardId,
    Record<string, unknown>
  >;
  export type BoardContainerState<BoardIdValue extends BoardId = BoardId> =
    Record<string, unknown>;
  export type BoardContainerFields<BoardIdValue extends BoardId = BoardId> =
    Record<string, unknown>;
  export type HexEdgeState<BoardIdValue extends BoardId = BoardId> = Record<
    string,
    unknown
  >;
  export type HexEdgeFields<BoardIdValue extends BoardId = BoardId> = Record<
    string,
    unknown
  >;
  export type HexVertexState<BoardIdValue extends BoardId = BoardId> = Record<
    string,
    unknown
  >;
  export type HexVertexFields<BoardIdValue extends BoardId = BoardId> = Record<
    string,
    unknown
  >;
  export type SquareEdgeState<BoardIdValue extends BoardId = BoardId> = Record<
    string,
    unknown
  >;
  export type SquareEdgeFields<BoardIdValue extends BoardId = BoardId> = Record<
    string,
    unknown
  >;
  export type SquareVertexState<BoardIdValue extends BoardId = BoardId> =
    Record<string, unknown>;
  export type SquareVertexFields<BoardIdValue extends BoardId = BoardId> =
    Record<string, unknown>;
  export type TiledBoardId = BoardId;
  export type TiledEdgeState<BoardIdValue extends TiledBoardId = TiledBoardId> =
    Record<string, unknown>;
  export type TiledEdgeFields<
    BoardIdValue extends TiledBoardId = TiledBoardId,
  > = Record<string, unknown>;
  export type TiledVertexState<
    BoardIdValue extends TiledBoardId = TiledBoardId,
  > = Record<string, unknown>;
  export type TiledVertexFields<
    BoardIdValue extends TiledBoardId = TiledBoardId,
  > = Record<string, unknown>;

  const manifestContract: any;
  export default manifestContract;
  export const literals: any;
  export const ids: any;
  export const boardHelpers: any;
}
