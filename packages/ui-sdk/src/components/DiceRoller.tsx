/** Pure display component for dice values. Roll actions go through reducer actions. */

import { clsx } from "clsx";
import { ReactNode } from "react";

export interface DiceRollerRenderProps {
  values: Array<number | undefined> | undefined;
  /** Undefined if any die hasn't been rolled */
  sum: number | undefined;
  diceCount: number;
  allRolled: boolean;
}

export interface DiceRollerProps {
  values?: Array<number | undefined>;
  /** Used when values not provided */
  diceCount?: number;
  render: (props: DiceRollerRenderProps) => ReactNode;
  className?: string;
}
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
