/**
 * GameEndDisplay component fixtures
 * Demonstrates end-of-game screens with various configurations
 */
import React, { useState } from "react";
import { GameEndDisplay, type PlayerScore } from "../GameEndDisplay.js";

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900">
      {children}
    </div>
  );
}

const sampleScores: PlayerScore[] = [
  { playerId: "p1", name: "Alice", score: 100, isWinner: true },
  { playerId: "p2", name: "Bob", score: 85 },
  { playerId: "p3", name: "Charlie", score: 72 },
  { playerId: "p4", name: "Diana", score: 65 },
];

const scoresWithDetails: PlayerScore[] = [
  {
    playerId: "p1",
    name: "Alice",
    score: 100,
    isWinner: true,
    details: {
      settlements: 20,
      cities: 30,
      longestRoad: 10,
      developmentCards: 15,
      largestArmy: 25,
    },
  },
  { playerId: "p2", name: "Bob", score: 85 },
  { playerId: "p3", name: "Charlie", score: 72 },
];

const twoPlayerScores: PlayerScore[] = [
  { playerId: "p1", name: "Player 1", score: 50, isWinner: true },
  { playerId: "p2", name: "Player 2", score: 45 },
];

// Interactive demo
function InteractiveDemo() {
  const [showEnd, setShowEnd] = useState(false);

  return (
    <Container>
      <div className="flex items-center justify-center min-h-screen">
        {!showEnd ? (
          <button
            onClick={() => setShowEnd(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
          >
            End Game
          </button>
        ) : null}
        <GameEndDisplay
          isGameOver={showEnd}
          scores={sampleScores}
          winnerMessage="Achieved 100 victory points!"
          onReturnToLobby={() => setShowEnd(false)}
        />
      </div>
    </Container>
  );
}

export default {
  default: (
    <Container>
      <GameEndDisplay
        isGameOver={true}
        scores={sampleScores}
        onReturnToLobby={() => console.log("Return to lobby")}
      />
    </Container>
  ),

  withMessage: (
    <Container>
      <GameEndDisplay
        isGameOver={true}
        scores={sampleScores}
        winnerMessage="First to reach 100 victory points!"
        onReturnToLobby={() => console.log("Return to lobby")}
      />
    </Container>
  ),

  withScoreDetails: (
    <Container>
      <GameEndDisplay
        isGameOver={true}
        scores={scoresWithDetails}
        winnerMessage="Dominated with settlements and armies!"
        showDetails={true}
        onReturnToLobby={() => console.log("Return to lobby")}
      />
    </Container>
  ),

  twoPlayers: (
    <Container>
      <GameEndDisplay
        isGameOver={true}
        scores={twoPlayerScores}
        winnerMessage="A close game!"
        onReturnToLobby={() => console.log("Return to lobby")}
      />
    </Container>
  ),

  noActions: (
    <Container>
      <GameEndDisplay
        isGameOver={true}
        scores={sampleScores}
        winnerMessage="Game Over!"
      />
    </Container>
  ),

  notOver: (
    <Container>
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-slate-800 p-8 rounded-lg text-center">
          <p className="text-white">
            Game is not over - GameEndDisplay returns null
          </p>
          <p className="text-slate-400 text-sm mt-2">
            The component below is invisible when isGameOver=false
          </p>
        </div>
      </div>
      <GameEndDisplay isGameOver={false} scores={sampleScores} />
    </Container>
  ),

  interactive: <InteractiveDemo />,

  closeGame: (
    <Container>
      <GameEndDisplay
        isGameOver={true}
        scores={[
          { playerId: "p1", name: "Winner", score: 10, isWinner: true },
          { playerId: "p2", name: "Second", score: 9 },
          { playerId: "p3", name: "Third", score: 9 },
        ]}
        winnerMessage="Won by just 1 point! 🎉"
        onReturnToLobby={() => console.log("Back to lobby")}
      />
    </Container>
  ),

  catanStyle: (
    <Container>
      <GameEndDisplay
        isGameOver={true}
        scores={[
          {
            playerId: "p1",
            name: "Space Pioneer",
            score: 10,
            isWinner: true,
            details: {
              outposts: 2,
              spaceStations: 2,
              longestRoute: 2,
              largestFleet: 2,
              developmentCards: 2,
            },
          },
          { playerId: "p2", name: "Star Explorer", score: 8 },
          { playerId: "p3", name: "Asteroid Miner", score: 7 },
          { playerId: "p4", name: "Nebula Trader", score: 5 },
        ]}
        winnerMessage="Colonized the galaxy with 10 victory points!"
        showDetails={true}
        onReturnToLobby={() => console.log("Return to starbase")}
      />
    </Container>
  ),
};
