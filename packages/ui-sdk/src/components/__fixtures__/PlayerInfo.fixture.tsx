/**
 * PlayerInfo component fixtures
 * Demonstrates player information display in various states
 */
import React from "react";
import { PlayerInfo } from "../PlayerInfo.js";

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-8">
      <div className="max-w-md mx-auto space-y-4">{children}</div>
    </div>
  );
}

export default {
  default: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Default Player</h2>
      <PlayerInfo playerId="player-1" name="Alice" score={42} />
    </Container>
  ),

  activePlayer: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Active Player (Their Turn)
      </h2>
      <PlayerInfo playerId="player-2" name="Bob" score={35} isActive={true} />
    </Container>
  ),

  currentUser: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Current User (You)</h2>
      <PlayerInfo
        playerId="player-3"
        name="You"
        score={50}
        isCurrentPlayer={true}
      />
    </Container>
  ),

  hostPlayer: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Host Player</h2>
      <PlayerInfo
        playerId="player-host"
        name="GameMaster"
        score={100}
        isHost={true}
      />
    </Container>
  ),

  allStates: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">All States Combined</h2>
      <PlayerInfo
        playerId="player-super"
        name="SuperPlayer"
        score={999}
        isActive={true}
        isCurrentPlayer={true}
        isHost={true}
      />
    </Container>
  ),

  withMetadata: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">With Extra Metadata</h2>
      <PlayerInfo
        playerId="player-pro"
        name="ProGamer"
        score={75}
        metadata={{ tricksWon: 3, cardsLeft: 8 }}
      />
    </Container>
  ),

  multiplePlayersHorizontal: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Multiple Players (Horizontal)
      </h2>
      <div className="flex gap-4 flex-wrap">
        <PlayerInfo
          playerId="p1"
          name="Alice"
          score={42}
          isHost={true}
          orientation="horizontal"
        />
        <PlayerInfo
          playerId="p2"
          name="Bob"
          score={35}
          isActive={true}
          orientation="horizontal"
        />
        <PlayerInfo
          playerId="p3"
          name="Charlie"
          score={28}
          isCurrentPlayer={true}
          orientation="horizontal"
        />
        <PlayerInfo
          playerId="p4"
          name="Diana"
          score={15}
          orientation="horizontal"
        />
      </div>
    </Container>
  ),

  verticalOrientation: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Vertical Orientation
      </h2>
      <div className="flex gap-6">
        <PlayerInfo
          playerId="v1"
          name="Player 1"
          score={100}
          orientation="vertical"
          isActive={true}
        />
        <PlayerInfo
          playerId="v2"
          name="Player 2"
          score={85}
          orientation="vertical"
        />
        <PlayerInfo
          playerId="v3"
          name="Player 3"
          score={70}
          orientation="vertical"
          isCurrentPlayer={true}
        />
      </div>
    </Container>
  ),

  withCustomColor: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Custom Avatar Colors
      </h2>
      <div className="flex gap-4 flex-wrap">
        <PlayerInfo playerId="c1" name="Red Team" color="#ef4444" score={10} />
        <PlayerInfo playerId="c2" name="Blue Team" color="#3b82f6" score={15} />
        <PlayerInfo
          playerId="c3"
          name="Green Team"
          color="#22c55e"
          score={20}
        />
        <PlayerInfo
          playerId="c4"
          name="Purple Team"
          color="#a855f7"
          score={25}
        />
      </div>
    </Container>
  ),

  sizes: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Size Variants</h2>
      <div className="space-y-4">
        <PlayerInfo playerId="sm" name="Small Size" size="sm" score={10} />
        <PlayerInfo
          playerId="md"
          name="Medium Size (Default)"
          size="md"
          score={20}
        />
        <PlayerInfo playerId="lg" name="Large Size" size="lg" score={30} />
      </div>
    </Container>
  ),
};
