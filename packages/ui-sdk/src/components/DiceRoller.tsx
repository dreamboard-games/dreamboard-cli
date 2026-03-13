/**
 * DiceRoller component - Display component for dice values
 *
 * Design Philosophy: "Simple Dice Display"
 * - Pure display component for rendering dice values
 * - User controls visual rendering via render function
 * - Roll action is handled separately via useDice hook's roll() function
 *
 * @example Basic usage with useDice hook
 * ```tsx
 * const { values, sum, roll } = useDice(['die-1', 'die-2']);
 *
 * return (
 *   <>
 *     <DiceRoller
 *       values={values}
 *       render={({ values, sum }) => (
 *         <div className="text-4xl font-bold">{sum ?? '?'}</div>
 *       )}
 *     />
 *     <button onClick={roll}>Roll Dice</button>
 *   </>
 * );
 * ```
 */

import { clsx } from "clsx";
import { ReactNode } from "react";

export interface DiceRollerRenderProps {
  /** Current dice values (undefined if not rolled yet) */
  values: Array<number | undefined> | undefined;
  /** Sum of dice values (undefined if any die hasn't been rolled) */
  sum: number | undefined;
  /** Number of dice */
  diceCount: number;
  /** Whether all dice have been rolled */
  allRolled: boolean;
}

export interface DiceRollerProps {
  /** Current dice values (after roll) */
  values?: Array<number | undefined>;
  /** Number of dice (used when values not provided) */
  diceCount?: number;
  /** Render function for the dice display */
  render: (props: DiceRollerRenderProps) => ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * DiceRoller component for displaying dice values
 *
 * Features:
 * - Full control over visual rendering via render prop
 * - Manages accessibility attributes
 * - Pure display component - roll action handled by useDice hook
 */
export function DiceRoller({
  values,
  diceCount = 2,
  render,
  className,
}: DiceRollerProps) {
  const allRolled =
    values?.every((v) => v !== null && v !== undefined) ?? false;
  const sum = allRolled
    ? values?.reduce((a, b) => (a ?? 0) + (b ?? 0), 0)
    : undefined;
  const displayCount = values?.length ?? diceCount;

  const renderProps: DiceRollerRenderProps = {
    values,
    sum,
    diceCount: displayCount,
    allRolled,
  };

  return (
    <div
      className={clsx("flex flex-col items-center gap-4", className)}
      role="region"
      aria-label="Dice roller"
    >
      {render(renderProps)}

      {/* Screen reader only: dice info */}
      <div className="sr-only" aria-live="polite">
        {allRolled && values
          ? `Rolled ${values.join(", ")}. Total: ${sum}`
          : "Dice not rolled yet"}
      </div>
    </div>
  );
}
