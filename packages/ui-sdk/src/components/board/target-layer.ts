export interface InteractiveTargetLayer {
  enabled?: boolean;
  eligible?: ReadonlySet<string>;
  selectTargetId?: (targetId: string) => void | Promise<void>;
}

export interface InteractiveTargetRenderState {
  isEnabled: boolean;
  isEligible: boolean;
  isHovered: boolean;
}

export function interactiveTargetRenderState(
  layer: InteractiveTargetLayer,
  targetId: string,
  isHovered: boolean,
): InteractiveTargetRenderState {
  return {
    isEnabled: layer.enabled !== false,
    isEligible: layer.eligible?.has(targetId) ?? true,
    isHovered,
  };
}

export function isInteractiveTargetSelectable(
  layer: InteractiveTargetLayer,
  state: InteractiveTargetRenderState,
): boolean {
  return state.isEnabled && state.isEligible && !!layer.selectTargetId;
}
