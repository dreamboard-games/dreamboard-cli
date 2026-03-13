export interface MainPhaseUIArgs {
  message?: string;
}

export interface UIArgsByPhase {
  play: MainPhaseUIArgs;
}

export type PhaseName = keyof UIArgsByPhase;

export type UIArgsFor<P extends PhaseName> = UIArgsByPhase[P];

export type AnyUIArgs = UIArgsByPhase[PhaseName];

export type UIArgsResult = { [P in PhaseName]: UIArgsByPhase[P] | null };
