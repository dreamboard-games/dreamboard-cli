import { formInput } from "@dreamboard/app-sdk/reducer";
import type { GameState } from "../../game-contract";
import { coloniesByVertexId, type Q } from "../../reducer-support";
import { computeBankTradeRates, portsByVertex } from "../../derived";
import {
  literals,
  type PlayerId,
  type ResourceId,
} from "../../../shared/manifest-contract";
import type {
  PlayerTurnPresentation,
  PlayerTurnStatusSection,
} from "./turn-state";

const NO_SEIZE_TARGET = "__none" as const;
export type RaiderSeizeTarget = PlayerId | typeof NO_SEIZE_TARGET;

function resourceMapDomain(
  maxFor: (q: Q, playerId: PlayerId, resourceId: ResourceId) => number,
) {
  return formInput.resourceMap<GameState>({
    resources: literals.resourceIds.map((resourceId) => ({
      resourceId,
      max: ({ q, playerId }) =>
        maxFor(q as Q, playerId as PlayerId, resourceId),
    })),
  });
}

export function ownedResourceMapDomain() {
  return resourceMapDomain((q, playerId, resourceId) =>
    q.player.resource(playerId, resourceId),
  );
}

export function openResourceMapDomain() {
  return resourceMapDomain((q, playerId) => q.player.resourceTotal(playerId));
}

export function otherPlayerChoices(q: Q, playerId: PlayerId) {
  return q.player
    .order()
    .filter((pid) => pid !== playerId)
    .map((pid) => ({ value: pid, label: pid }));
}

function formatResourceCounts(counts: Partial<Record<ResourceId, number>>) {
  return literals.resourceIds.flatMap((resourceId) => {
    const amount = counts[resourceId] ?? 0;
    const presentation = literals.resourcePresentationById[resourceId];
    const label = presentation?.label ?? resourceId;
    const icon = presentation?.icon ? `${presentation.icon} ` : "";
    return amount > 0 ? [`${icon}${amount} ${label}`] : [];
  });
}

function pendingTradeStatusSections(): PlayerTurnStatusSection[] {
  return [
    {
      label: "Offer",
      empty: "Nothing offered",
      values: ({ state }) => {
        const trade = state.phase.pendingTrade;
        return trade ? formatResourceCounts(trade.give) : [];
      },
    },
    {
      label: "Request",
      empty: "Nothing requested",
      values: ({ state }) => {
        const trade = state.phase.pendingTrade;
        return trade ? formatResourceCounts(trade.want) : [];
      },
    },
    {
      label: "Accepted",
      empty: "No one yet",
      values: ({ state }) => {
        const trade = state.phase.pendingTrade;
        return trade?.acceptedBy ?? [];
      },
    },
    {
      label: "Rejected",
      empty: "No rejections",
      values: ({ state }) => {
        const trade = state.phase.pendingTrade;
        return trade?.rejectedBy ?? [];
      },
    },
    {
      label: "Waiting",
      empty: "Everyone has responded",
      values: ({ state }) => {
        const trade = state.phase.pendingTrade;
        if (!trade) return [];
        return trade.targetPlayerIds.filter(
          (pid) =>
            !trade.acceptedBy.includes(pid) && !trade.rejectedBy.includes(pid),
        );
      },
    },
  ];
}

export function pendingTradeDialog(
  title: string,
  description: string,
): PlayerTurnPresentation {
  return {
    mode: "dialog" as const,
    dialog: {
      group: "pendingTrade",
      title,
      description,
      dismissBehavior: {
        type: "minimize" as const,
        trayLabel: "Trade",
        trayIcon: "🤝",
      },
      statusSections: pendingTradeStatusSections(),
    },
  };
}

export function bankTradeResourceChoices() {
  return formInput.resourceChoices<GameState>({
    decorate: ({ state, playerId, q, derived, resourceId }) => {
      const typedResourceId = resourceId as ResourceId;
      const rate = computeBankTradeRates(
        coloniesByVertexId(state, q as Q),
        derived(portsByVertex),
        playerId as PlayerId,
      )[typedResourceId];
      const label =
        literals.resourcePresentationById[typedResourceId]?.label ??
        typedResourceId;
      return {
        badge: `${rate}:1`,
        description: `Give ${rate} ${label} to receive 1 resource.`,
      };
    },
  });
}

export function raiderSeizeTargetInput() {
  return formInput.choice<RaiderSeizeTarget, GameState>({
    choices: ({ q, playerId }) => [
      { value: NO_SEIZE_TARGET, label: "No steal" },
      ...otherPlayerChoices(q as Q, playerId as PlayerId),
    ],
    defaultValue: NO_SEIZE_TARGET,
  });
}

export function toRaiderSeizePlayerId(
  target: RaiderSeizeTarget,
): PlayerId | null {
  return target === NO_SEIZE_TARGET ? null : target;
}
