import { describe, expect, test } from "bun:test";
import { mergeUiArgsContent } from "./ui-args-merge.js";

describe("mergeUiArgsContent", () => {
  test("replaces generated blocks and preserves user blocks", () => {
    const local = `// <dreamboard:generated:phase-interfaces:start>
export interface PickCardsUIArgs {
  waitingOn: string[];
}
// <dreamboard:generated:phase-interfaces:end>

// <dreamboard:user:custom-types:start>
export interface LocalBonus {
  multiplier: number;
}
// <dreamboard:user:custom-types:end>

export interface UIArgsByPhase {
// <dreamboard:generated:phase-map:start>
  pickCards: PickCardsUIArgs;
// <dreamboard:generated:phase-map:end>

// <dreamboard:user:custom-phase-map:start>
  localBonus: LocalBonus;
// <dreamboard:user:custom-phase-map:end>
}
`;

    const incoming = `// <dreamboard:generated:phase-interfaces:start>
export interface PickCardsUIArgs {}
export interface ScoreRoundUIArgs {}
// <dreamboard:generated:phase-interfaces:end>

// <dreamboard:user:custom-types:start>
// Add shared helper types used by UIArgs here.
// <dreamboard:user:custom-types:end>

export interface UIArgsByPhase {
// <dreamboard:generated:phase-map:start>
  pickCards: PickCardsUIArgs;
  scoreRound: ScoreRoundUIArgs;
// <dreamboard:generated:phase-map:end>

// <dreamboard:user:custom-phase-map:start>
// Add custom phase mappings here.
// <dreamboard:user:custom-phase-map:end>
}
`;

    const result = mergeUiArgsContent(local, incoming);

    expect(result.conflicted).toBe(false);
    expect(result.regenerated).toBe(false);
    expect(result.addedInterfaces).toEqual(["ScoreRoundUIArgs"]);
    expect(result.addedPhases).toEqual(["scoreRound"]);
    expect(result.content).toContain("export interface ScoreRoundUIArgs {}");
    expect(result.content).toContain("scoreRound: ScoreRoundUIArgs;");
    expect(result.content).toContain("export interface LocalBonus");
    expect(result.content).toContain("localBonus: LocalBonus;");
  });

  test("regenerates entire file when markers are missing locally", () => {
    const local = `export interface PickCardsUIArgs {
  waitingOn: string[];
}
`;

    const incoming = `// <dreamboard:generated:phase-interfaces:start>
export interface PickCardsUIArgs {}
// <dreamboard:generated:phase-interfaces:end>

export interface UIArgsByPhase {
// <dreamboard:generated:phase-map:start>
  pickCards: PickCardsUIArgs;
// <dreamboard:generated:phase-map:end>
}
`;

    const result = mergeUiArgsContent(local, incoming);

    expect(result.conflicted).toBe(false);
    expect(result.regenerated).toBe(true);
    expect(result.content).toBe(incoming);
    expect(result.reason).toContain("missing generated markers");
  });

  test("returns conflict when incoming scaffold is missing required markers", () => {
    const local = `// <dreamboard:generated:phase-interfaces:start>
export interface PickCardsUIArgs {}
// <dreamboard:generated:phase-interfaces:end>
`;

    const incoming = `export interface PickCardsUIArgs {}`;

    const result = mergeUiArgsContent(local, incoming);

    expect(result.conflicted).toBe(true);
    expect(result.regenerated).toBe(false);
    expect(result.reason).toContain("missing required generated markers");
  });
});
