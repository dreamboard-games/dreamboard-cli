/**
 * GameEndDisplay component - End-of-game winner display and scoreboard
 *
 * Design Philosophy: "Celebratory Game Conclusion"
 * - Trophy animation for winner
 * - Ranked scoreboard
 * - Return to lobby option
 * - Full-screen overlay
 *
 * @example Basic usage
 * ```tsx
 * <GameEndDisplay
 *   isGameOver={true}
 *   scores={[
 *     { playerId: 'p1', name: 'Alice', score: 100, isWinner: true },
 *     { playerId: 'p2', name: 'Bob', score: 85 },
 *   ]}
 *   onReturnToLobby={() => navigate('/lobby')}
 * />
 * ```
 */

import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { Trophy, Home, Crown, Medal } from "lucide-react";

export interface PlayerScore {
  /** Player ID */
  playerId: string;
  /** Player display name */
  name: string;
  /** Final score */
  score: number;
  /** Whether this player won */
  isWinner?: boolean;
  /** Score breakdown details */
  details?: Record<string, number>;
}

export interface GameEndDisplayProps {
  /** Whether game has ended */
  isGameOver: boolean;
  /** Player scores sorted by rank */
  scores: PlayerScore[];
  /** Custom winner message */
  winnerMessage?: string;
  /** Show score breakdown */
  showDetails?: boolean;
  /** Callback to return to lobby */
  onReturnToLobby?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * GameEndDisplay component for end-of-game screen
 *
 * Features:
 * - Animated winner reveal
 * - Full scoreboard
 * - Score breakdown (optional)
 * - Action buttons for rematch or lobby
 */
export function GameEndDisplay({
  isGameOver,
  scores,
  winnerMessage,
  showDetails = false,
  onReturnToLobby,
  className,
}: GameEndDisplayProps) {
  if (!isGameOver) return null;

  const winner = scores.find((s) => s.isWinner) || scores[0];
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  // Rank icon based on position
  const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1)
      return (
        <Trophy
          className="w-5 h-5 text-primary"
          strokeWidth={3}
          aria-hidden="true"
        />
      );
    if (rank === 2)
      return (
        <Medal
          className="w-5 h-5 text-slate-400"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      );
    if (rank === 3)
      return (
        <Medal
          className="w-5 h-5 text-[#2d5da1]"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      );
    return (
      <span className="w-5 text-center text-muted-foreground font-bold">
        #{rank}
      </span>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={clsx(
          "fixed inset-0 z-50 flex items-center justify-center font-sans",
          "bg-black/60 backdrop-blur-md p-4",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-end-title"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, rotate: 5 }}
          animate={{ scale: 1, y: 0, rotate: -2 }}
          exit={{ scale: 0.9, y: 20, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white border-[4px] border-border wobbly-border-lg p-6 sm:p-10 max-w-md w-full mx-4 text-center hard-shadow-lg relative"
        >
          {/* Decorative tape */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-8 bg-[#e5e0d8] border-2 border-border rotate-3 opacity-80 z-10" />

          {/* Trophy animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 6 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="mb-6 relative z-0 mt-4"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-[#fff9c4] border-[4px] border-border wobbly-border-lg hard-shadow">
              <Trophy
                className="w-12 h-12 text-primary"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </div>
          </motion.div>

          {/* Winner announcement */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2
              id="game-end-title"
              className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-2"
            >
              {winner?.name} Wins!
            </h2>
            {winnerMessage && (
              <p className="text-lg font-medium text-muted-foreground mb-6 bg-[#fff9c4] inline-block px-3 py-1 border-2 border-border wobbly-border rotate-1">
                {winnerMessage}
              </p>
            )}
          </motion.div>

          {/* Scoreboard */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-3 mb-8"
            role="list"
            aria-label="Final scores"
          >
            {sortedScores.map((player, index) => (
              <motion.div
                key={player.playerId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className={clsx(
                  "flex items-center justify-between p-3 sm:p-4 border-[3px] border-border wobbly-border-md hard-shadow transition-transform hover:-translate-y-1",
                  player.isWinner
                    ? "bg-[#fff9c4] rotate-1 z-10"
                    : "bg-white -rotate-1",
                )}
                role="listitem"
              >
                <div className="flex items-center gap-3">
                  <RankIcon rank={index + 1} />
                  <span
                    className={clsx(
                      "font-bold text-lg",
                      player.isWinner ? "text-primary" : "text-foreground",
                    )}
                  >
                    {player.name}
                  </span>
                  {player.isWinner && (
                    <Crown
                      className="w-5 h-5 text-primary"
                      strokeWidth={3}
                      aria-label="Winner"
                    />
                  )}
                </div>
                <span className="text-2xl font-display font-bold text-foreground bg-white border-2 border-border wobbly-border px-2">
                  {player.score}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Score details (optional) */}
          {showDetails && winner?.details && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mb-8 p-4 bg-[#e5e0d8] border-[3px] border-border border-dashed wobbly-border-md text-left rotate-1"
            >
              <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full" />
                Score Breakdown
              </h3>
              <div className="space-y-2">
                {Object.entries(winner.details).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between text-base font-medium text-foreground"
                  >
                    <span className="capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <span className="font-bold bg-white px-1 border-2 border-border wobbly-border">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Action button */}
          {onReturnToLobby && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex justify-center"
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.05, rotate: -2 }}
                whileTap={{ scale: 0.95, x: 2, y: 2 }}
                onClick={onReturnToLobby}
                className={clsx(
                  "px-8 py-3 wobbly-border-lg font-bold text-xl font-sans",
                  "bg-[#2d5da1] text-white border-[4px] border-border hard-shadow hover:hard-shadow-sm active:shadow-none",
                  "flex items-center gap-3",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50",
                  "transition-all",
                )}
              >
                <Home className="w-6 h-6" strokeWidth={3} aria-hidden="true" />
                Return to Lobby
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
