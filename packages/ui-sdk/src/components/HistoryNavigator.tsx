/**
 * HistoryNavigator component - Allows the host to navigate game state history
 *
 * Features:
 * - Shows dropdown with history entries when user is host
 * - Displays timeline of actions with timestamps
 * - Inline confirmation before restoring to a previous state
 * - Hidden when user is not the host
 * - Compact, floating design similar to PlayerSwitcher
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { History, RotateCcw, Check, X, Clock } from "lucide-react";
import { useRuntimeContext } from "../context/RuntimeContext.js";
import { useHistory, useIsHost } from "../hooks/useHistory.js";
import type { PluginRuntimeAPI } from "../runtime/createPluginRuntimeAPI.js";
import type { HistoryEntrySummary } from "../types/plugin-state.js";

export interface HistoryNavigatorProps {
  /** Additional class names */
  className?: string;
  /** Position of the navigator */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

/**
 * Format a timestamp for display in the history list.
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return timestamp;
  }
}

/**
 * HistoryNavigator allows the host to navigate back and forward through game state history.
 *
 * This component should be rendered outside of the main App component,
 * typically by the PluginRuntime wrapper alongside PlayerSwitcher.
 */
export function HistoryNavigator({
  className,
  position = "bottom-right",
}: HistoryNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmingEntryId, setConfirmingEntryId] = useState<string | null>(
    null,
  );

  const isHost = useIsHost();
  const history = useHistory();
  const runtime = useRuntimeContext() as PluginRuntimeAPI;

  const handleRestore = useCallback(
    (entryId: string) => {
      if (confirmingEntryId === entryId) {
        // User confirmed, execute restore
        runtime.restoreHistory?.(entryId);
        setConfirmingEntryId(null);
        setIsOpen(false);
      } else {
        // Start confirmation
        setConfirmingEntryId(entryId);
      }
    },
    [confirmingEntryId, runtime],
  );

  const handleCancelConfirm = useCallback(() => {
    setConfirmingEntryId(null);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setConfirmingEntryId(null);
  }, []);

  // Reverse entries so newest is at the top - safe when history is null
  const displayEntries = useMemo(
    () => (history ? [...history.entries].reverse() : []),
    [history],
  );

  // Don't render if user is not the host or history is not available
  if (!isHost || !history || history.entries.length === 0) {
    return null;
  }

  const positionClasses = {
    "top-left": "left-4 top-4",
    "top-right": "right-4 top-4",
    "bottom-left": "left-4 bottom-4",
    "bottom-right": "right-4 bottom-4",
  };

  const dropdownPositionClasses = {
    "top-left": "left-0 mt-3",
    "top-right": "right-0 mt-3",
    "bottom-left": "left-0 bottom-full mb-3",
    "bottom-right": "right-0 bottom-full mb-3",
  };

  return (
    <div
      className={clsx(
        "fixed z-50 font-sans",
        positionClasses[position],
        className,
      )}
    >
      {/* History button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 wobbly-border",
          "bg-[#fff9c4]",
          "border-[3px] border-border hard-shadow hover:hard-shadow-sm active:shadow-none",
          "text-sm sm:text-base font-bold text-foreground",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        )}
        whileHover={{ scale: 1.05, rotate: -2 }}
        whileTap={{ scale: 0.95 }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Game history. ${history.entries.length} states.`}
      >
        <div className="flex items-center justify-center">
          <History
            size={18}
            className="text-primary"
            strokeWidth={3}
            aria-hidden="true"
          />
        </div>
        <span className="hidden sm:inline">Time Travel</span>
        <span className="text-xs bg-white px-2 py-0.5 border-2 border-border wobbly-border">
          {history.entries.length}
        </span>
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={handleClose}
              aria-hidden="true"
            />

            {/* Dropdown */}
            <motion.div
              initial={{
                opacity: 0,
                y: position.startsWith("bottom") ? 10 : -10,
                scale: 0.95,
                rotate: 2,
              }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 1 }}
              exit={{
                opacity: 0,
                y: position.startsWith("bottom") ? 10 : -10,
                scale: 0.95,
                rotate: 0,
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={clsx(
                "absolute z-50 w-80 sm:w-96 max-h-[60vh] overflow-hidden",
                "bg-[#fdfbf7] wobbly-border-lg hard-shadow-lg",
                "border-[4px] border-border",
                "flex flex-col",
                dropdownPositionClasses[position],
              )}
              role="dialog"
              aria-label="Game state history"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b-[3px] border-border bg-[#e5e0d8] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary border border-border inline-block" />
                    Timeline
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground mt-0.5">
                    {history.entries.length} states saved
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 text-foreground border-2 border-transparent hover:border-border hover:bg-white wobbly-border transition-colors"
                  aria-label="Close history"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {displayEntries.map((entry) => (
                  <HistoryEntryItem
                    key={entry.id}
                    entry={entry}
                    isConfirming={confirmingEntryId === entry.id}
                    onRestore={handleRestore}
                    onCancelConfirm={handleCancelConfirm}
                  />
                ))}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2 border-t-[3px] border-border border-dashed bg-[#fff9c4]">
                <p className="text-xs font-bold text-foreground text-center">
                  ⚠️ Restoring overrides current state!
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Individual history entry item component.
 */
interface HistoryEntryItemProps {
  entry: HistoryEntrySummary;
  isConfirming: boolean;
  onRestore: (entryId: string) => void;
  onCancelConfirm: () => void;
}

function HistoryEntryItem({
  entry,
  isConfirming,
  onRestore,
  onCancelConfirm,
}: HistoryEntryItemProps) {
  return (
    <motion.div
      className={clsx(
        "relative wobbly-border-md overflow-hidden",
        "border-2 transition-colors",
        entry.isCurrent
          ? "bg-green-100 border-border"
          : isConfirming
            ? "bg-[#fff9c4] border-border"
            : "bg-white border-border hover:bg-[#e5e0d8] border-dashed",
      )}
      layout
    >
      <AnimatePresence mode="wait">
        {isConfirming ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-3 flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">
                Restore this state?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRestore(entry.id)}
                className="w-8 h-8 flex items-center justify-center border-2 border-border bg-primary text-white wobbly-border hover:brightness-90"
                aria-label="Confirm restore"
              >
                <Check size={16} strokeWidth={3} />
              </button>
              <button
                onClick={onCancelConfirm}
                className="w-8 h-8 flex items-center justify-center border-2 border-border bg-white text-foreground wobbly-border hover:bg-[#e5e0d8]"
                aria-label="Cancel"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="entry"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => !entry.isCurrent && onRestore(entry.id)}
            disabled={entry.isCurrent}
            className={clsx(
              "w-full p-3 flex items-start gap-3 text-left",
              "focus:outline-none focus:bg-[#e5e0d8]",
              entry.isCurrent ? "cursor-default" : "cursor-pointer",
            )}
          >
            {/* Icon */}
            <div
              className={clsx(
                "mt-0.5 w-6 h-6 border-2 border-border wobbly-border flex items-center justify-center flex-shrink-0",
                entry.isCurrent
                  ? "bg-green-400 text-white"
                  : "bg-white text-foreground",
              )}
            >
              {entry.isCurrent ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <RotateCcw size={14} strokeWidth={2.5} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p
                  className={clsx(
                    "text-sm font-bold truncate",
                    entry.isCurrent ? "text-green-800" : "text-foreground",
                  )}
                >
                  {entry.description}
                </p>
                {entry.isCurrent && (
                  <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 border-2 border-border bg-green-200 text-green-800 font-bold wobbly-border rotate-2">
                    Current
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs font-medium text-muted-foreground opacity-80">
                <Clock size={12} className="flex-shrink-0" />
                <span>{formatTimestamp(entry.timestamp)}</span>
                {entry.playerId && (
                  <>
                    <span>•</span>
                    <span className="truncate">{entry.playerId}</span>
                  </>
                )}
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
