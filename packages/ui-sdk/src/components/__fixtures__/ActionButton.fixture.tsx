/**
 * ActionButton component fixtures
 * Demonstrates action buttons with various states and configurations
 */
import React, { useState } from "react";
import {
  Building,
  Route,
  Pickaxe,
  Sword,
  Shield,
  Coins,
  TreePine,
  Gem,
} from "lucide-react";
import { ActionButton } from "../ActionButton.js";
import type { ResourceDefinition } from "../CostDisplay.js";

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-8">
      <div className="max-w-md mx-auto space-y-6">{children}</div>
    </div>
  );
}

const resourceDefs: ResourceDefinition[] = [
  { type: "gold", label: "Gold", icon: Coins, color: "text-yellow-400" },
  { type: "wood", label: "Wood", icon: TreePine, color: "text-amber-600" },
  { type: "gems", label: "Gems", icon: Gem, color: "text-purple-400" },
];

const playerResources = { gold: 5, wood: 3, gems: 1 };

// Loading demo
function LoadingDemo() {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Loading State</h2>
      <ActionButton
        label="Submit Action"
        icon={Sword}
        onClick={handleClick}
        loading={loading}
      />
      <p className="text-slate-400 text-sm mt-2">Click to see loading state</p>
    </Container>
  );
}

export default {
  default: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Default (Primary)</h2>
      <ActionButton
        label="Build Settlement"
        icon={Building}
        onClick={() => console.log("Clicked!")}
      />
    </Container>
  ),

  withDescription: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">With Description</h2>
      <ActionButton
        label="Build Road"
        description="Connect two settlements"
        icon={Route}
        onClick={() => console.log("Build road")}
      />
    </Container>
  ),

  withCost: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        With Cost (Affordable)
      </h2>
      <p className="text-slate-400 text-sm mb-4">
        Player has: 5 gold, 3 wood, 1 gem
      </p>
      <ActionButton
        label="Build Settlement"
        icon={Building}
        cost={{ gold: 2, wood: 2 }}
        currentResources={playerResources}
        resourceDefs={resourceDefs}
        onClick={() => console.log("Build!")}
      />
    </Container>
  ),

  cannotAfford: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Cannot Afford</h2>
      <p className="text-slate-400 text-sm mb-4">
        Player has: 5 gold, 3 wood, 1 gem
      </p>
      <ActionButton
        label="Build Castle"
        description="Requires 10 gold and 5 gems"
        icon={Building}
        cost={{ gold: 10, gems: 5 }}
        currentResources={playerResources}
        resourceDefs={resourceDefs}
        onClick={() => console.log("Cannot afford!")}
      />
    </Container>
  ),

  disabled: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Disabled with Reason
      </h2>
      <ActionButton
        label="Attack Enemy"
        icon={Sword}
        available={false}
        disabledReason="No enemies in range"
        onClick={() => console.log("Attack!")}
      />
    </Container>
  ),

  variants: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Variants</h2>
      <div className="space-y-3">
        <ActionButton
          label="Primary Action"
          icon={Pickaxe}
          variant="primary"
          onClick={() => {}}
        />
        <ActionButton
          label="Secondary Action"
          icon={Shield}
          variant="secondary"
          onClick={() => {}}
        />
        <ActionButton
          label="Danger Action"
          icon={Sword}
          variant="danger"
          onClick={() => {}}
        />
        <ActionButton
          label="Success Action"
          icon={Building}
          variant="success"
          onClick={() => {}}
        />
      </div>
    </Container>
  ),

  sizes: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Sizes</h2>
      <div className="space-y-3">
        <ActionButton
          label="Small Button"
          icon={Building}
          size="sm"
          onClick={() => {}}
        />
        <ActionButton
          label="Medium Button (Default)"
          icon={Building}
          size="md"
          onClick={() => {}}
        />
        <ActionButton
          label="Large Button"
          description="With a description"
          icon={Building}
          size="lg"
          onClick={() => {}}
        />
      </div>
    </Container>
  ),

  loading: <LoadingDemo />,

  gameActions: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Game Actions Example
      </h2>
      <p className="text-slate-400 text-sm mb-4">
        Player has: 5 gold, 3 wood, 1 gem
      </p>
      <div className="space-y-2">
        <ActionButton
          label="Build Road"
          description="1 gold, 1 wood"
          icon={Route}
          cost={{ gold: 1, wood: 1 }}
          currentResources={playerResources}
          resourceDefs={resourceDefs}
          onClick={() => {}}
        />
        <ActionButton
          label="Build Settlement"
          description="2 gold, 2 wood"
          icon={Building}
          cost={{ gold: 2, wood: 2 }}
          currentResources={playerResources}
          resourceDefs={resourceDefs}
          onClick={() => {}}
        />
        <ActionButton
          label="Build City"
          description="3 gold, 3 gems (cannot afford)"
          icon={Building}
          cost={{ gold: 3, gems: 3 }}
          currentResources={playerResources}
          resourceDefs={resourceDefs}
          onClick={() => {}}
        />
      </div>
    </Container>
  ),
};
