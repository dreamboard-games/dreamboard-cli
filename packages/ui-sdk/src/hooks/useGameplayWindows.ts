import { usePluginState } from "../context/PluginStateContext.js";
import type { WindowId } from "@dreamboard/ui-contract";
import type {
  AnyGameplayWindowInstance,
  GameplayWindowInstance,
} from "../types/reducer-state.js";
import type { GameplayWindowInstance as RuntimeGameplayWindowInstance } from "../types/plugin-state.js";

function hasWindowId<Name extends WindowId>(
  window: RuntimeGameplayWindowInstance,
  windowId: Name,
): window is GameplayWindowInstance<Name> {
  return window.windowId === windowId;
}

/**
 * Hook to access active gameplay windows for the controlling seat.
 */
export function useGameplayWindows(): readonly AnyGameplayWindowInstance[];
export function useGameplayWindows<Name extends WindowId>(
  windowId: Name,
): ReadonlyArray<GameplayWindowInstance<Name>>;
export function useGameplayWindows<Name extends WindowId>(
  windowId?: Name,
):
  | readonly AnyGameplayWindowInstance[]
  | ReadonlyArray<GameplayWindowInstance<Name>> {
  const windows = usePluginState(
    (state) => state.gameplay.windows,
  ) as readonly RuntimeGameplayWindowInstance[];

  if (!windowId) {
    return windows as readonly AnyGameplayWindowInstance[];
  }

  return windows.filter((window) => hasWindowId(window, windowId));
}
