/**
 * ResourceCounter component fixtures
 * Demonstrates resource display in various configurations
 */
import React, { useState } from "react";
import {
  Coins,
  TreePine,
  Gem,
  Zap,
  Droplet,
  Mountain,
  Cpu,
  Leaf,
} from "lucide-react";
import {
  ResourceCounter,
  type ResourceDisplayConfig,
} from "../ResourceCounter.js";

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto space-y-6">{children}</div>
    </div>
  );
}

// Fantasy game resources
const fantasyResources: ResourceDisplayConfig[] = [
  {
    type: "gold",
    label: "Gold",
    icon: Coins,
    iconColor: "text-yellow-400",
    bgColor: "bg-yellow-900/30",
  },
  {
    type: "wood",
    label: "Wood",
    icon: TreePine,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-900/30",
  },
  {
    type: "gems",
    label: "Gems",
    icon: Gem,
    iconColor: "text-purple-400",
    bgColor: "bg-purple-900/30",
  },
];

// Sci-fi game resources (Catan-style)
const scifiResources: ResourceDisplayConfig[] = [
  {
    type: "minerals",
    label: "Minerals",
    icon: Mountain,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-900/30",
  },
  {
    type: "energy",
    label: "Energy",
    icon: Zap,
    iconColor: "text-blue-400",
    bgColor: "bg-blue-900/30",
  },
  {
    type: "water",
    label: "Water",
    icon: Droplet,
    iconColor: "text-cyan-400",
    bgColor: "bg-cyan-900/30",
  },
  {
    type: "tech",
    label: "Tech Parts",
    icon: Cpu,
    iconColor: "text-purple-400",
    bgColor: "bg-purple-900/30",
  },
  {
    type: "bio",
    label: "Bio-matter",
    icon: Leaf,
    iconColor: "text-green-400",
    bgColor: "bg-green-900/30",
  },
];

// Interactive demo
function InteractiveDemo() {
  const [counts, setCounts] = useState<Record<string, number>>({
    gold: 5,
    wood: 3,
    gems: 1,
  });

  const handleClick = (type: string) => {
    setCounts((prev) => ({
      ...prev,
      [type]: (prev[type] ?? 0) + 1,
    }));
  };

  return (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Interactive (Click to Add)
      </h2>
      <ResourceCounter
        resources={fantasyResources}
        counts={counts}
        onResourceClick={handleClick}
        size="lg"
      />
      <p className="text-slate-400 text-sm mt-4">
        Click any resource to add +1
      </p>
    </Container>
  );
}

export default {
  default: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Default (Row Layout)
      </h2>
      <ResourceCounter
        resources={fantasyResources}
        counts={{ gold: 5, wood: 3, gems: 1 }}
      />
    </Container>
  ),

  gridLayout: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Grid Layout (5 Resources)
      </h2>
      <ResourceCounter
        resources={scifiResources}
        counts={{ minerals: 4, energy: 2, water: 3, tech: 1, bio: 5 }}
        layout="grid"
        columns={5}
      />
    </Container>
  ),

  compactLayout: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Compact Layout</h2>
      <ResourceCounter
        resources={fantasyResources}
        counts={{ gold: 10, wood: 5, gems: 2 }}
        layout="compact"
        size="sm"
      />
    </Container>
  ),

  sizes: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Size Variants</h2>
      <div className="space-y-6">
        <div>
          <p className="text-slate-400 text-sm mb-2">Small</p>
          <ResourceCounter
            resources={fantasyResources}
            counts={{ gold: 5, wood: 3, gems: 1 }}
            size="sm"
          />
        </div>
        <div>
          <p className="text-slate-400 text-sm mb-2">Medium (Default)</p>
          <ResourceCounter
            resources={fantasyResources}
            counts={{ gold: 5, wood: 3, gems: 1 }}
            size="md"
          />
        </div>
        <div>
          <p className="text-slate-400 text-sm mb-2">Large</p>
          <ResourceCounter
            resources={fantasyResources}
            counts={{ gold: 5, wood: 3, gems: 1 }}
            size="lg"
          />
        </div>
      </div>
    </Container>
  ),

  hideZeroValues: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Hide Zero Values</h2>
      <p className="text-slate-400 text-sm mb-4">
        Only showing resources with count {">"} 0
      </p>
      <ResourceCounter
        resources={scifiResources}
        counts={{ minerals: 4, energy: 0, water: 3, tech: 0, bio: 5 }}
        showZero={false}
      />
    </Container>
  ),

  interactive: <InteractiveDemo />,

  sciFiTheme: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Sci-Fi Resources (Catan Style)
      </h2>
      <ResourceCounter
        resources={scifiResources}
        counts={{ minerals: 3, energy: 2, water: 1, tech: 4, bio: 2 }}
        layout="grid"
        columns={5}
        size="md"
      />
    </Container>
  ),
};
