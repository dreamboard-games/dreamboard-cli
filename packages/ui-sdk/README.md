# @dreamboard/ui-sdk

UI SDK for building Dreamboard game plugins with React.

## Overview

The `@dreamboard/ui-sdk` provides React hooks, types, and utilities for building game UI plugins that run in sandboxed iframes. Plugins communicate with the main application via postMessage and can access game state, submit actions, and respond to game events.

## Installation

This package is bundled automatically when compiling UI plugins via the compiler service. No manual installation is required.

## Core Concepts

### Runtime Context

All hooks require the `RuntimeContext` provider, which is automatically set up when your plugin is loaded in the iframe.

### Communication Flow

1. Plugin receives initialization message from parent window
2. Plugin connects to game session via RuntimeAPI
3. Plugin receives game state updates via SSE (Server-Sent Events)
4. Plugin submits actions to the backend
5. Plugin receives action results and state updates

## Available Hooks

### `useGameState()`

Returns the current game state.

```tsx
import { useGameState } from "@dreamboard/ui-sdk";

function MyComponent() {
  const gameState = useGameState();

  if (!gameState) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Turn: {gameState.currentTurn}</h1>
      <p>Components: {gameState.components.length}</p>
    </div>
  );
}
```

**Returns:** `SimpleGameState | null`

### `useGameSelector(selector)`

Select a specific part of the game state with a selector function. Optimized for performance.

```tsx
import { useGameSelector } from "@dreamboard/ui-sdk";

function PlayerHand() {
  const playerHand = useGameSelector(
    (state) =>
      state?.components.filter(
        (c) =>
          c.location.type === "InHand" &&
          c.location.playerId === state.currentPlayerId,
      ) || [],
  );

  return (
    <div>
      {playerHand.map((card) => (
        <Card key={card.id} data={card} />
      ))}
    </div>
  );
}
```

**Parameters:**

- `selector`: `(state: SimpleGameState | null) => T` - Function to select data from state

**Returns:** `T` - Selected data

### `useAction()`

Submit actions to the game engine.

```tsx
import { useAction } from "@dreamboard/ui-sdk";

function ActionButton() {
  const { submitAction, isSubmitting } = useAction();

  const handlePlayCard = async () => {
    try {
      await submitAction("playCard", { cardId: "card-123" });
      console.log("Action submitted successfully");
    } catch (error) {
      console.error("Action failed:", error);
    }
  };

  return (
    <button onClick={handlePlayCard} disabled={isSubmitting}>
      {isSubmitting ? "Submitting..." : "Play Card"}
    </button>
  );
}
```

**Returns:**

- `submitAction`: `(actionType: string, params: Record<string, unknown>) => Promise<void>`
- `isSubmitting`: `boolean` - Whether an action is currently being submitted

### `useLobby()`

Access lobby state and player information.

```tsx
import { useLobby } from "@dreamboard/ui-sdk";

function LobbyInfo() {
  const { players, isHost, status } = useLobby();

  return (
    <div>
      <h2>Lobby Status: {status}</h2>
      <ul>
        {players.map((player) => (
          <li key={player.id}>
            {player.name} {player.isReady ? "✓" : "○"}
          </li>
        ))}
      </ul>
      {isHost && <button>Start Game</button>}
    </div>
  );
}
```

**Returns:** `LobbyState`

- `players`: Array of player information
- `isHost`: Whether current player is the host
- `status`: Current lobby/game status

### `useMessages()`

Access all received game messages.

```tsx
import { useMessages } from "@dreamboard/ui-sdk";

function MessageLog() {
  const messages = useMessages();

  return (
    <div>
      <h3>Recent Messages</h3>
      {messages.slice(-5).map((msg, idx) => (
        <div key={idx}>
          <strong>{msg.type}</strong>: {JSON.stringify(msg)}
        </div>
      ))}
    </div>
  );
}
```

**Returns:** `GameMessage[]` - Array of all received game messages

## TypeScript Types

### Game State Types

```typescript
import type {
  SimpleGameState,
  SimpleLocation,
  InHandLocation,
  InZoneLocation,
  InDeckLocation,
} from "@dreamboard/ui-sdk";

// Game state structure
interface SimpleGameState {
  currentPlayerId: string;
  currentTurn: number;
  components: GameComponent[];
  zones: Record<string, Zone>;
  variables: Record<string, unknown>;
}

// Component locations
type SimpleLocation =
  | InHandLocation
  | InZoneLocation
  | InDeckLocation
  | DetachedLocation;
```

### Message Types

```typescript
import type {
  GameMessage,
  StateUpdateMessage,
  YourTurnMessage,
  ActionExecutedMessage,
  ActionRejectedMessage,
  GameEndedMessage,
} from "@dreamboard/ui-sdk";

// All game messages
type GameMessage =
  | StateUpdateMessage
  | YourTurnMessage
  | ActionExecutedMessage
  | ActionRejectedMessage
  | TurnChangedMessage
  | GameEndedMessage
  | LobbyUpdateMessage;
```

## Complete Example

See `/apps/backend/src/main/resources/example-react-plugin/` for a complete multi-file example with:

- Main app component (`index.tsx`)
- Game board component (`components/GameBoard.tsx`)
- Reusable button component (`components/ActionButton.tsx`)
- Framer Motion animations
- Full TypeScript types

## Compilation

To compile your React plugin:

```bash
POST /compile-ui-bundle
Content-Type: application/json

{
  "files": [
    {
      "path": "index.tsx",
      "content": "import React from 'react';\n..."
    },
    {
      "path": "components/MyComponent.tsx",
      "content": "export function MyComponent() { ... }"
    }
  ],
  "entryPoint": "index.tsx"
}
```

The compiler will bundle all files with React, framer-motion, and @dreamboard/ui-sdk into a single HTML file.

## Best Practices

1. **Error Handling**: Always wrap `submitAction` calls in try-catch
2. **Loading States**: Check for `null` game state before rendering
3. **Optimized Selectors**: Use `useGameSelector` for derived data
4. **Component Splitting**: Split complex UIs into multiple files
5. **TypeScript**: Use provided types for type safety
6. **Animations**: Use framer-motion for smooth transitions

## Limitations

- No external network calls (CSP restricted)
- Maximum bundle size: 5MB
- Maximum 50 source files
- No eval() or Function() constructor
- Sandbox: `allow-scripts` only (no same-origin, no forms)

## Support

For issues or questions, refer to the main Dreamboard documentation or contact the development team.
