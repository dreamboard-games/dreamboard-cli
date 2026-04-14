import { useMemo } from "react";
import { phaseCommands } from "@dreamboard/ui-contract";
import { useRuntimeContext } from "../context/RuntimeContext.js";
import { usePluginSession } from "../context/PluginSessionContext.js";
import { usePluginState } from "../context/PluginStateContext.js";
import type {
  ActionCommandForPhase,
  ActionNameForPhase,
  PhaseName,
  PhaseCommands,
  PromptId,
  PromptResponse,
  WindowActionCommand,
  WindowId,
} from "@dreamboard/ui-contract";
import type {
  GameplayPromptInstance,
  GameplayWindowInstance,
} from "../types/reducer-state.js";
import { ValidationError } from "../errors/ValidationError.js";

type RespondToPrompt = <Name extends PromptId>(
  prompt: GameplayPromptInstance<Name>,
  response: PromptResponse<Name>,
) => Promise<void>;

type SubmitWindowAction = <Name extends WindowId>(
  window: GameplayWindowInstance<Name>,
  command: WindowActionCommand<Name>,
) => Promise<void>;

interface RuntimeWindowActionCommand {
  type: string;
  params?: Record<string, unknown>;
}

export interface PhaseActions<Phase extends PhaseName> {
  phase: Phase;
  commands: PhaseCommands<Phase>;
  availableActions: ReadonlySet<ActionNameForPhase<Phase>>;
  can: <Name extends ActionNameForPhase<Phase>>(name: Name) => boolean;
  dispatch: (command: ActionCommandForPhase<Phase>) => Promise<void>;
  validate: (command: ActionCommandForPhase<Phase>) => Promise<void>;
  respondToPrompt: RespondToPrompt;
  submitWindowAction: SubmitWindowAction;
}

export type UseActionsResult = {
  [Phase in PhaseName]: PhaseActions<Phase>;
}[PhaseName];

function toValidationError(
  error: unknown,
  fallbackMessage: string,
): ValidationError {
  if (error instanceof ValidationError) {
    return error;
  }

  const errorCode =
    typeof error === "object" &&
    error !== null &&
    "errorCode" in error &&
    typeof error.errorCode === "string"
      ? error.errorCode
      : undefined;

  if (error instanceof Error) {
    return new ValidationError(errorCode, error.message || fallbackMessage);
  }

  return new ValidationError(errorCode, fallbackMessage);
}

function commandToParams(command: object): Record<string, unknown> {
  if (
    !("params" in command) ||
    command.params === null ||
    command.params === undefined
  ) {
    return {};
  }

  return command.params as Record<string, unknown>;
}

function isActionNameForPhase<Phase extends PhaseName>(
  commands: PhaseCommands<Phase>,
  actionType: string,
): actionType is ActionNameForPhase<Phase> {
  return actionType in commands;
}

function createPhaseActions<Phase extends PhaseName>(
  phase: Phase,
  availableActionDefinitions: ReadonlyArray<{ actionType: string }>,
  controllingPlayerId: string | null,
  runtime: ReturnType<typeof useRuntimeContext>,
): PhaseActions<Phase> {
  const commands = phaseCommands[phase]!;
  const availableActions = new Set<ActionNameForPhase<Phase>>(
    availableActionDefinitions
      .map((action) => action.actionType)
      .filter((actionType) => isActionNameForPhase(commands, actionType)),
  );

  const requireControllingPlayerId = (): string => {
    if (!controllingPlayerId) {
      throw new Error(
        "useActions: No controlling player available. Ensure the session is initialized.",
      );
    }
    return controllingPlayerId;
  };

  const ensureAvailable = (actionType: ActionNameForPhase<Phase>): void => {
    const playerId = requireControllingPlayerId();
    if (availableActions.has(actionType)) {
      return;
    }

    throw new ValidationError(
      "action-unavailable",
      `Action '${actionType}' is not currently available for ${playerId}.`,
    );
  };

  const dispatch = async (command: ActionCommandForPhase<Phase>) => {
    ensureAvailable(command.type);

    try {
      await runtime.submitAction(
        requireControllingPlayerId(),
        command.type,
        commandToParams(command),
      );
    } catch (error) {
      throw toValidationError(
        error,
        `Action '${command.type}' could not be submitted.`,
      );
    }
  };

  const validate = async (command: ActionCommandForPhase<Phase>) => {
    ensureAvailable(command.type);

    const validation = await runtime.validateAction(
      requireControllingPlayerId(),
      command.type,
      commandToParams(command),
    );
    if (!validation.valid) {
      throw new ValidationError(validation.errorCode, validation.message);
    }
  };

  const respondToPrompt: RespondToPrompt = async (prompt, response) => {
    try {
      await runtime.submitPromptResponse(
        requireControllingPlayerId(),
        prompt.id,
        response,
      );
    } catch (error) {
      throw toValidationError(error, "Prompt response could not be submitted.");
    }
  };

  const submitWindowAction: SubmitWindowAction = async (
    window: { id: string },
    command: RuntimeWindowActionCommand,
  ) => {
    try {
      await runtime.submitWindowAction(
        requireControllingPlayerId(),
        window.id,
        command.type,
        "params" in command
          ? (command.params as Record<string, unknown> | undefined)
          : undefined,
      );
    } catch (error) {
      throw toValidationError(error, "Window action could not be submitted.");
    }
  };

  return {
    phase,
    commands,
    availableActions,
    can: (name) => availableActions.has(name),
    dispatch,
    validate,
    respondToPrompt,
    submitWindowAction,
  };
}

/**
 * Reducer-native action hook backed by the projected seat payload and
 * runtime-owned current phase.
 */
export function useActions(): UseActionsResult {
  const runtime = useRuntimeContext();
  const { controllingPlayerId } = usePluginSession();
  const currentPhase = usePluginState(
    (state) => state.gameplay.currentPhase,
  ) as PhaseName | null;
  const availableActionDefinitions = usePluginState(
    (state) => state.gameplay.availableActions,
  ) as ReadonlyArray<{ actionType: string }>;

  return useMemo(() => {
    if (!currentPhase) {
      throw new Error(
        "useActions: No gameplay phase available. Ensure the reducer-native session is in gameplay.",
      );
    }

    return createPhaseActions(
      currentPhase,
      availableActionDefinitions,
      controllingPlayerId,
      runtime,
    ) as UseActionsResult;
  }, [availableActionDefinitions, controllingPlayerId, currentPhase, runtime]);
}
