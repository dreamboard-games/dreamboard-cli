/**
 * Generated file.
 * Do not edit directly.
 */

import game from "../../app/game";
import {
  createClientParamSchemasByPhase,
} from "@dreamboard/app-sdk/reducer";
import type {
  ClientParamsOfInteractionOfDefinition,
  DefaultedClientParamKeysOfInteractionOfDefinition,
  InteractionIdOfDefinition,
  InteractionIdOfDefinitionPhase,
  PhaseNamesOfDefinition,
  PlayableInteractionsOfZoneOfDefinition,
  StageNamesOfDefinitionPhase,
  SurfaceOfInteractionOfDefinition,
  SurfaceTag,
  ViewNamesOfDefinition,
  ViewOfDefinition,
} from "@dreamboard/app-sdk/reducer";
import {
  createHexBoardView,
  GameShell as GameShellGeneric,
  InteractionField as InteractionFieldGeneric,
  InteractionForm as InteractionFormGeneric,
  useActivePlayers as useActivePlayersGeneric,
  useBoardInteractions as useBoardInteractionsGeneric,
  useInteractionByKey as useInteractionByKeyGeneric,
  usePlayerTurnOrder as usePlayerTurnOrderGeneric,
  type BoardInteractionsContext,
  type BoardInteractionsOptions,
  type BoardSpaceIdOf,
  type ClientParamSchemaMap,
  type GameShellProps,
  type HandSurfaceConfig,
  type HandZoneSpec,
  type HexBoardView,
  type InteractionDescriptor,
  type InteractionFieldProps as InteractionFieldPropsGeneric,
  type InteractionFieldRenderMap,
  type InteractionFormProps as InteractionFormPropsGeneric,
  type InteractionHandle,
} from "@dreamboard/ui-sdk";
import { createElement, useMemo, type ReactElement } from "react";
import {
  literals,
  staticBoards,
  type PlayerId,
  type ZoneId as ManifestZoneId,
} from "../manifest-contract";

type GameDefinition = typeof game;

export type ViewName = ViewNamesOfDefinition<GameDefinition>;
export type InferView<Name extends ViewName> = ViewOfDefinition<
  GameDefinition,
  Name
>;
export type GameView = Extract<"player", ViewName> extends never
  ? never
  : InferView<Extract<"player", ViewName>>;

export type PhaseName = PhaseNamesOfDefinition<GameDefinition>;

// -------------------------------------------------------------------------
// Interaction / Stage / Zone types (authored via defineInteraction/Stage/zones)
// -------------------------------------------------------------------------

/** Union of all interaction ids across phases. */
export type InteractionId = InteractionIdOfDefinition<GameDefinition>;

/** Interactions declared in a specific phase. */
export type InteractionIdForPhase<Phase extends PhaseName> =
  InteractionIdOfDefinitionPhase<GameDefinition, Phase>;

/**
 * Client-facing params type for an interaction, inferred from its input
 * collectors. Engine-sampled collectors (e.g. `rngInput.*`) are omitted
 * — the trusted reducer bundle fills those fields during submit, so the
 * client never supplies them.
 */
export type InteractionParams<
  Phase extends PhaseName,
  Id extends InteractionIdForPhase<Phase>,
> = ClientParamsOfInteractionOfDefinition<GameDefinition, Phase, Id>;

/** Client-facing params with authored input defaults. */
export type InteractionDefaultedKeys<
  Phase extends PhaseName,
  Id extends InteractionIdForPhase<Phase>,
> = DefaultedClientParamKeysOfInteractionOfDefinition<GameDefinition, Phase, Id>;

/** Surface tag for an interaction. */
export type InteractionSurface<
  Phase extends PhaseName,
  Id extends InteractionIdForPhase<Phase>,
> = SurfaceOfInteractionOfDefinition<GameDefinition, Phase, Id>;

/** Phase-qualified interaction key for a specific phase. */
export type InteractionKeyForPhase<Phase extends PhaseName> =
  `${Phase}.${InteractionIdForPhase<Phase>}`;

/** Phase-qualified union of every client/UI interaction key. */
export type InteractionKey = {
  [P in PhaseName]: InteractionKeyForPhase<P>;
}[PhaseName];

type PhaseOfInteractionKey<Key extends InteractionKey> =
  Key extends `${infer P}.${string}` ? Extract<P, PhaseName> : never;

type IdOfInteractionKey<Key extends InteractionKey> =
  Key extends `${infer P}.${infer I}`
    ? P extends PhaseName
      ? Extract<I, InteractionIdForPhase<P>>
      : never
    : never;

/**
 * Union of interaction keys that target the given surface, across all phases.
 * Feed this into surface components like `<PanelSurface<PanelInteractions> />`
 * for exhaustive render-map typing.
 */
export type InteractionsForSurface<S extends SurfaceTag> = {
  [P in PhaseName]: {
    [I in InteractionIdForPhase<P>]: [InteractionSurface<P, I>] extends [S]
      ? `${P}.${I}`
      : never;
  }[InteractionIdForPhase<P>];
}[PhaseName];

export type PanelInteractions = InteractionsForSurface<"panel">;
export type BoardInteractions = InteractionsForSurface<
  "board-vertex" | "board-edge" | "board-tile" | "board-space"
>;
export type HandInteractions = InteractionsForSurface<"hand">;
export type InboxInteractions = InteractionsForSurface<"inbox">;
export type BlockerInteractions = InteractionsForSurface<"blocker">;
export type ChromeInteractions = InteractionsForSurface<"chrome">;

/** Stage names declared in a phase. */
export type StageName<Phase extends PhaseName> = StageNamesOfDefinitionPhase<
  GameDefinition,
  Phase
>;

/** Union of zone ids authored in the workspace manifest. */
export type ZoneId = ManifestZoneId;

type CamelCase<S extends string> = S extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<CamelCase<Tail>>}`
  : S;

/** JS-friendly keys for authored zones, e.g. "dev-hand" -> "devHand". */
export type WorkspaceZoneKey = CamelCase<ZoneId>;

/** Interactions that can be played against a card in the given zone. */
export type PlayableInteractionsOfZone<
  Phase extends PhaseName,
  Z extends ZoneId & string,
> = PlayableInteractionsOfZoneOfDefinition<GameDefinition, Phase, Z>;

/** Interaction descriptor specialised to a concrete phase-qualified key. */
export type InteractionDescriptorFor<Key extends InteractionKey> =
  InteractionDescriptor<Key>;

/**
 * Params shape for a phase-qualified interaction key. Drives strong typing
 * for `useInteractionByKey`'s draft,
 * `submit`, and `setInput`.
 */
export type InteractionParamsOf<Key extends InteractionKey> =
  InteractionParams<PhaseOfInteractionKey<Key>, IdOfInteractionKey<Key>>;

export type InteractionDefaultedKeysOf<Key extends InteractionKey> =
  InteractionDefaultedKeys<PhaseOfInteractionKey<Key>, IdOfInteractionKey<Key>>;

type InteractionParamsShape<Key extends InteractionKey> =
  InteractionParamsOf<Key> extends Record<string, unknown>
    ? InteractionParamsOf<Key>
    : Record<string, unknown>;

type InteractionHandleDefaultedKeys<Key extends InteractionKey> = Extract<
  InteractionDefaultedKeysOf<Key>,
  keyof InteractionParamsShape<Key> & string
>;

/** Params map keyed by phase-qualified interaction key, consumed by typed surface renderers. */
export type InteractionParamsByKey = {
  [K in InteractionKey]: {
    params: InteractionParamsShape<K>;
    defaulted: InteractionHandleDefaultedKeys<K>;
  };
};

export type InteractionFieldRenderers<Key extends InteractionKey> =
  InteractionFieldRenderMap<InteractionParamsShape<Key>>;

export type InteractionFormProps<Key extends InteractionKey> = Omit<
  InteractionFormPropsGeneric<
    InteractionParamsShape<Key>,
    InteractionHandleDefaultedKeys<Key>
  >,
  "descriptor" | "handle"
> & {
  descriptor: InteractionDescriptorFor<Key>;
  handle: InteractionHandle<
    InteractionParamsShape<Key>,
    InteractionHandleDefaultedKeys<Key>
  >;
  renderFields?: InteractionFieldRenderers<Key>;
};

export type InteractionFieldProps<
  Key extends InteractionKey,
  InputKey extends keyof InteractionParamsShape<Key> & string,
> = Omit<
  InteractionFieldPropsGeneric<InteractionParamsShape<Key>, InputKey>,
  "descriptor" | "handle"
> & {
  descriptor: InteractionDescriptorFor<Key>;
  handle: InteractionHandle<
    InteractionParamsShape<Key>,
    InteractionHandleDefaultedKeys<Key>
  >;
};

export const clientParamSchemasByPhase = createClientParamSchemasByPhase(
  game,
) as ClientParamSchemaMap;

/**
 * Workspace-typed wrapper over `@dreamboard/ui-sdk`'s generic
 * `useInteractionByKey`. The `key` argument is constrained to the
 * generated {@link InteractionKey} union (typos are compile errors), and
 * the returned {@link InteractionHandle} is parameterised on
 * {@link InteractionParamsOf} so `handle.draft`, `handle.submit`, and
 * `handle.setInput` are statically typed against the interaction's
 * declared inputs.
 *
 * ```ts
 * const handle = useInteractionByKey("play.placeThingCard");
 * if (!handle) return null;
 * handle.setInput("cardId", card.id); // inferred as ThingsDeckCardId
 * await handle.submit(); // params typed from the reducer contract
 * ```
 */
export function useInteractionByKey<Key extends InteractionKey>(
  key: Key | null | undefined,
): InteractionHandle<
  InteractionParamsShape<Key>,
  InteractionHandleDefaultedKeys<Key>
> | null {
  return useInteractionByKeyGeneric<
    Key,
    InteractionParamsShape<Key>,
    InteractionHandleDefaultedKeys<Key>
  >(key);
}

export function InteractionForm<Key extends InteractionKey>(
  props: InteractionFormProps<Key>,
): ReactElement {
  const Form = InteractionFormGeneric as unknown as (
    props: InteractionFormPropsGeneric<
      InteractionParamsShape<Key>,
      InteractionHandleDefaultedKeys<Key>
    >,
  ) => ReactElement;
  return createElement(Form, props);
}

export function InteractionField<
  Key extends InteractionKey,
  InputKey extends keyof InteractionParamsShape<Key> & string,
>(props: InteractionFieldProps<Key, InputKey>): ReactElement | null {
  const Field = InteractionFieldGeneric as unknown as (
    props: InteractionFieldPropsGeneric<InteractionParamsShape<Key>, InputKey>,
  ) => ReactElement | null;
  return createElement(Field, props);
}

/**
 * Workspace-typed wrapper over `@dreamboard/ui-sdk`'s
 * `useBoardInteractions`. Returns a {@link BoardInteractionsContext}
 * narrowed to this workspace's board-interaction union for exhaustive
 * downstream logic.
 *
 * ```tsx
 * const board = useBoardInteractions();
 * <HexGrid interactiveVertices={board.targetLayers.vertex()} />
 * ```
 *
 * Reach for this whenever a screen keeps more than one board-surface
 * interaction live simultaneously and dispatch is target-driven
 * instead of armed-then-clicked. Ambiguous unarmed overlaps should be
 * resolved in reducer metadata with `dispatchPriority`.
 */
export function useBoardInteractions(
  options?: BoardInteractionsOptions,
): BoardInteractionsContext<BoardInteractions> {
  return useBoardInteractionsGeneric<BoardInteractions>(options as never);
}

/** Workspace-typed active-player hook. */
export function useActivePlayers(): readonly PlayerId[] {
  return useActivePlayersGeneric() as readonly PlayerId[];
}

/** Workspace-typed player turn order hook. */
export function usePlayerTurnOrder(): readonly PlayerId[] {
  return usePlayerTurnOrderGeneric() as readonly PlayerId[];
}

// -------------------------------------------------------------------------
// Typed hex-board view adapter
// -------------------------------------------------------------------------

/** Generated hex-board topology source, keyed by hex-board id. */
const hexStaticBoards = staticBoards.hex;

/** Union of authored hex-board ids in this workspace's manifest. */
export type HexBoardId = keyof typeof hexStaticBoards & string;

/** Topology object for the named hex board, drawn from `staticBoards.hex`. */
export type HexBoardTopology<Id extends HexBoardId> = (typeof hexStaticBoards)[Id];

/** Space id type for the named hex board. */
export type HexBoardSpaceId<Id extends HexBoardId> = BoardSpaceIdOf<
  HexBoardTopology<Id>
>;

/**
 * Workspace-typed wrapper over `@dreamboard/ui-sdk`'s
 * `createHexBoardView`. Joins the static topology of the named hex
 * board with a per-space view overlay and returns a value ready for
 * `<HexGrid board={...} />`. Each rendered tile carries a `view`
 * field typed as the matched overlay row.
 *
 * Strict by construction: every static space must have exactly one
 * overlay; missing, duplicate, or unknown overlay ids throw.
 *
 * ```tsx
 * const island = useHexBoardView("island", { spaces: view.spaces });
 *
 * <HexGrid
 *   board={island}
 *   renderTile={(tile) => {
 *     const terrain = tile.view.terrain;
 *     // ...
 *   }}
 * />
 * ```
 */
export function useHexBoardView<
  const Id extends HexBoardId,
  const TSpaceView extends { id: HexBoardSpaceId<Id> },
>(
  boardId: Id,
  options: { spaces: ReadonlyArray<TSpaceView> },
): HexBoardView<HexBoardTopology<Id>, TSpaceView> {
  const board = hexStaticBoards[boardId];
  const { spaces } = options;
  return useMemo(
    () => createHexBoardView<HexBoardTopology<Id>, TSpaceView>(board, { spaces }),
    [board, spaces],
  );
}

// -------------------------------------------------------------------------
// Typed shell adapter — specialised to this workspace's per-surface unions so
// authors write `<WorkspaceGameShell surfaces={{ ... }} />` with no generic args.
// -------------------------------------------------------------------------

/**
 * Full per-surface interaction map for this workspace. Authored interaction
 * keys are grouped by the surface they declared via `defineInteraction`.
 */
export type WorkspaceSurfaceMap = {
  panel: PanelInteractions;
  hand: HandInteractions;
  inbox: InboxInteractions;
  chrome: ChromeInteractions;
  blocker: BlockerInteractions;
  board: BoardInteractions;
};

type RawGameShellProps = GameShellProps<
  WorkspaceSurfaceMap,
  InteractionParamsByKey,
  ZoneId
>;

type WorkspaceHandSurfaceConfig = HandSurfaceConfig<
  HandInteractions,
  InteractionParamsByKey,
  WorkspaceZoneKey
>;

type WorkspaceGameShellSurfaces = Omit<
  NonNullable<RawGameShellProps["surfaces"]>,
  "hand"
> & {
  hand?: WorkspaceHandSurfaceConfig;
};

/** Props for the workspace-typed {@link WorkspaceGameShell}. */
export type WorkspaceGameShellProps = Omit<
  RawGameShellProps,
  "surfaces"
> & {
  surfaces?: WorkspaceGameShellSurfaces;
};

/**
 * Opinionated shell pre-specialised to this workspace's surface unions.
 * Authors import this directly and get compile-time enforcement that
 * `surfaces.<slot>` entries match the authored surface's interaction keys:
 *
 * ```tsx
 * import { WorkspaceGameShell } from "@dreamboard/ui-contract";
 *
 * <WorkspaceGameShell
 *   surfaces={{
 *     hand: {
 *       zones: {
 *         mainHand: (cards, contexts) => ...,
 *       },
 *       interactions: {
 *         "play.inspectCard": (descriptor, handle) => ...,
 *       },
 *     },
 *     inbox: { "judge.judgePlacement": () => null },
 *   }}
 * />
 * ```
 *
 * For a zero-default shell (custom layout, direct surface composition),
 * import `GameShell` from `@dreamboard/ui-sdk` instead.
 */
const WorkspaceGameShellGeneric = GameShellGeneric as unknown as (
  props: RawGameShellProps,
) => ReactElement;

function zoneKeyOf(zoneId: string): WorkspaceZoneKey {
  return zoneId.replace(/-([a-z0-9])/g, (_match, char: string) =>
    char.toUpperCase(),
  ) as WorkspaceZoneKey;
}

function buildZoneIdByKey(): Record<WorkspaceZoneKey, ZoneId> {
  const entries = literals.zoneIds.map((zoneId) => [
    zoneKeyOf(zoneId),
    zoneId,
  ] as const);
  return Object.fromEntries(entries) as Record<WorkspaceZoneKey, ZoneId>;
}

const zoneIdByKey = buildZoneIdByKey();

function translateHandZones(
  zones: WorkspaceHandSurfaceConfig["zones"],
):
  | Partial<Record<ZoneId, HandZoneSpec<HandInteractions, InteractionParamsByKey>>>
  | undefined {
  if (!zones) return undefined;

  const translated: Partial<
    Record<ZoneId, HandZoneSpec<HandInteractions, InteractionParamsByKey>>
  > = {};
  for (const [zoneKey, zoneSpec] of Object.entries(zones) as Array<
    [
      WorkspaceZoneKey,
      HandZoneSpec<HandInteractions, InteractionParamsByKey> | undefined,
    ]
  >) {
    if (!zoneSpec) continue;
    translated[zoneIdByKey[zoneKey]] = zoneSpec;
  }

  return Object.keys(translated).length > 0 ? translated : undefined;
}

function translateSurfaces(
  surfaces: WorkspaceGameShellProps["surfaces"],
): RawGameShellProps["surfaces"] {
  if (!surfaces?.hand) return surfaces as RawGameShellProps["surfaces"];

  return {
    ...surfaces,
    hand: {
      ...surfaces.hand,
      zones: translateHandZones(surfaces.hand.zones),
    },
  } as RawGameShellProps["surfaces"];
}

export function WorkspaceGameShell(
  props: WorkspaceGameShellProps,
): ReactElement {
  const chrome =
    props.chrome?.primaryAction === undefined
      ? { ...props.chrome, primaryAction: "auto" as const }
      : props.chrome;
  return createElement(WorkspaceGameShellGeneric, {
    ...props,
    chrome,
    surfaces: translateSurfaces(props.surfaces),
    clientParamSchemas:
      props.clientParamSchemas ?? clientParamSchemasByPhase,
  });
}
