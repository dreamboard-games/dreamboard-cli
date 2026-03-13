/**
 * CostDisplay component fixtures
 * Demonstrates cost display with affordability indication
 */
import React from "react";
import { Coins, TreePine, Gem, Mountain, Zap, Droplet } from "lucide-react";
import { CostDisplay, type ResourceDefinition } from "../CostDisplay.js";

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-8">
      <div className="max-w-md mx-auto space-y-6">{children}</div>
    </div>
  );
}

const fantasyDefs: ResourceDefinition[] = [
  { type: "gold", label: "Gold", icon: Coins, color: "text-yellow-400" },
  { type: "wood", label: "Wood", icon: TreePine, color: "text-amber-600" },
  { type: "gems", label: "Gems", icon: Gem, color: "text-purple-400" },
];

const scifiDefs: ResourceDefinition[] = [
  {
    type: "minerals",
    label: "Minerals",
    icon: Mountain,
    color: "text-amber-600",
  },
  { type: "energy", label: "Energy", icon: Zap, color: "text-blue-400" },
  { type: "water", label: "Water", icon: Droplet, color: "text-cyan-400" },
];

export default {
  default: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Default (No Affordability Check)
      </h2>
      <div className="bg-slate-800 p-4 rounded-lg">
        <CostDisplay cost={{ gold: 3, wood: 2 }} resourceDefs={fantasyDefs} />
      </div>
    </Container>
  ),

  canAfford: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Can Afford (All Green)
      </h2>
      <p className="text-slate-400 text-sm mb-4">Player has: 5 gold, 3 wood</p>
      <div className="bg-slate-800 p-4 rounded-lg">
        <CostDisplay
          cost={{ gold: 3, wood: 2 }}
          currentResources={{ gold: 5, wood: 3 }}
          resourceDefs={fantasyDefs}
        />
      </div>
    </Container>
  ),

  cannotAfford: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Cannot Afford (Mixed)
      </h2>
      <p className="text-slate-400 text-sm mb-4">Player has: 5 gold, 1 wood</p>
      <div className="bg-slate-800 p-4 rounded-lg">
        <CostDisplay
          cost={{ gold: 3, wood: 2 }}
          currentResources={{ gold: 5, wood: 1 }}
          resourceDefs={fantasyDefs}
        />
      </div>
    </Container>
  ),

  completelyUnaffordable: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Completely Unaffordable (All Red)
      </h2>
      <p className="text-slate-400 text-sm mb-4">Player has: 1 gold, 0 wood</p>
      <div className="bg-slate-800 p-4 rounded-lg">
        <CostDisplay
          cost={{ gold: 3, wood: 2 }}
          currentResources={{ gold: 1, wood: 0 }}
          resourceDefs={fantasyDefs}
        />
      </div>
    </Container>
  ),

  stackedLayout: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Stacked Layout</h2>
      <div className="bg-slate-800 p-4 rounded-lg">
        <CostDisplay
          cost={{ minerals: 2, energy: 1, water: 3 }}
          currentResources={{ minerals: 3, energy: 0, water: 5 }}
          resourceDefs={scifiDefs}
          layout="stacked"
        />
      </div>
    </Container>
  ),

  sizes: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Size Variants</h2>
      <div className="space-y-4">
        <div className="bg-slate-800 p-4 rounded-lg">
          <p className="text-slate-400 text-xs mb-2">Small</p>
          <CostDisplay
            cost={{ gold: 3, wood: 2, gems: 1 }}
            resourceDefs={fantasyDefs}
            size="sm"
          />
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <p className="text-slate-400 text-xs mb-2">Medium</p>
          <CostDisplay
            cost={{ gold: 3, wood: 2, gems: 1 }}
            resourceDefs={fantasyDefs}
            size="md"
          />
        </div>
      </div>
    </Container>
  ),

  inContext: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">In Button Context</h2>
      <div className="space-y-2">
        {/* Simulated action button with cost */}
        <div className="bg-blue-600 p-3 rounded-lg flex items-center justify-between">
          <span className="font-semibold text-white">Build Settlement</span>
          <CostDisplay
            cost={{ gold: 2, wood: 2 }}
            currentResources={{ gold: 5, wood: 5 }}
            resourceDefs={fantasyDefs}
          />
        </div>
        <div className="bg-slate-700 p-3 rounded-lg flex items-center justify-between opacity-60">
          <span className="font-semibold text-white">Build Castle</span>
          <CostDisplay
            cost={{ gold: 10, gems: 5 }}
            currentResources={{ gold: 3, gems: 1 }}
            resourceDefs={fantasyDefs}
          />
        </div>
      </div>
    </Container>
  ),
};
