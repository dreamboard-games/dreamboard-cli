import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  PluginStateProvider,
  RuntimeProvider,
  useGameView,
  useIsMyTurn,
  usePluginState,
  type PluginStateSnapshot,
  type RuntimeAPI,
} from "@dreamboard/ui-sdk";
import {
  useBoardInteractions,
  useInteractionByKey,
} from "../../shared/generated/ui-contract";

const PLAYER_ID = "player-1";

type Projection = {
  currentStage: string;
  stageSeats: string[];
  view: unknown;
  availableInteractions: PluginStateSnapshot["gameplay"]["availableInteractions"];
  zones: NonNullable<PluginStateSnapshot["gameplay"]["zones"]>;
};

function readProjection(path: string): Projection {
  return JSON.parse(
    readFileSync(new URL(path, import.meta.url), "utf8"),
  ) as Projection;
}

function createRuntime(options?: {
  projectionPath?: string;
  projectionOverride?: (projection: Projection) => Projection;
  submitted?: unknown[];
}): RuntimeAPI & {
  getSnapshot: () => PluginStateSnapshot;
  subscribeToState: (
    listener: (state: PluginStateSnapshot) => void,
  ) => () => void;
} {
  const rawProjection = readProjection(
    options?.projectionPath ??
      "../generated/bases/initial-turn/player-1.projection.json",
  );
  const projection =
    options?.projectionOverride?.(rawProjection) ?? rawProjection;
  const session = {
    status: "ready" as const,
    sessionId: "session-1",
    controllablePlayerIds: [PLAYER_ID],
    controllingPlayerId: PLAYER_ID,
    userId: "user-1",
  };
  const snapshot: PluginStateSnapshot = {
    view: projection.view,
    gameplay: {
      currentPhase: projection.currentStage,
      currentStage: projection.currentStage,
      activePlayers: projection.stageSeats,
      availableInteractions: projection.availableInteractions,
      zones: projection.zones,
    },
    lobby: null,
    notifications: [],
    session,
    history: null,
    syncId: 1,
  };

  return {
    validateInteraction: async () => ({ valid: true }),
    submitInteraction: async (_playerId, _interactionId, params) => {
      options?.submitted?.push(params);
    },
    getSessionState: () => session,
    disconnect: () => undefined,
    getSnapshot: () => snapshot,
    subscribeToState: () => () => undefined,
  };
}

function Probe() {
  const view = useGameView();
  const phase = usePluginState((state) => state.gameplay.currentPhase);
  const placeOutpost = useInteractionByKey("setup.placeSetupOutpost");
  const isMyTurn = useIsMyTurn();

  return (
    <div
      data-phase={phase ?? "missing"}
      data-is-my-turn={isMyTurn ? "true" : "false"}
      data-outpost-surface={placeOutpost?.descriptor.surface ?? "missing"}
      data-space-count={view.spaces.length}
    />
  );
}

function renderWithRuntime(
  runtime: ReturnType<typeof createRuntime>,
  children: React.ReactNode,
): string {
  return renderToStaticMarkup(
    <RuntimeProvider runtime={runtime}>
      <PluginStateProvider>{children}</PluginStateProvider>
    </RuntimeProvider>,
  );
}

test("Star Settlers UI hooks expose typed game state and setup interaction", () => {
  const runtime = createRuntime();

  const markup = renderWithRuntime(runtime, <Probe />);

  assert.match(markup, /data-phase="setup"/);
  assert.match(markup, /data-is-my-turn="true"/);
  assert.match(markup, /data-outpost-surface="board-vertex"/);
  assert.match(markup, /data-space-count="37"/);
});

test("Star Settlers generated interaction handle submits tech-card params", async () => {
  const submitted: unknown[] = [];
  const runtime = createRuntime({
    projectionPath: "../generated/bases/after-setup/player-1.projection.json",
    submitted,
  });
  let submitYearOfPlenty: (() => Promise<void>) | null = null;

  function YearOfPlentyProbe() {
    const handle = useInteractionByKey("playerTurn.playBountySurvey");
    submitYearOfPlenty = () =>
      handle!.submit({
        cardId: "dev-year-of-plenty-1",
        resource1: "alloy",
        resource2: "crystal",
      });
    return <div data-has-handle={handle ? "true" : "false"} />;
  }

  const markup = renderWithRuntime(runtime, <YearOfPlentyProbe />);

  assert.match(markup, /data-has-handle="true"/);
  assert.ok(submitYearOfPlenty);
  await submitYearOfPlenty();
  assert.deepEqual(submitted, [
    {
      cardId: "dev-year-of-plenty-1",
      resource1: "alloy",
      resource2: "crystal",
    },
  ]);
});

test("Star Settlers board dispatch submits the reducer-selected edge interaction", async () => {
  const edgeId = "hex-edge:-1,-1,2::-2,1,1";
  const submitted: unknown[] = [];
  const runtime = createRuntime({
    projectionPath: "../generated/bases/after-setup/player-1.projection.json",
    submitted,
    projectionOverride: (projection) => ({
      ...projection,
      availableInteractions: projection.availableInteractions.map(
        (descriptor) => {
          if (descriptor.interactionKey === "playerTurn.buildRoute") {
            return {
              ...descriptor,
              available: true,
              unavailableReason: undefined,
              inputs: descriptor.inputs.map((input) =>
                input.key === "edgeId" && input.domain.type === "target"
                  ? {
                      ...input,
                      domain: {
                        ...input.domain,
                        eligibleTargets: [edgeId],
                      },
                    }
                  : input,
              ),
            };
          }
          return descriptor;
        },
      ),
    }),
  });
  let selectEdge: (() => Promise<string | null>) | null = null;

  function BuildRouteProbe() {
    const board = useBoardInteractions();
    selectEdge = () => board.select.edge(edgeId);
    return (
      <div
        data-can-build-route={board.eligible.edge.has(edgeId) ? "true" : "false"}
      />
    );
  }

  const markup = renderWithRuntime(runtime, <BuildRouteProbe />);
  assert.match(markup, /data-can-build-route="true"/);
  assert.ok(selectEdge);

  const fired = await selectEdge();
  assert.equal(fired, "playerTurn.buildRoute");
  assert.deepEqual(submitted, [
    {
      edgeId,
    },
  ]);
});
