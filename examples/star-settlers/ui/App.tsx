import { literals, type ResourceId } from "@dreamboard/manifest-contract";
import {
  DiceRoller,
  GameEndDisplay,
  ResourceCounter,
  ToastProvider,
  useGameView,
  useGameplayPhase,
  useIsMyTurn,
  usePlayerInfo,
  usePluginActions,
  usePluginSession,
  useToast,
  type PlayerInfoBadge,
  type ResourceDisplayConfig,
  type ViewCard,
} from "@dreamboard/ui-sdk";
import {
  WorkspaceGameShell,
  useActivePlayers,
  useInteractionByKey,
  usePlayerTurnOrder,
} from "@dreamboard/ui-contract";
import { StarSettlersBoard } from "./star-settlers-board";

// ─── Constants ────────────────────────────────────────────────────────────────

const RESOURCES = [
  "carbon",
  "alloy",
  "water",
  "fiber",
  "crystal",
] as const satisfies readonly ResourceId[];

const RESOURCE_CONFIG: readonly ResourceDisplayConfig[] = RESOURCES.map(
  (resource) => ({
    type: resource,
    label: literals.resourcePresentationById[resource]?.label ?? resource,
    icon: literals.resourcePresentationById[resource]?.icon ?? resource,
  }),
);

// ─── Tech card hand (surfaces.hand) ───────────────────────────────────────────
//
// Each tech-card interaction (`playPatrol`, `playBountySurvey`, …) is
// authored as its own `surface: "hand"` interaction so the trusted
// bundle can project per-card eligibility. The SDK zone renderer owns the
// drawer, card click routing, disabled state, and any follow-up form inputs;
// Star Settlers only supplies the visual face for each card type.

const TECH_CARD_LABEL: Record<string, string> = {
  relicCache: "Relic Cache",
  patrol: "Patrol",
  bountySurvey: "Bounty Survey",
  signalLock: "Signal Lock",
  jumpGate: "Jump Gate",
};

const TECH_CARD_ICON: Record<string, string> = {
  relicCache: "✨",
  patrol: "🛡️",
  bountySurvey: "🛰️",
  signalLock: "📡",
  jumpGate: "🌌",
};

const TECH_CARD_EFFECT: Record<string, string> = {
  relicCache: "1 INF",
  patrol: "Move raider, seize a card",
  bountySurvey: "Claim any 2 supplies",
  signalLock: "Claim all of one supply",
  jumpGate: "Build 2 free routes",
};

function TechCardFace({ card }: { card: ViewCard }) {
  const type = card.cardType;
  const icon = TECH_CARD_ICON[type] ?? "🎴";
  const label = TECH_CARD_LABEL[type] ?? type;
  const effect = TECH_CARD_EFFECT[type] ?? "";
  return (
    <div className="flex h-full flex-col items-center justify-between p-2 text-center">
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <span className="text-[11px] font-bold leading-tight text-slate-800">
        {label}
      </span>
      <span className="text-[9px] leading-tight text-slate-500">{effect}</span>
    </div>
  );
}

// ─── Game UI ─────────────────────────────────────────────────────────────────

function GameUI() {
  const view = useGameView();
  const gameplayPhase = useGameplayPhase();
  const players = usePlayerInfo();
  const isMyTurn = useIsMyTurn();
  const { controllingPlayerId, controllablePlayerIds } = usePluginSession();
  const { switchPlayer } = usePluginActions();
  const { error: showToastError } = useToast();
  const activePlayers = useActivePlayers();
  const turnOrder = usePlayerTurnOrder();
  const currentPlayerId = activePlayers[0] ?? turnOrder[0] ?? null;
  const rollDiceHandle = useInteractionByKey(
    gameplayPhase === "playerTurn" ? "playerTurn.rollDice" : null,
  );
  const rollDiceDialogHandle =
    rollDiceHandle?.descriptor.presentation?.mode === "dialog"
      ? rollDiceHandle
      : null;
  const diceValues = view.diceValues
    ? [view.diceValues[0], view.diceValues[1]]
    : undefined;

  const showActionError = (message: string) =>
    showToastError(`Action blocked: ${message}`, 6500);
  const setActionErrorFromUnknown = (error: unknown) =>
    showActionError(error instanceof Error ? error.message : String(error));

  const myResources = view.myResources;
  const influenceByPlayer = view.influenceByPlayerId;
  const patrolsByPlayer = view.patrolsByPlayerId;

  const raiderActive =
    view.raiderPending && view.discardPending.length === 0 && isMyTurn;

  const setupPlacedOutpost = view.setup?.placedOutpost ?? false;

  // ── HUD identity ─────────────────────────────────────────────────────
  // The shell HUD owns the opponent rail (top of the screen) and the
  // self playmat (bottom of the screen) when we hand it `hud.self` +
  // `hud.opponents`. We build a `<PlayerRailEntry>` per seat exactly
  // once and split the resulting list into "self" and "opponents"
  // downstream — the per-seat metadata (badges, switch handler, INF)
  // is identical between the two slots.
  const hudPlayerEntries = turnOrder.map((pid) => {
    const p = players.get(pid);
    const influence = influenceByPlayer[pid] ?? 0;
    const patrols = patrolsByPlayer[pid] ?? 0;
    const isActive = activePlayers.includes(pid);
    const canSwitchToPlayer =
      controllablePlayerIds.length > 1 &&
      controllablePlayerIds.includes(pid) &&
      pid !== controllingPlayerId;
    const badges: PlayerInfoBadge[] = [];
    if (view.longestRouteOwner === pid) {
      badges.push({
        key: "longest-route",
        icon: "🌌",
        tooltip: "Longest route",
      });
    }
    if (view.fleetCommandOwner === pid) {
      badges.push({
        key: "fleet-command",
        icon: "⚔️",
        label: patrols,
        tooltip: "Fleet command",
      });
    }
    return {
      playerId: pid,
      name: p?.name ?? pid,
      color: p?.color,
      score: influence,
      scoreLabel: "INF",
      isActive,
      showAvatar: false,
      badges,
      onSwitchPlayer: canSwitchToPlayer ? () => switchPlayer(pid) : undefined,
    };
  });

  const hudSelf = controllingPlayerId
    ? hudPlayerEntries.find((entry) => entry.playerId === controllingPlayerId)
    : undefined;
  const hudOpponents = hudPlayerEntries.filter(
    (entry) => entry.playerId !== controllingPlayerId,
  );

  // ── HUD status ───────────────────────────────────────────────────────
  // Status banner copy for the HUD — the existing `titleSub` already
  // has the contextually-correct microcopy for setup, raider, and
  // play; we just have to plumb the high-level state through.
  // `waitingFor` is the resolved opponent name(s) — when there's no
  // controlling seat we leave it empty so the banner falls back to a
  // bare phase label.
  const waitingFor =
    !isMyTurn && currentPlayerId
      ? [players.get(currentPlayerId)?.name ?? currentPlayerId]
      : undefined;

  // ── Chrome slot 4: resources ──────────────────────────────────────────
  // SDK `<ResourceCounter>` replaces a hand-rolled 25-line grid. The
  // shell positions the strip directly above the hand so spend → play
  // actions are co-located (Fitts).
  const resourcesChrome = (
    <ResourceCounter
      resources={[...RESOURCE_CONFIG]}
      counts={myResources}
      layout="row"
      size="md"
      showZero
    />
  );

  const titleSub = view.winnerPlayerId
    ? "Game over"
    : gameplayPhase === "setup"
      ? setupPlacedOutpost
        ? "Stake a route from your new outpost."
        : "Pick a coastal outpost site."
      : raiderActive
        ? "The raider is loose — click a hex to relocate it."
        : isMyTurn
          ? view.diceRolled
            ? "Build, trade, or end your turn."
            : "Roll to start your turn."
          : undefined;

  return (
    <>
      <DiceRoller
        values={diceValues}
        diceCount={2}
        render={() => null}
        className="contents"
        rollAction={{
          handle: rollDiceDialogHandle,
          rollLabel: "Roll dice",
          resultLabel: "Roll total",
        }}
      />
      <WorkspaceGameShell
        title="Star Settlers"
        chrome={{
          primaryAction: "auto",
          resources: resourcesChrome,
        }}
        hud={{
          self: hudSelf,
          opponents: hudOpponents,
          status: {
            phase: gameplayPhase ?? "setup",
            phaseLabels: {
              setup: "Setup",
              playerTurn: view.diceRolled ? "Main actions" : "Roll dice",
            },
            isMyTurn,
            waitingFor,
            // Layered status row — workspace tip on top, dice
            // readout below when present. Co-locating the dice
            // total with the "Your turn" headline keeps Common
            // Region: every "what's happening *now*" signal lives
            // inside the banner.
            tip: (
              <span className="flex flex-wrap items-center gap-2">
                {titleSub ? <span>{titleSub}</span> : null}
                {diceValues ? (
                  <DiceRoller
                    values={diceValues}
                    render={({ values }) => (
                      <span
                        className="font-semibold tabular-nums"
                        aria-label={`Dice: ${values?.[0]} plus ${values?.[1]} equals ${
                          (values?.[0] ?? 0) + (values?.[1] ?? 0)
                        }`}
                      >
                        🎲 {values?.[0]} + {values?.[1]} ={" "}
                        {(values?.[0] ?? 0) + (values?.[1] ?? 0)}
                      </span>
                    )}
                  />
                ) : null}
              </span>
            ),
          },
        }}
        layout={{ maxWidth: "min(1400px, calc(100vw - 24px))" }}
        board={(board) => (
          <StarSettlersBoard
            view={view}
            board={board}
            players={players}
            controllingPlayerId={controllingPlayerId}
            isMyTurn={isMyTurn}
            gameplayPhase={gameplayPhase}
            onActionError={setActionErrorFromUnknown}
          />
        )}
        surfaces={{
          // Tech cards are driven by the reducer-authored `techHand` zone.
          // The SDK drawer owns the chrome so the hand stays available
          // without blocking the board or lower action panels.
          hand: {
            zones: {
              techHand: {
                label: "Tech cards",
                presentation: {
                  mode: "drawer",
                  defaultOpen: false,
                  placement: "bottom-left",
                  toggleLabel: ({ count }) => `Tech cards (${count})`,
                },
                renderCardContent: (card) => <TechCardFace card={card} />,
              },
            },
          },
          panel: {
            // `rollDice` opts into dialog presentation in the reducer.
            // This override tells the shell that Star Settlers dice roller owns
            // that dialog so the generic one-button dialog is not rendered.
            "playerTurn.rollDice": () => null,
          },
        }}
      />

      <GameEndDisplay
        isGameOver={!!view.winnerPlayerId}
        scores={turnOrder.map((playerId) => ({
          playerId,
          name: players.get(playerId)?.name ?? playerId,
          score: influenceByPlayer[playerId] ?? 0,
          isWinner: playerId === view.winnerPlayerId,
        }))}
        winnerMessage="The sector charter is settled."
      />
    </>
  );
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ToastProvider>
      <GameUI />
    </ToastProvider>
  );
}
