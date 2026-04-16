/**
 * Worker placement visualization for Euro games (Agricola, Viticulture, Lords of Waterdeep).
 */

import { useMemo, type ReactNode } from "react";
import { clsx } from "clsx";
import { Users, Lock, Gift, Coins } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface SlotDefinition {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  /** One player per round */
  exclusive?: boolean;
  /** Personal action space owner */
  owner?: string;
  group?: string;
  cost?: Record<string, number>;
  reward?: Record<string, number>;
  type?: string;
  position?: { x: number; y: number };
  data?: Record<string, unknown>;
}

export interface SlotOccupant {
  pieceId: string;
  playerId: string;
  slotId: string;
  data?: Record<string, unknown>;
}

export interface SlotSystemProps {
  slots: readonly SlotDefinition[];
  occupants: readonly SlotOccupant[];
  renderSlot: (slot: SlotDefinition, occupants: SlotOccupant[]) => ReactNode;
  layout?: "grid" | "list" | "grouped";
  width?: number | string;
  height?: number | string;
  /** Minimum slot width for responsive grid */
  minSlotWidth?: number;
  className?: string;
}

// ============================================================================
// Pre-built Helper Components
// ============================================================================

export interface DefaultSlotItemProps {
  name: string;
  description?: string;
  capacity: number;
  occupantCount: number;
  isExclusive?: boolean;
  isAvailable?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
  costLabel?: string;
  rewardLabel?: string;
  renderOccupants?: () => ReactNode;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  className?: string;
}

/** Pre-built slot item for use in `renderSlot`. */
export function DefaultSlotItem({
  name,
  description,
  capacity,
  occupantCount,
  isExclusive = false,
  isAvailable = true,
  isHighlighted = false,
  isSelected = false,
  costLabel,
  rewardLabel,
  renderOccupants,
  onClick,
  onPointerEnter,
  onPointerLeave,
  className,
}: DefaultSlotItemProps) {
  const isFull = occupantCount >= capacity;

  return (
    <div
      onClick={isAvailable ? onClick : undefined}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={clsx(
        "p-4 rounded-lg border-2 transition-all",
        // Availability styling
        isAvailable && onClick && "cursor-pointer hover:bg-blue-500/10",
        isAvailable ? "border-blue-500" : "border-slate-600",
        // State styling
        isFull && "border-red-500/50 bg-slate-800/50",
        isHighlighted && "ring-2 ring-yellow-500",
        isSelected && "ring-2 ring-blue-500 bg-blue-500/10",
        className,
      )}
      role="listitem"
      aria-label={name}
      aria-disabled={!isAvailable}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-white">{name}</h3>
          {description && (
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          )}
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-1">
          {isExclusive && (
            <Lock
              className="w-4 h-4 text-amber-500"
              aria-label="Exclusive slot"
            />
          )}
          {capacity > 1 && (
            <div
              className="flex items-center gap-0.5 text-xs text-slate-400"
              title={`Capacity: ${capacity}`}
            >
              <Users className="w-3 h-3" />
              <span>{capacity}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cost/Reward */}
      {(costLabel || rewardLabel) && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {costLabel && (
            <div className="flex items-center gap-1 text-red-400">
              <Coins className="w-3 h-3" aria-hidden="true" />
              <span>{costLabel}</span>
            </div>
          )}
          {rewardLabel && (
            <div className="flex items-center gap-1 text-green-400">
              <Gift className="w-3 h-3" aria-hidden="true" />
              <span>{rewardLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* Occupants */}
      {renderOccupants && <div className="mt-2">{renderOccupants()}</div>}

      {/* Availability indicator */}
      {!isAvailable && !isFull && (
        <div className="mt-2 text-xs text-slate-500">Not available</div>
      )}
    </div>
  );
}

export interface DefaultSlotOccupantProps {
  color?: string;
  size?: number;
  shape?: "circle" | "square";
  label?: string;
  onClick?: () => void;
  className?: string;
}
export function DefaultSlotOccupant({
  color = "#3b82f6",
  size = 24,
  shape = "circle",
  label,
  onClick,
  className,
}: DefaultSlotOccupantProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "transition-all",
        shape === "circle" ? "rounded-full" : "rounded",
        onClick && "cursor-pointer hover:scale-110",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
      title={label}
      role="img"
      aria-label={label ?? "Occupant"}
    />
  );
}

export interface DefaultEmptySlotProps {
  size?: number;
  className?: string;
}
export function DefaultEmptySlot({
  size = 24,
  className,
}: DefaultEmptySlotProps) {
  return (
    <div
      className={clsx(
        "rounded-full border-2 border-dashed border-slate-600",
        className,
      )}
      style={{ width: size, height: size }}
      title="Empty slot"
      role="img"
      aria-label="Empty slot"
    />
  );
}

// ============================================================================
// Component
// ============================================================================

export function SlotSystem({
  slots,
  occupants = [],
  renderSlot,
  layout = "grid",
  width,
  height,
  minSlotWidth = 280,
  className,
}: SlotSystemProps) {
  // Group occupants by slot
  const occupantsBySlot = useMemo(() => {
    const map: Record<string, SlotOccupant[]> = {};
    occupants.forEach((o) => {
      const slotId = o.slotId;
      const existing = map[slotId];
      if (existing) {
        existing.push(o);
      } else {
        map[slotId] = [o];
      }
    });
    return map;
  }, [occupants]);

  // Group slots by group property for grouped layout
  const slotGroups = useMemo(() => {
    if (layout !== "grouped") return null;

    const groups: Record<string, SlotDefinition[]> = {};
    slots.forEach((slot) => {
      const group = slot.group ?? "Other";
      const existing = groups[group];
      if (existing) {
        existing.push(slot);
      } else {
        groups[group] = [slot];
      }
    });
    return groups;
  }, [slots, layout]);

  // Render a single slot
  const renderSlotItem = (slot: SlotDefinition) => {
    const slotOccupants = occupantsBySlot[slot.id] ?? [];

    return (
      <div key={slot.id} role="listitem" aria-label={slot.name}>
        {renderSlot(slot, slotOccupants)}
      </div>
    );
  };

  // Responsive grid style - uses auto-fit to stack items when they don't fit
  const responsiveGridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(auto-fit, minmax(${minSlotWidth}px, 1fr))`,
    gap: "1rem",
  };

  // Container wrapper
  const wrapContent = (content: ReactNode) => (
    <div style={{ width, height }} className={clsx("slot-system", className)}>
      {content}
    </div>
  );

  // Render based on layout
  if (layout === "grouped" && slotGroups) {
    return wrapContent(
      <div className="space-y-6" role="list">
        {Object.entries(slotGroups).map(([groupName, groupSlots]) => (
          <div key={groupName}>
            <h3 className="text-lg font-semibold text-slate-300 mb-3">
              {groupName}
            </h3>
            <div style={responsiveGridStyle}>
              {groupSlots.map(renderSlotItem)}
            </div>
          </div>
        ))}
      </div>,
    );
  }

  if (layout === "list") {
    return wrapContent(
      <div className="flex flex-col gap-2" role="list">
        {slots.map(renderSlotItem)}
      </div>,
    );
  }

  // Default grid layout - responsive by default
  return wrapContent(
    <div style={responsiveGridStyle} role="list">
      {slots.map(renderSlotItem)}
    </div>,
  );
}
