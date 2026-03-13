/**
 * PhaseIndicator component fixtures
 * Demonstrates phase and turn status display
 */
import React from "react";
import { PhaseIndicator } from "../PhaseIndicator.js";

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-8">
      <div className="max-w-md mx-auto space-y-6">{children}</div>
    </div>
  );
}

const phaseLabels: Record<string, string> = {
  rollDice: "Roll Dice",
  playerActions: "Take Actions",
  tradePhase: "Trade Phase",
  endTurn: "End Turn",
  moveRobber: "Move the Robber",
  discardCards: "Discard Cards",
  setupPhase: "Setup Phase",
};

export default {
  default: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Default (Badge Variant)
      </h2>
      <PhaseIndicator currentPhase="playerActions" phaseLabels={phaseLabels} />
    </Container>
  ),

  yourTurn: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Your Turn</h2>
      <PhaseIndicator
        currentPhase="playerActions"
        phaseLabels={phaseLabels}
        isMyTurn={true}
      />
    </Container>
  ),

  waitingForOthers: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Waiting for Others</h2>
      <PhaseIndicator
        currentPhase="playerActions"
        phaseLabels={phaseLabels}
        isMyTurn={false}
        activePlayerNames={["Alice", "Bob"]}
      />
    </Container>
  ),

  singleActivePlayer: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Single Active Player
      </h2>
      <PhaseIndicator
        currentPhase="rollDice"
        phaseLabels={phaseLabels}
        isMyTurn={false}
        activePlayerNames={["Alice"]}
      />
    </Container>
  ),

  barVariant: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Bar Variant</h2>
      <PhaseIndicator
        currentPhase="playerActions"
        phaseLabels={phaseLabels}
        isMyTurn={true}
        variant="bar"
      />
    </Container>
  ),

  minimalVariant: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Minimal Variant</h2>
      <PhaseIndicator
        currentPhase="playerActions"
        phaseLabels={phaseLabels}
        variant="minimal"
      />
    </Container>
  ),

  noLabels: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Auto-Formatted Phase (No Labels)
      </h2>
      <p className="text-slate-400 text-sm mb-4">
        Automatically formats camelCase phase names
      </p>
      <div className="space-y-2">
        <PhaseIndicator currentPhase="rollForProduction" />
        <PhaseIndicator currentPhase="moveSpacePirate" />
        <PhaseIndicator currentPhase="playerActions" />
      </div>
    </Container>
  ),

  allPhases: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">All Phases Example</h2>
      <div className="space-y-3">
        <div>
          <p className="text-slate-500 text-xs mb-1">Setup</p>
          <PhaseIndicator currentPhase="setupPhase" phaseLabels={phaseLabels} />
        </div>
        <div>
          <p className="text-slate-500 text-xs mb-1">Roll Dice</p>
          <PhaseIndicator
            currentPhase="rollDice"
            phaseLabels={phaseLabels}
            isMyTurn={true}
          />
        </div>
        <div>
          <p className="text-slate-500 text-xs mb-1">Move Robber</p>
          <PhaseIndicator
            currentPhase="moveRobber"
            phaseLabels={phaseLabels}
            isMyTurn={true}
          />
        </div>
        <div>
          <p className="text-slate-500 text-xs mb-1">Player Actions</p>
          <PhaseIndicator
            currentPhase="playerActions"
            phaseLabels={phaseLabels}
            isMyTurn={true}
          />
        </div>
        <div>
          <p className="text-slate-500 text-xs mb-1">Trade</p>
          <PhaseIndicator
            currentPhase="tradePhase"
            phaseLabels={phaseLabels}
            isMyTurn={true}
          />
        </div>
        <div>
          <p className="text-slate-500 text-xs mb-1">End Turn</p>
          <PhaseIndicator
            currentPhase="endTurn"
            phaseLabels={phaseLabels}
            isMyTurn={true}
          />
        </div>
      </div>
    </Container>
  ),

  gameHeader: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">As Game Header</h2>
      <div className="bg-slate-800/50 p-4 rounded-lg flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Space Settlers</h3>
          <p className="text-slate-400 text-sm">Turn 5</p>
        </div>
        <PhaseIndicator
          currentPhase="playerActions"
          phaseLabels={phaseLabels}
          isMyTurn={true}
          variant="badge"
        />
      </div>
    </Container>
  ),
};
