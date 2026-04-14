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

  export type WindowId = string;
  export type WindowInstanceId<_Name extends WindowId> = string;
  export type WindowActionName<_Name extends WindowId> = string;
  export type WindowActionParams<
    _Name extends WindowId,
    _Action extends WindowActionName<_Name>,
  > = Record<string, unknown> | undefined;
  export type WindowActionArgs<
    _Name extends WindowId,
    _Action extends WindowActionName<_Name>,
  > = [] | [Record<string, unknown>];
  export type WindowActionCommand<_Name extends WindowId> =
    | { type: string }
    | { type: string; params?: Record<string, unknown> };
  export type WindowCommands<_Name extends WindowId> = Record<
    string,
    (...args: [] | [Record<string, unknown>]) => {
      type: string;
      params?: Record<string, unknown>;
    }
  >;

  const uiContract: any;
  export default uiContract;
  export const uiStateSchema: any;
  export const uiContractSchema: any;
  export const phaseCommands: Record<string, PhaseCommands<string>>;
  export const windowCommands: Record<string, WindowCommands<string>>;
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

  const manifestContract: any;
  export default manifestContract;
  export const literals: any;
  export const ids: any;
}
