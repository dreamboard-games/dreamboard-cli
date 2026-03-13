/**
 * PlayerSwitcher component - Allows switching between players controlled by the same user
 *
 * Features:
 * - Shows dropdown when user controls multiple seats
 * - Displays current player with ability to switch
 * - Hidden when user controls only one player
 * - Compact, floating design that stays out of the way
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { ChevronDown, User, Check } from "lucide-react";
import { usePluginSession } from "../context/PluginSessionContext.js";
import { useRuntimeContext } from "../context/RuntimeContext.js";
import type { PluginRuntimeAPI } from "../runtime/createPluginRuntimeAPI.js";
import type { LobbyState } from "../types/plugin-state.js";

export interface PlayerSwitcherProps {
  /** Additional class names */
  className?: string;
  /** Position of the switcher */
  position?: "top-left" | "top-right" | "top-center";
}

/**
 * Represents a controllable player for the switcher UI.
 * Uses seat info when available, falls back to player ID.
 */
interface ControllablePlayer {
  playerId: string;
  displayName: string;
}

/**
 * PlayerSwitcher allows users who control multiple seats to switch between them.
 *
 * This component should be rendered outside of the main App component,
 * typically by the PluginRuntime wrapper.
 *
 * @example
 * ```tsx
 * <PluginRuntime>
 *   <PlayerSwitcher position="top-right" />
 *   <App />
 * </PluginRuntime>
 * ```
 */
export function PlayerSwitcher({
  className,
  position = "top-right",
}: PlayerSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { controllablePlayerIds, controllingPlayerId } = usePluginSession();
  const runtime = useRuntimeContext() as PluginRuntimeAPI;

  // Get lobby state if available (may be null during gameplay if backend doesn't send it)
  const lobby: LobbyState | null = useMemo(() => {
    if (!runtime.getSnapshot) return null;
    return runtime.getSnapshot()?.lobby ?? null;
  }, [runtime]);

  // Build controllable players list - use seat info when available, fall back to player IDs
  const controllablePlayers: ControllablePlayer[] = useMemo(() => {
    return controllablePlayerIds.map((playerId) => {
      // Try to find seat info for display name
      const seat = lobby?.seats?.find((s) => s.playerId === playerId);
      return {
        playerId,
        displayName: seat?.displayName || playerId,
      };
    });
  }, [controllablePlayerIds, lobby]);

  // Get current player info
  const currentPlayer = useMemo(() => {
    return controllablePlayers.find((p) => p.playerId === controllingPlayerId);
  }, [controllablePlayers, controllingPlayerId]);

  // Don't render if user controls 0 or 1 player
  if (controllablePlayerIds.length <= 1) {
    return null;
  }

  const handleSwitchPlayer = (newPlayerId: string) => {
    if (newPlayerId !== controllingPlayerId && runtime.switchPlayer) {
      runtime.switchPlayer(newPlayerId);
    }
    setIsOpen(false);
  };

  const positionClasses = {
    "top-left": "left-3 top-3",
    "top-right": "right-3 top-3",
    "top-center": "left-1/2 -translate-x-1/2 top-3",
  };

  return (
    <div className={clsx("fixed z-50", positionClasses[position], className)}>
      {/* Current player button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-white/90 backdrop-blur-md shadow-lg",
          "border border-slate-200/80",
          "text-sm font-medium text-slate-700",
          "hover:bg-white hover:shadow-xl",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Playing as ${currentPlayer?.displayName || controllingPlayerId}. Click to switch player.`}
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          <User size={14} className="text-white" aria-hidden="true" />
        </div>
        <span className="max-w-[120px] truncate">
          {currentPlayer?.displayName || controllingPlayerId}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown
            size={16}
            className="text-slate-400"
            aria-hidden="true"
          />
        </motion.div>
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={clsx(
                "absolute z-50 mt-2 min-w-[180px]",
                "bg-white/95 backdrop-blur-md rounded-lg shadow-xl",
                "border border-slate-200/80",
                "overflow-hidden",
                position === "top-center" ? "left-1/2 -translate-x-1/2" : "",
                position === "top-right" ? "right-0" : "",
                position === "top-left" ? "left-0" : "",
              )}
              role="listbox"
              aria-label="Select player"
            >
              <div className="p-1">
                <p className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Switch Player
                </p>
                {controllablePlayers.map((player) => {
                  const isSelected = player.playerId === controllingPlayerId;
                  return (
                    <motion.button
                      key={player.playerId}
                      onClick={() => handleSwitchPlayer(player.playerId)}
                      className={clsx(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md",
                        "text-left text-sm transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
                        isSelected
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700 hover:bg-slate-50",
                      )}
                      whileHover={{ x: 2 }}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div
                        className={clsx(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          isSelected
                            ? "bg-gradient-to-br from-blue-400 to-purple-500"
                            : "bg-slate-200",
                        )}
                      >
                        <User
                          size={16}
                          className={
                            isSelected ? "text-white" : "text-slate-500"
                          }
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {player.displayName}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {player.playerId}
                        </p>
                      </div>
                      {isSelected && (
                        <Check
                          size={16}
                          className="text-blue-500 flex-shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
