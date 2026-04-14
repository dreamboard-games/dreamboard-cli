/**
 * DiceRoller component fixtures
 * Demonstrates dice display with separate roll action handling
 *
 * In authored game UIs, the roll action should come from reducer actions or
 * reducer-projected view state. These fixtures simulate that pattern with local
 * state.
 */
import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Dice5 } from "lucide-react";
import { clsx } from "clsx";
import { DiceRoller, type DiceRollerRenderProps } from "../DiceRoller.js";

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-8">
      <div className="max-w-md mx-auto space-y-6 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Default styled dice display
function DefaultDiceDisplay({
  values,
  sum,
  diceCount,
  allRolled,
}: DiceRollerRenderProps) {
  const diceToDisplay = values || Array(diceCount).fill(undefined);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3" role="list" aria-label="Dice values">
        {diceToDisplay.map((value, i) => (
          <div
            key={i}
            className="w-12 h-12 text-2xl rounded-lg bg-white text-slate-900 font-bold flex items-center justify-center shadow-lg border-2 border-slate-200"
          >
            {value !== undefined ? (
              value
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </div>
        ))}
      </div>

      {allRolled && sum !== undefined && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="text-4xl font-bold text-white"
        >
          Total: {sum}
        </motion.div>
      )}
    </div>
  );
}

// Rolling animation display
function RollingDiceDisplay({ diceCount }: { diceCount: number }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3" role="list" aria-label="Dice values">
        {Array(diceCount)
          .fill(null)
          .map((_, i) => (
            <motion.div
              key={i}
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 0.4, repeat: Infinity, ease: "linear" },
                scale: { duration: 0.2, repeat: Infinity },
              }}
              className="w-12 h-12 text-2xl rounded-lg bg-white text-slate-900 font-bold flex items-center justify-center shadow-lg border-2 border-slate-200"
            >
              <span className="opacity-70">?</span>
            </motion.div>
          ))}
      </div>
    </div>
  );
}

// Roll button component
function RollButton({
  onRoll,
  disabled,
  rolling,
}: {
  onRoll: () => void;
  disabled?: boolean;
  rolling?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileHover={!disabled && !rolling ? { scale: 1.05 } : undefined}
      onClick={onRoll}
      disabled={disabled || rolling}
      className={clsx(
        "px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2",
        !disabled && !rolling
          ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          : "bg-slate-700 text-slate-400 cursor-not-allowed",
      )}
    >
      <Dice5 className={clsx("w-5 h-5", rolling && "animate-spin")} />
      {rolling ? "Rolling..." : "Roll Dice"}
    </motion.button>
  );
}

// Simulate reducer-driven dice state for fixtures
function useSimulatedDice(diceCount: number) {
  const [values, setValues] = useState<Array<number | undefined>>(
    Array(diceCount).fill(undefined),
  );
  const [rolling, setRolling] = useState(false);

  const roll = useCallback(async () => {
    setRolling(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setValues(
      Array(diceCount)
        .fill(null)
        .map(() => Math.floor(Math.random() * 6) + 1),
    );
    setRolling(false);
  }, [diceCount]);

  const allRolled = values.every((v) => v !== undefined);
  const sum = allRolled
    ? values.reduce((a, b) => (a ?? 0) + (b ?? 0), 0)
    : undefined;

  return { values, rolling, roll, allRolled, sum };
}

// Interactive demo with actual rolling
function InteractiveDemo() {
  const { values, rolling, roll } = useSimulatedDice(2);

  return (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Interactive Demo</h2>
      <p className="text-slate-400 text-sm mb-4">
        Roll action is separate from display component
      </p>

      {rolling ? (
        <RollingDiceDisplay diceCount={2} />
      ) : (
        <DiceRoller
          values={values}
          render={(props) => <DefaultDiceDisplay {...props} />}
        />
      )}

      <RollButton onRoll={roll} rolling={rolling} />
    </Container>
  );
}

// Three dice demo
function ThreeDiceDemo() {
  const { values, rolling, roll } = useSimulatedDice(3);

  return (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Three Dice</h2>

      {rolling ? (
        <RollingDiceDisplay diceCount={3} />
      ) : (
        <DiceRoller
          values={values}
          diceCount={3}
          render={(props) => <DefaultDiceDisplay {...props} />}
        />
      )}

      <RollButton onRoll={roll} rolling={rolling} />
    </Container>
  );
}

// Minimal custom styling demo
function MinimalStyleDemo() {
  const [values, setValues] = useState<Array<number | undefined>>([4, 3]);
  const [rolling, setRolling] = useState(false);

  const handleRoll = async () => {
    setRolling(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setValues([
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ]);
    setRolling(false);
  };

  return (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Minimal Custom Style
      </h2>

      <DiceRoller
        values={values}
        render={({ values, sum, allRolled }) => (
          <div className="text-center">
            <div className="flex gap-2 justify-center mb-2">
              {(values || [undefined, undefined]).map((v, i) => (
                <span
                  key={i}
                  className="w-10 h-10 bg-amber-500 text-black font-mono text-xl flex items-center justify-center rounded"
                >
                  {rolling ? "•" : (v ?? "?")}
                </span>
              ))}
            </div>
            {allRolled && !rolling && (
              <span className="text-amber-400 text-2xl font-mono">= {sum}</span>
            )}
          </div>
        )}
      />

      <button
        onClick={handleRoll}
        disabled={rolling}
        className="px-4 py-2 bg-amber-500 text-black font-bold rounded hover:bg-amber-400 disabled:opacity-50"
      >
        {rolling ? "..." : "🎲 Roll"}
      </button>
    </Container>
  );
}

// Emoji dice demo
function EmojiDiceDemo() {
  const [values, setValues] = useState<Array<number | undefined>>([5, 2]);

  const diceEmoji = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  const handleRoll = () => {
    setValues([
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ]);
  };

  return (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Emoji Dice</h2>

      <DiceRoller
        values={values}
        render={({ values, sum }) => (
          <div className="text-center">
            <div className="text-8xl mb-4">
              {values?.map((v, i) => (
                <span key={i}>{v ? diceEmoji[v] : "🎲"}</span>
              )) ?? "🎲🎲"}
            </div>
            {values?.every((v) => v !== undefined) && (
              <div className="text-3xl text-white font-bold">Sum: {sum}</div>
            )}
          </div>
        )}
      />

      <button
        onClick={handleRoll}
        className="text-4xl hover:scale-110 transition-transform"
      >
        🎯 Tap to Roll
      </button>
    </Container>
  );
}

// Read-only display (no button)
function ReadOnlyDemo() {
  return (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Read-Only Display</h2>
      <p className="text-slate-400 text-sm mb-4">
        Display only - no roll action needed
      </p>

      <DiceRoller
        values={[6, 6]}
        render={({ values, sum }) => (
          <div className="text-center">
            <div className="flex gap-4 justify-center mb-4">
              {values?.map((v, i) => (
                <div
                  key={i}
                  className="w-16 h-16 bg-green-500 text-white text-3xl font-bold flex items-center justify-center rounded-xl shadow-lg"
                >
                  {v}
                </div>
              ))}
            </div>
            <div className="text-green-400 text-xl">
              🎉 Double sixes! Total: {sum}
            </div>
          </div>
        )}
      />
    </Container>
  );
}

export default {
  interactive: <InteractiveDemo />,

  threeDice: <ThreeDiceDemo />,

  minimalStyle: <MinimalStyleDemo />,

  emojiDice: <EmojiDiceDemo />,

  readOnly: <ReadOnlyDemo />,

  default: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Default (Not Rolled)
      </h2>
      <DiceRoller
        diceCount={2}
        render={(props) => <DefaultDiceDisplay {...props} />}
      />
      <RollButton onRoll={() => console.log("Roll!")} />
    </Container>
  ),

  withValues: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">With Values</h2>
      <DiceRoller
        values={[4, 6]}
        render={(props) => <DefaultDiceDisplay {...props} />}
      />
    </Container>
  ),

  disabled: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Disabled</h2>
      <DiceRoller
        values={[2, 4]}
        render={(props) => <DefaultDiceDisplay {...props} />}
      />
      <motion.button
        type="button"
        disabled
        className="px-6 py-3 rounded-lg font-bold bg-slate-700 text-slate-400 cursor-not-allowed flex items-center gap-2"
      >
        <Dice5 className="w-5 h-5" />
        Wait for your turn
      </motion.button>
    </Container>
  ),

  catanStyle: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Catan Style (7 = Robber!)
      </h2>
      <DiceRoller
        values={[4, 3]}
        render={({ values, sum }) => (
          <div className="text-center">
            <div className="flex gap-4 justify-center mb-4">
              {values?.map((v, i) => (
                <div
                  key={i}
                  className="w-16 h-16 bg-white text-slate-900 text-3xl font-bold flex items-center justify-center rounded-xl shadow-lg border-4 border-red-500"
                >
                  {v}
                </div>
              ))}
            </div>
            <div className="text-5xl font-bold text-white mb-2">{sum}</div>
            {sum === 7 && (
              <p className="text-red-400 text-lg font-bold">
                🏴‍☠️ Robber Activates!
              </p>
            )}
          </div>
        )}
      />
    </Container>
  ),

  /**
   * Example of how to use with reducer-provided dice state (pseudo-code)
   *
   * ```tsx
   * function CatanDicePanel() {
   *   const view = useGameView();
   *   const actions = useActions();
   *
   *   return (
   *     <div>
   *       <DiceRoller
   *         values={values}
   *         render={({ values, sum }) => (
   *           <div className="text-4xl">{sum ?? '?'}</div>
   *         )}
   *       />
   *       <button onClick={roll} disabled={!isMyTurn}>
   *         Roll Dice
   *       </button>
   *     </div>
   *   );
   * }
   * ```
   */
};
