import { createTrustedReducerBundle } from "./trusted-bundle";
import { serializeEffect, withKind } from "./serialization";
import { createIngressRuntimeCodec } from "../ingress/runtime-codec";
import type {
  ManifestContractOf,
  PhaseMapOf,
  ReducerGameContractLike,
  ReducerGameDefinition,
  ReducerReject,
  ReducerRuntimeEffectForState,
  RuntimeSetupSelectionInput,
  ViewMapOf,
} from "../model";
import type {
  UntrustedReducerSessionState,
  UntrustedRuntimeInput,
  UntrustedRuntimeTable,
} from "../ingress/types";

function serializeReducerResult<State, EffectState>(
  result:
    | ReducerReject
    | {
        type: "accept";
        state: State;
        effects?: ReducerRuntimeEffectForState<EffectState>[];
      },
  serializeState: (state: State) => unknown,
) {
  if (result.type === "reject") {
    return withKind(result);
  }
  return withKind({
    type: "accept" as const,
    state: serializeState(result.state),
    effects: (result.effects ?? []).map((effect) => serializeEffect(effect)),
  });
}

function rawTableTemplateFor(
  state: UntrustedReducerSessionState,
): UntrustedRuntimeTable | undefined {
  return state.domain.table && typeof state.domain.table === "object"
    ? (state.domain.table as UntrustedRuntimeTable)
    : undefined;
}

export function createIngressReducerBundle<
  Contract extends ReducerGameContractLike,
  Definitions extends PhaseMapOf<Contract>,
  Views extends ViewMapOf<Contract>,
>(definition: ReducerGameDefinition<Contract, Definitions, Views>) {
  type Definition = ReducerGameDefinition<Contract, Definitions, Views>;
  const trustedBundle = createTrustedReducerBundle(definition);
  const codec = createIngressRuntimeCodec(definition);
  type Manifest = ManifestContractOf<Definition["contract"]>;

  return {
    ...trustedBundle,
    async initialize({
      table,
      playerIds,
      rngSeed,
      setup,
    }: {
      table: UntrustedRuntimeTable;
      playerIds: string[];
      rngSeed?: number | null;
      setup?: RuntimeSetupSelectionInput<Manifest> | null;
    }) {
      const {
        rawTableTemplate,
        table: parsedTable,
        playerIds: parsedPlayerIds,
      } = codec.parseInitialTable(table, playerIds);
      return codec.serializeState(
        await trustedBundle.initialize({
          table: parsedTable,
          playerIds: parsedPlayerIds,
          rngSeed,
          setup,
        }),
        rawTableTemplate,
      );
    },
    async initializePhase({
      state,
      to,
    }: {
      state: UntrustedReducerSessionState;
      to: string;
    }) {
      const decodedState = codec.parseState(state);
      return codec.serializeState(
        await trustedBundle.initializePhase({
          state: decodedState,
          to: to as never,
        }),
        rawTableTemplateFor(state),
      );
    },
    async validateInput({
      state,
      input,
    }: {
      state: UntrustedReducerSessionState;
      input: UntrustedRuntimeInput;
    }) {
      return trustedBundle.validateInput({
        state: codec.parseState(state),
        input: codec.parseInput(input),
      });
    },
    async reduce({
      state,
      input,
    }: {
      state: UntrustedReducerSessionState;
      input: UntrustedRuntimeInput;
    }) {
      return serializeReducerResult(
        await trustedBundle.reduce({
          state: codec.parseState(state),
          input: codec.parseInput(input),
        }),
        (nextState) =>
          codec.serializeState(nextState, rawTableTemplateFor(state)),
      );
    },
    async dispatch({
      state,
      input,
    }: {
      state: UntrustedReducerSessionState;
      input: UntrustedRuntimeInput;
    }) {
      const result = await trustedBundle.dispatch({
        state: codec.parseState(state),
        input: codec.parseInput(input),
      });
      if (result.type === "reject") {
        return withKind(result);
      }
      return withKind({
        type: "accept" as const,
        state: codec.serializeState(result.state, rawTableTemplateFor(state)),
        trace: result.trace.map((entry) => {
          if (entry.type === "appliedEffect") {
            return withKind({
              ...entry,
              effect: serializeEffect(entry.effect),
            });
          }
          return withKind(entry);
        }),
      });
    },
    getAvailableActions({
      state,
      playerId,
    }: {
      state: UntrustedReducerSessionState;
      playerId: string;
    }) {
      return trustedBundle.getAvailableActions({
        state: codec.parseState(state),
        playerId: codec.parsePlayerId(playerId),
      });
    },
    getView({
      state,
      playerId,
      viewId = "player",
    }: {
      state: UntrustedReducerSessionState;
      playerId: string;
      viewId?: string;
    }) {
      return trustedBundle.getView({
        state: codec.parseState(state),
        playerId: codec.parsePlayerId(playerId),
        viewId,
      });
    },
  };
}
