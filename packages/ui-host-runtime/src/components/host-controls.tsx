import { useMemo, useRef, useState } from "react";
import { cn } from "@dreamboard/ui/lib/utils";
import { Button } from "@dreamboard/ui/components/button";
import { Badge } from "@dreamboard/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@dreamboard/ui/components/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@dreamboard/ui/components/popover";
import { ScrollArea } from "@dreamboard/ui/components/scroll-area";
import {
  Check,
  ChevronDown,
  Clock3,
  History,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import type { HistoryState } from "../unified-session-store.js";

export interface HostControllablePlayer {
  playerId: string;
  displayName: string;
}

export interface HostPlayerSwitcherProps {
  controllablePlayers: HostControllablePlayer[];
  controllingPlayerId: string | null;
  onSwitchPlayer: (playerId: string) => void;
  className?: string;
}

export interface HostHistoryNavigatorProps {
  isHost: boolean;
  history: HistoryState | null;
  onRestoreHistory: (entryId: string) => Promise<void> | void;
  className?: string;
}

export interface HostSessionToolbarProps {
  children: React.ReactNode;
  className?: string;
}

function formatHistoryTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return timestamp;
  }
}

export function HostSessionToolbar({
  children,
  className,
}: HostSessionToolbarProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center justify-end gap-2", className)}
    >
      {children}
    </div>
  );
}

export function HostPlayerSwitcher({
  controllablePlayers,
  controllingPlayerId,
  onSwitchPlayer,
  className,
}: HostPlayerSwitcherProps) {
  const currentPlayer = useMemo(
    () =>
      controllablePlayers.find(
        (player) => player.playerId === controllingPlayerId,
      ) ?? controllablePlayers[0],
    [controllablePlayers, controllingPlayerId],
  );

  if (controllablePlayers.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "group h-auto min-h-14 min-w-[220px] justify-between gap-3 border-[3px] border-border bg-[#fffdf7] px-4 py-3 text-left text-foreground hard-shadow transition-all hover:-rotate-[0.35deg] hover:bg-[#fff9c4] hover:shadow-[2px_2px_0px_0px_#2d2d2d] wobbly-border-lg",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#e7eefc] text-[#2d5da1] wobbly-border">
              <Users className="h-4 w-4 text-[#2d5da1]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Seat Control
              </span>
              <span className="block truncate font-display text-lg leading-none text-foreground">
                {currentPlayer?.displayName ?? "Choose player"}
              </span>
              <span className="mt-1 block truncate text-xs font-bold text-muted-foreground">
                {currentPlayer?.playerId ?? "Switch the active seat"}
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-[#efe7da] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-foreground shadow-none"
            >
              {controllablePlayers.length} seats
            </Badge>
            <span className="flex h-8 w-8 items-center justify-center bg-[#efe7da] text-muted-foreground transition-transform group-data-[state=open]:rotate-180 wobbly-border">
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-[80] w-[22rem] border-[3px] border-border bg-[#fdfbf7] p-2 font-sans wobbly-border-lg hard-shadow"
      >
        <DropdownMenuLabel className="px-2 pb-3 pt-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Play As
              </p>
              <p className="mt-1 font-display text-xl leading-none text-foreground">
                Switch the active seat
              </p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#fff3b5] text-primary wobbly-border">
              <Sparkles className="h-4 w-4 text-primary" />
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-1 border-b-2 border-dashed border-border bg-transparent" />
        <DropdownMenuRadioGroup
          value={controllingPlayerId ?? ""}
          onValueChange={(playerId) => {
            if (playerId !== controllingPlayerId) {
              onSwitchPlayer(playerId);
            }
          }}
        >
          {controllablePlayers.map((player, index) => (
            <DropdownMenuRadioItem
              key={player.playerId}
              value={player.playerId}
              className={cn(
                "mb-2 rounded-none border border-transparent bg-white/75 px-3 py-3 pl-3 focus:bg-[#fff9c4] focus:text-foreground focus:outline-none focus:ring-2 focus:ring-border/20 data-[state=checked]:bg-[#fff9c4] data-[state=checked]:text-foreground [&>span]:hidden wobbly-border-md",
                index % 2 === 0 ? "rotate-[0.35deg]" : "-rotate-[0.35deg]",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#efe7da] text-sm font-bold text-foreground wobbly-border">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-display text-lg leading-none">
                      {player.displayName}
                    </span>
                  </div>
                  <span className="mt-1 block truncate text-xs font-bold text-muted-foreground">
                    {player.playerId}
                  </span>
                </div>
                {player.playerId === controllingPlayerId ? (
                  <span className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center bg-[#2d2d2d] text-[#fffdf7] wobbly-border">
                    <Check className="h-4 w-4" />
                  </span>
                ) : null}
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function HostHistoryNavigator({
  isHost,
  history,
  onRestoreHistory,
  className,
}: HostHistoryNavigatorProps) {
  const triggerContainerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmEntryId, setConfirmEntryId] = useState<string | null>(null);
  const [restoringEntryId, setRestoringEntryId] = useState<string | null>(null);

  const entries = useMemo(
    () => (history ? [...history.entries].reverse() : []),
    [history],
  );

  if (!isHost || !history || history.entries.length === 0) {
    return null;
  }

  const handleRestoreClick = async (entryId: string) => {
    if (confirmEntryId !== entryId) {
      setConfirmEntryId(entryId);
      return;
    }

    setRestoringEntryId(entryId);
    try {
      await onRestoreHistory(entryId);
      setOpen(false);
      setConfirmEntryId(null);
    } finally {
      setRestoringEntryId(null);
    }
  };

  const popoverContainer = (() => {
    const container = triggerContainerRef.current?.closest(
      "[data-slot='drawer-content']",
    );
    return container instanceof HTMLElement ? container : null;
  })();

  return (
    <div ref={triggerContainerRef}>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setConfirmEntryId(null);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-10 gap-2 border-[3px] border-border bg-white text-foreground hard-shadow wobbly-border-md transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d]",
              className,
            )}
          >
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="hidden sm:inline">History</span>
            <Badge
              variant="secondary"
              className="border-[2px] border-border bg-[#fff9c4] text-foreground"
            >
              {history.entries.length}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          container={popoverContainer}
          side="right"
          align="start"
          sideOffset={12}
          collisionPadding={16}
          style={{ zIndex: 200 }}
          className="z-[200] w-[26rem] border-[3px] border-border bg-[#fdfbf7] p-0 wobbly-border-lg hard-shadow"
        >
          <div className="border-b border-dashed border-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <History className="h-4 w-4" />
              Session History
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Restore a previous game state. This affects the shared host
              session.
            </p>
          </div>
          <ScrollArea className="max-h-80">
            <div className="space-y-2 p-3">
              {entries.map((entry: HistoryState["entries"][number]) => {
                const isConfirming = confirmEntryId === entry.id;
                const isRestoring = restoringEntryId === entry.id;

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "border-[2px] border-border px-3 py-3 transition-colors wobbly-border-md",
                      entry.isCurrent ? "bg-[#fff9c4]" : "bg-white",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {entry.description}
                          </span>
                          {entry.isCurrent && (
                            <Badge
                              variant="secondary"
                              className="shrink-0 border-[2px] border-border bg-[#e5e0d8] text-foreground"
                            >
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          <span>{formatHistoryTimestamp(entry.timestamp)}</span>
                          <span>v{entry.version}</span>
                        </div>
                      </div>
                      {!entry.isCurrent && (
                        <Button
                          size="sm"
                          variant={isConfirming ? "default" : "outline"}
                          className={cn(
                            "shrink-0 border-[3px] border-border shadow-[3px_3px_0px_0px_#2d2d2d] transition-all",
                            isConfirming
                              ? "bg-primary text-primary-foreground hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#2d2d2d]"
                              : "bg-white text-foreground hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#2d2d2d]",
                          )}
                          disabled={isRestoring}
                          onClick={() => void handleRestoreClick(entry.id)}
                        >
                          {isRestoring ? (
                            "Restoring..."
                          ) : isConfirming ? (
                            <>
                              <Check className="mr-1 h-4 w-4" />
                              Confirm
                            </>
                          ) : (
                            <>
                              <RotateCcw className="mr-1 h-4 w-4" />
                              Restore
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
