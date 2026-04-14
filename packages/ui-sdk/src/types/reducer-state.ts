import type {
  ActionName,
  GameView,
  PhaseName,
  PromptId,
  PromptInstanceId,
  WindowId,
  WindowInstanceId,
} from "@dreamboard/ui-contract";
import type {
  ActionDefinition as BaseActionDefinition,
  GameplayPromptInstance as BaseGameplayPromptInstance,
  GameplayPromptOption,
  GameplaySnapshot as BaseGameplaySnapshot,
  GameplayWindowClosePolicy,
  GameplayWindowInstance as BaseGameplayWindowInstance,
  PluginStateSnapshot as BasePluginStateSnapshot,
} from "./plugin-state.js";

export type ActionDefinition = BaseActionDefinition<ActionName>;

export type GameplayPromptInstance<Name extends PromptId = PromptId> =
  BaseGameplayPromptInstance<Name, PromptInstanceId<Name>>;

export type AnyGameplayPromptInstance = {
  [Name in PromptId]: GameplayPromptInstance<Name>;
}[PromptId];

export type GameplayWindowInstance<Name extends WindowId = WindowId> =
  BaseGameplayWindowInstance<Name, WindowInstanceId<Name>>;

export type AnyGameplayWindowInstance = {
  [Name in WindowId]: GameplayWindowInstance<Name>;
}[WindowId];

export type GameplaySnapshot = Omit<
  BaseGameplaySnapshot<
    PhaseName,
    ActionName,
    PromptId,
    WindowId,
    PromptInstanceId<PromptId>,
    WindowInstanceId<WindowId>
  >,
  "prompts" | "windows"
> & {
  prompts: readonly AnyGameplayPromptInstance[];
  windows: readonly AnyGameplayWindowInstance[];
};

export type PluginStateSnapshot = Omit<
  BasePluginStateSnapshot<
    GameView,
    PhaseName,
    ActionName,
    PromptId,
    WindowId,
    PromptInstanceId<PromptId>,
    WindowInstanceId<WindowId>
  >,
  "gameplay"
> & {
  gameplay: GameplaySnapshot;
};

export type { GameplayPromptOption, GameplayWindowClosePolicy };
