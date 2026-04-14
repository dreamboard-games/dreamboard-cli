/** Displays player information with avatar, status indicators, and stats. */

import { motion } from "framer-motion";
import { clsx } from "clsx";
import { User, Crown, Circle } from "lucide-react";
import type { PlayerId } from "../manifest-contract.js";

export interface PlayerInfoProps {
  playerId: PlayerId;
  name?: string;
  isActive?: boolean;
  isCurrentPlayer?: boolean;
  isHost?: boolean;
  /** Used for avatar background */
  color?: string;
  score?: number;
  metadata?: Record<string, unknown>;
  size?: "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
  avatar?: React.ReactNode;
  className?: string;
}
export function PlayerInfo({
  playerId,
  name,
  isActive = false,
  isCurrentPlayer = false,
  isHost = false,
  color,
  score,
  metadata,
  size = "md",
  orientation = "horizontal",
  avatar,
  className,
}: PlayerInfoProps) {
  const sizeConfig = {
    sm: {
      avatar: "w-8 h-8 sm:w-10 sm:h-10",
      icon: 16,
      text: "text-xs sm:text-sm",
      badge: "text-[10px] px-1.5 py-0.5",
    },
    md: {
      avatar: "w-12 h-12 sm:w-14 sm:h-14",
      icon: 20,
      text: "text-sm sm:text-base",
      badge: "text-xs px-2 py-0.5",
    },
    lg: {
      avatar: "w-16 h-16 sm:w-20 sm:h-20",
      icon: 24,
      text: "text-base sm:text-lg",
      badge: "text-sm px-2 py-1",
    },
  };

  const config = sizeConfig[size];
  const displayName = name || `Player ${playerId.slice(0, 4)}`;

  return (
    <motion.div
      className={clsx(
        "relative flex items-center gap-2 sm:gap-3 p-2 sm:p-3 font-sans",
        "bg-[#fdfbf7] border-[3px] border-border wobbly-border-md hard-shadow transition-colors",
        {
          "border-primary shadow-[4px_4px_0px_0px_#ff4d4d] -rotate-1": isActive,
          "flex-col text-center": orientation === "vertical",
          "flex-row": orientation === "horizontal",
        },
        className,
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      role="article"
      aria-label={`${displayName}${isActive ? " - Active player" : ""}${
        isCurrentPlayer ? " - You" : ""
      }`}
    >
      {/* Avatar */}
      <div className="relative">
        <motion.div
          className={clsx(
            "relative flex items-center justify-center overflow-hidden border-[3px] border-border wobbly-border bg-white hard-shadow-sm",
            !color && "bg-[#e5e0d8]",
            config.avatar,
          )}
          style={color ? { backgroundColor: color } : undefined}
          animate={isActive ? { scale: [1, 1.05, 1], rotate: [-2, 2, -2] } : {}}
          transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
        >
          {avatar || (
            <User
              size={config.icon}
              className="text-foreground"
              aria-hidden="true"
              strokeWidth={2.5}
            />
          )}
        </motion.div>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            className="absolute -top-2 -right-2 w-6 h-6 bg-primary border-[3px] border-border wobbly-border hard-shadow-sm flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            role="status"
            aria-label="Active turn"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-white"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </motion.div>
        )}

        {/* Host crown */}
        {isHost && (
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#fff9c4] border-2 border-border wobbly-border p-0.5 -rotate-6"
            role="img"
            aria-label="Host"
          >
            <Crown size={14} className="text-primary" strokeWidth={2.5} />
          </div>
        )}
      </div>

      {/* Player info */}
      <div
        className={clsx(
          "flex-1 min-w-0",
          orientation === "vertical" ? "w-full" : "",
        )}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <p
            className={clsx("font-bold text-foreground truncate", config.text)}
          >
            {displayName}
          </p>
          {isCurrentPlayer && (
            <span
              className={clsx(
                "inline-flex items-center gap-1 font-bold text-primary bg-[#fff9c4] border-2 border-border wobbly-border rotate-2",
                config.badge,
              )}
              role="status"
              aria-label="You"
            >
              <Circle size={8} className="fill-current" strokeWidth={3} />
              You
            </span>
          )}
        </div>

        {/* Score */}
        {typeof score === "number" && (
          <p
            className={clsx(
              "text-foreground font-bold opacity-80",
              config.text,
            )}
          >
            Score: {score}
          </p>
        )}

        {/* Metadata */}
        {metadata && Object.keys(metadata).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(metadata)
              .slice(0, 2)
              .map(([key, value]) => (
                <span
                  key={key}
                  className="text-[10px] sm:text-xs text-foreground bg-[#e5e0d8] border-2 border-border border-dashed wobbly-border px-1.5 py-0.5"
                >
                  {key}: {String(value)}
                </span>
              ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
