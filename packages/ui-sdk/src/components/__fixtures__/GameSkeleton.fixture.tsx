/**
 * GameSkeleton component fixtures
 * Demonstrates various loading state variants
 */
import React from "react";
import { GameSkeleton } from "../GameSkeleton.js";

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900">
      {children}
    </div>
  );
}

export default {
  default: (
    <Container>
      <GameSkeleton />
    </Container>
  ),

  withMessage: (
    <Container>
      <GameSkeleton message="Loading game state..." />
    </Container>
  ),

  cardsVariant: (
    <Container>
      <GameSkeleton variant="cards" message="Shuffling deck..." />
    </Container>
  ),

  playersVariant: (
    <Container>
      <GameSkeleton variant="players" message="Waiting for players..." />
    </Container>
  ),

  minimalVariant: (
    <Container>
      <GameSkeleton variant="minimal" message="Connecting..." />
    </Container>
  ),
};
