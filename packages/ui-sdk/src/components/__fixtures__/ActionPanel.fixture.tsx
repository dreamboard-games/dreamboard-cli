/**
 * ActionPanel and ActionGroup component fixtures
 * Demonstrates composable action UI patterns
 */
import React from "react";
import {
  Building,
  Route,
  Coins,
  TreePine,
  Gem,
  Sword,
  Shield,
  Flag,
} from "lucide-react";
import { ActionPanel, ActionGroup } from "../ActionPanel.js";
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

export default {
  default: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Default Panel</h2>
      <ActionPanel title="Your Actions">
        <ActionGroup title="Build">
          <ActionButton
            label="Build Road"
            icon={Route}
            onClick={() => console.log("Build road")}
          />
          <ActionButton
            label="Build Settlement"
            icon={Building}
            onClick={() => console.log("Build settlement")}
          />
        </ActionGroup>
      </ActionPanel>
    </Container>
  ),

  withStateDisplay: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">With Phase Display</h2>
      <ActionPanel
        title="Your Turn"
        state="playerActions"
        stateLabels={{
          playerActions: "Take Your Actions",
          rollDice: "Roll Dice",
          endTurn: "End Turn",
        }}
      >
        <ActionGroup title="Build">
          <ActionButton
            label="Build Road"
            icon={Route}
            cost={{ gold: 1, wood: 1 }}
            currentResources={playerResources}
            resourceDefs={resourceDefs}
            onClick={() => {}}
          />
          <ActionButton
            label="Build Settlement"
            icon={Building}
            cost={{ gold: 2, wood: 2 }}
            currentResources={playerResources}
            resourceDefs={resourceDefs}
            onClick={() => {}}
          />
        </ActionGroup>
      </ActionPanel>
    </Container>
  ),

  multipleGroups: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Multiple Groups</h2>
      <ActionPanel title="Game Actions" state="combatPhase">
        <ActionGroup title="Attack" variant="danger">
          <ActionButton
            label="Melee Attack"
            icon={Sword}
            variant="danger"
            onClick={() => {}}
          />
          <ActionButton
            label="Ranged Attack"
            icon={Sword}
            variant="danger"
            onClick={() => {}}
          />
        </ActionGroup>
        <ActionGroup title="Defend" variant="success">
          <ActionButton
            label="Block"
            icon={Shield}
            variant="secondary"
            onClick={() => {}}
          />
          <ActionButton
            label="Dodge"
            icon={Shield}
            variant="secondary"
            onClick={() => {}}
          />
        </ActionGroup>
        <ActionGroup title="End Turn">
          <ActionButton
            label="End Turn"
            icon={Flag}
            variant="success"
            onClick={() => {}}
          />
        </ActionGroup>
      </ActionPanel>
    </Container>
  ),

  groupVariants: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Group Variants</h2>
      <ActionPanel title="Actions" collapsible={false}>
        <ActionGroup title="Default Group" variant="default">
          <ActionButton label="Default Action" onClick={() => {}} />
        </ActionGroup>
        <ActionGroup
          title="Warning Group"
          variant="warning"
          description="Caution required"
        >
          <ActionButton
            label="Warning Action"
            variant="secondary"
            onClick={() => {}}
          />
        </ActionGroup>
        <ActionGroup
          title="Danger Group"
          variant="danger"
          description="This cannot be undone"
        >
          <ActionButton
            label="Danger Action"
            variant="danger"
            onClick={() => {}}
          />
        </ActionGroup>
        <ActionGroup
          title="Success Group"
          variant="success"
          description="Good choice!"
        >
          <ActionButton
            label="Success Action"
            variant="success"
            onClick={() => {}}
          />
        </ActionGroup>
      </ActionPanel>
    </Container>
  ),

  conditionalVisibility: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Conditional Visibility
      </h2>
      <p className="text-slate-400 text-sm mb-4">
        Some groups are hidden based on game state
      </p>
      <ActionPanel title="Actions" state="buildPhase">
        <ActionGroup title="Build Actions" visible={true}>
          <ActionButton label="Build Road" icon={Route} onClick={() => {}} />
          <ActionButton
            label="Build Settlement"
            icon={Building}
            onClick={() => {}}
          />
        </ActionGroup>
        <ActionGroup title="Combat Actions" visible={false}>
          <ActionButton label="Attack" icon={Sword} onClick={() => {}} />
        </ActionGroup>
        <ActionGroup title="Trade Actions" visible={true}>
          <ActionButton
            label="Trade with Bank"
            icon={Coins}
            onClick={() => {}}
          />
        </ActionGroup>
      </ActionPanel>
    </Container>
  ),

  collapsedByDefault: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">
        Collapsed by Default
      </h2>
      <ActionPanel title="Click to Expand" defaultExpanded={false}>
        <ActionGroup title="Hidden Actions">
          <ActionButton label="Secret Action 1" onClick={() => {}} />
          <ActionButton label="Secret Action 2" onClick={() => {}} />
        </ActionGroup>
      </ActionPanel>
    </Container>
  ),

  nonCollapsible: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Non-Collapsible</h2>
      <ActionPanel title="Always Visible" collapsible={false}>
        <ActionGroup title="Required Actions">
          <ActionButton
            label="Must Do This"
            variant="primary"
            onClick={() => {}}
          />
        </ActionGroup>
      </ActionPanel>
    </Container>
  ),

  fullGameExample: (
    <Container>
      <h2 className="text-xl font-bold text-white mb-4">Full Game Example</h2>
      <p className="text-slate-400 text-sm mb-4">
        Player has: 5 gold, 3 wood, 1 gem
      </p>
      <ActionPanel
        title="Your Turn"
        state="playerActions"
        stateLabels={{ playerActions: "Take Actions" }}
      >
        <ActionGroup title="Build" description="Construct buildings and roads">
          <ActionButton
            label="Build Road"
            description="Connect settlements"
            icon={Route}
            cost={{ gold: 1, wood: 1 }}
            currentResources={playerResources}
            resourceDefs={resourceDefs}
            onClick={() => {}}
          />
          <ActionButton
            label="Build Settlement"
            description="New territory"
            icon={Building}
            cost={{ gold: 2, wood: 2 }}
            currentResources={playerResources}
            resourceDefs={resourceDefs}
            onClick={() => {}}
          />
          <ActionButton
            label="Build City"
            description="Upgrade settlement"
            icon={Building}
            cost={{ gold: 3, gems: 3 }}
            currentResources={playerResources}
            resourceDefs={resourceDefs}
            onClick={() => {}}
          />
        </ActionGroup>
        <ActionGroup title="Trade">
          <ActionButton
            label="Trade with Bank"
            description="4:1 exchange rate"
            icon={Coins}
            onClick={() => {}}
          />
        </ActionGroup>
        <ActionGroup title="End Turn">
          <ActionButton
            label="End Turn"
            icon={Flag}
            variant="success"
            onClick={() => {}}
          />
        </ActionGroup>
      </ActionPanel>
    </Container>
  ),
};
