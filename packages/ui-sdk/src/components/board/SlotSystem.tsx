/**
 * SlotSystem component - Worker placement visualization for Euro games
 *
 * Design Philosophy: "Strategic Placement"
 * - Grid/list layout for action slots
 * - All rendering controlled by parent via required render functions
 * - Pre-built helper components provided for easy customization
 *
 * Use cases: Agricola, Viticulture, Lords of Waterdeep, Caverna
 *
 * @example Basic usage with pre-built components
 * ```tsx
 * <SlotSystem
 *   slots={slots}
 *   occupants={occupants}
 *   renderSlot={(slot, slotOccupants) => (
 *     <DefaultSlotItem
 *       name={slot.name}
 *       description={slot.description}
 *       capacity={slot.capacity}
 *       occupantCount={slotOccupants.length}
 *       isExclusive={slot.exclusive}
 *       isAvailable={slotOccupants.length < slot.capacity}
 *       onClick={() => handlePlaceWorker(slot.id)}
 *       renderOccupants={() => (
 *         <div className="flex gap-1">
 *           {slotOccupants.map((o) => (
 *             <DefaultSlotOccupant key={o.pieceId} color={playerColors[o.playerId]} />
 *           ))}
 *         </div>
 *       )}
 *     />
 *   )}
 * />
 * ```
 */

import { useMemo, type ReactNode } from "react";
import { clsx } from "clsx";
import { Users, Lock, Gift, Coins } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface SlotDefinition {
  /** Unique slot identifier */
  id: string;
  /** Display name */
  name: string;
  /** Slot description */
  description?: string;
  /** How many pieces can occupy this slot */
  capacity: number;
  /** Is this slot exclusive (one player per round)? */
  exclusive?: boolean;
  /** Belongs to a specific player (personal action space) */
  owner?: string;
  /** Visual grouping */
  group?: string;
  /** Cost to use this slot */
  cost?: Record<string, number>;
  /** Reward for using this slot */
  reward?: Record<string, number>;
  /** Slot type for styling */
  type?: string;
  /** Position for custom layout */
  position?: { x: number; y: number };
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface SlotOccupant {
  /** Piece ID placed in slot */
  pieceId: string;
  /** Player who placed the piece */
  playerId: string;
  /** Slot ID where piece is placed */
  slotId: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface SlotSystemProps {
  /** Slot definitions */
  slots: SlotDefinition[];
  /** Current slot occupants - defaults to empty */
  occupants: SlotOccupant[];
  /** Custom slot renderer - required, receives slot and its occupants */
  renderSlot: (slot: SlotDefinition, occupants: SlotOccupant[]) => ReactNode;
  /** Layout style */
  layout?: "grid" | "list" | "grouped";
  /** Container width */
  width?: number | string;
  /** Container height */
  height?: number | string;
  /** Minimum slot width for responsive grid (default: 280px) */
  minSlotWidth?: number;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Pre-built Helper Components
// ============================================================================

export interface DefaultSlotItemProps {
  /** Slot name */
  name: string;
  /** Slot description */
  description?: string;
  /** Slot capacity */
  capacity: number;
  /** Current occupant count */
  occupantCount: number;
  /** Whether slot is exclusive */
  isExclusive?: boolean;
  /** Whether slot is available for placement */
  isAvailable?: boolean;
  /** Whether slot is highlighted */
  isHighlighted?: boolean;
  /** Whether slot is selected */
  isSelected?: boolean;
  /** Cost display (e.g., "-2 gold") */
  costLabel?: string;
  /** Reward display (e.g., "+3 grain") */
  rewardLabel?: string;
  /** Render function for occupants */
  renderOccupants?: () => ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Pointer enter handler */
  onPointerEnter?: () => void;
  /** Pointer leave handler */
  onPointerLeave?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * Pre-built slot item component for use in renderSlot
 *
 * @example
 * ```tsx
 * renderSlot={(slot, occupants) => (
 *   <DefaultSlotItem
 *     name={slot.name}
 *     description={slot.description}
 *     capacity={slot.capacity}
 *     occupantCount={occupants.length}
 *     isExclusive={slot.exclusive}
 *     isAvailable={occupants.length < slot.capacity}
 *     onClick={() => handlePlaceWorker(slot.id)}
 *   />
 * )}
 * ```
 */
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
  /** Occupant color */
  color?: string;
  /** Occupant size */
  size?: number;
  /** Occupant shape */
  shape?: "circle" | "square";
  /** Label or tooltip */
  label?: string;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * Pre-built slot occupant component for use in renderOccupant
 *
 * @example
 * ```tsx
 * renderOccupant={(occupant) => (
 *   <DefaultSlotOccupant
 *     color={playerColors[occupant.playerId]}
 *     label={`${occupant.playerId}'s worker`}
 *   />
 * )}
 * ```
 */
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
  /** Size of the empty slot marker */
  size?: number;
  /** Additional className */
  className?: string;
}

/**
 * Pre-built empty slot marker for showing remaining capacity
 *
 * @example
 * ```tsx
 * // In renderSlot, show empty slots for remaining capacity
 * {Array(capacity - occupants.length).fill(null).map((_, i) => (
 *   <DefaultEmptySlot key={i} />
 * ))}
 * ```
 */
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

/**
 * SlotSystem component for worker placement games
 *
 * Features:
 * - Multiple layout options (grid, list, grouped)
 * - Responsive grid that stacks items when container is narrow
 * - All rendering controlled by parent
 */
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
