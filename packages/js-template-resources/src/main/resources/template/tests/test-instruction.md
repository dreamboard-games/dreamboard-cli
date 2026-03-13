# GameLogic Methods Testing Guidelines

## Running Tests

To run the tests for this game logic, use:

```bash
pnpm test
```

This command will execute all test files and provide detailed output about test results, including any failures or errors.

## Important: Game Rules as Source of Truth

When updating failed tests, always consider the game rules as the source of truth. Do not modify tests just to make them pass. Instead:

1. **Verify the test logic**: Ensure the test correctly represents the game rules
2. **Check the implementation**: Consider whether the game logic implementation is correct according to the rules
3. **Fix the root cause**: If the implementation is wrong, fix the game logic code, not the test
4. **Update tests only when**: The test itself was incorrectly written or the game rules have legitimately changed

Remember: Tests should fail when the implementation doesn't match the game rules. A passing test that doesn't enforce the correct game behavior is worse than a failing test that catches rule violations.

## Testing Best Practices

**Unused Variables**: Prefix any unused variables with an underscore (\_) to indicate they are intentionally unused and avoid linting warnings.

## Required GameLogic Methods Testing

### 1. initializeGame

**Core Functionality Tests:**

- Initialize game with valid player counts (min, max, optimal)
- Reject invalid player counts (too low, too high)
- Proper deck shuffling and card dealing
- Set correct starting conditions based on game rules
- Initialize global game variables (game phase, scores, etc.)
- Set up player-specific state (hands, scores, resources)
- Configure game board, zones, and card holders
- Handle API failures gracefully

**Game-Specific Tests:**

- Deal appropriate number of cards per player based on game rules
- Initialize game-specific variables and state
- Set up special starting conditions (e.g., first player determination)

### 2. determineStartingPlayer

**Core Functionality Tests:**

- Return correct starting player based on game rules
- Handle different starting player determination methods
- Update global state with starting player information
- Return proper DetermineNextPlayerResult structure
- Handle edge cases gracefully

**Game-Specific Tests:**

- Implement game-specific starting player logic (e.g., youngest player, card holder, etc.)
- Handle scenarios where starting player cannot be determined

### 3. executeAction

**Core Functionality Tests:**

- Execute valid primary actions (e.g., PLAY_CARDS, MOVE_PIECE)
- Execute valid secondary actions (e.g., PASS, DRAW_CARD)
- Reject actions from non-current player
- Reject unknown/invalid action types
- Handle actions with different parameter combinations
- Process actions that affect multiple players
- Handle actions that change game phase
- Validate action parameters before execution
- Return proper TurnActionResult with IntraTurnDecision

**Game-Specific Action Tests:**

- Card playing actions (validate combinations, ownership)
- Resource management actions (spend/gain resources)
- Movement actions (validate positions, obstacles)
- Special ability actions (cooldowns, requirements)

### 4. getAvailableActions

**Core Functionality Tests:**

- Return empty array for non-current player
- Return available actions for current player
- Different actions based on game phase
- Actions filtered by player resources/cards
- Actions filtered by game state conditions
- Conditional actions (only available under specific circumstances)
- Return proper GameActionDefinition objects with correct parameters

**Game-Specific Tests:**

- Card-based games: Actions based on hand contents
- Resource games: Actions based on available resources
- Position games: Actions based on current position
- Turn-based games: Actions based on turn state

### 5. checkWinCondition

**Core Functionality Tests:**

- Detect winner when win condition met
- Return null when no winner
- Calculate correct final scores
- Handle multiple win conditions
- Handle tie-breaking scenarios
- Different win conditions by player count
- Return proper WinResult structure

**Game-Specific Tests:**

- Implement game-specific win conditions (points, cards, objectives)
- Handle immediate win scenarios
- Calculate proper final scores based on game rules

### 6. validateAction

**Core Functionality Tests:**

- Validate legal primary actions
- Validate legal secondary actions
- Reject actions from wrong player
- Reject invalid action parameters
- Reject unknown action types
- Validate resource requirements
- Validate game state prerequisites
- Return proper ValidationResult structure

**Validation Categories:**

- Player turn validation
- Action type validation
- Parameter validation
- Resource requirement validation
- Game state condition validation
- Rule-specific validation

### 7. resolveNextPhase

**Core Functionality Tests:**

- Return correct PhaseDecision for different scenarios
- Handle StartPlayerTurn decisions with correct player
- Handle AdvanceToRoundPhase decisions
- Handle EndRoundAndStartNew decisions with correct starting player
- Process turn order correctly
- Skip inactive players appropriately

**Game-Specific Tests:**

- Implement game-specific phase progression logic
- Handle special turn order scenarios
- Manage round transitions based on game rules

### 8. shouldStartRoundPhase

**Core Functionality Tests:**

- Return boolean decision for phase start
- Handle conditional phase execution
- Consider game state when making decisions
- Process different round phase types

**Game-Specific Tests:**

- Implement game-specific phase conditions
- Handle optional phases based on game state

### 9. Optional Lifecycle Methods

#### onTurnStart

**Core Functionality Tests:**

- Execute successfully for all players
- Handle turn-start resource generation
- Handle turn-start card drawing
- Process turn-start status effects
- Initialize turn-specific variables
- Handle API failures gracefully

#### onTurnEnd

**Core Functionality Tests:**

- Execute successfully for all players
- Handle turn-end cleanup
- Process turn-end scoring
- Handle status effect expiration
- Reset temporary variables
- Handle API failures gracefully

#### onRoundStart/onRoundEnd

**Core Functionality Tests:**

- Execute round initialization/cleanup
- Handle round-specific state changes
- Process round scoring
- Manage round transitions
- Handle API failures gracefully

#### onRoundPhaseStart/onRoundPhaseEnd

**Core Functionality Tests:**

- Execute phase-specific logic
- Handle phase state changes
- Process phase transitions
- Handle automated phases correctly
- Handle API failures gracefully

#### onTurnStepStart/onTurnStepEnd

**Core Functionality Tests:**

- Execute step-specific logic
- Handle step state changes
- Process step transitions
- Handle API failures gracefully

#### onStepChange

**Core Functionality Tests:**

- Handle step transitions correctly
- Update step-specific state
- Process step change effects
- Handle API failures gracefully

## Mock API Setup Examples

When testing game logic methods that interact with APIs, use these patterns to mock API responses:

### Successful API Response

```typescript
mockTransactionApi.transaction.mockImplementation((fn) => {
  const mockApis = mockDeep<GameApis>();
  const _result = fn(mockApis);
  return {
    success: true,
    errorMessage: null,
    gameState: state,
    operationsExecuted: 1,
  };
});
```

### Failure API Response

```typescript
mockTransactionApi.transaction.mockImplementation((fn) => {
  const mockApis = mockDeep<GameApis>();
  const _result = fn(mockApis);
  return {
    success: false,
    errorMessage: "Database connection failed",
    gameState: state,
    operationsExecuted: 0,
  };
});
```

## GameStateBuilder Usage Guide for Test Fixtures

The GameStateBuilder and related builders provide a fluent API for creating test fixtures
with realistic game states. This eliminates boilerplate and makes tests more readable.

### Basic Usage:

```typescript
const gameState = GameStateBuilder().withPlayerCount(4).build();
```

### Advanced Examples:

1. **Creating a game with specific players and hands:**

```typescript
const gameState = GameStateBuilder()
  .withPlayers([
    PlayerBuilder()
      .withId("player1")
      .withName("Alice")
      .withHand([
        SuitAndRankCardBuilder().withSuit("Hearts").withRank("Ace").build(),
        SuitAndRankCardBuilder().withSuit("Spades").withRank("King").build(),
      ])
      .build(),
    PlayerBuilder().withId("player2").withName("Bob").withScore(150).build(),
  ])
  .withCurrentPlayer("player1")
  .build();
```

2. **Setting up a mid-game scenario:**

```typescript
const midGameState = GameStateBuilder()
  .withPlayerCount(3)
  .withCurrentPlayer("player1")
  .withRoundNumber(3)
  .withGlobalVariable({
    gamePhase: "playing",
    handNumber: 2,
    targetScore: 100,
    currentDealerIndex: 1,
    firstPlayerThisHand: "player-2",
  })
  .build();
```

3. **Creating specific deck configurations:**

```typescript
const gameWithCustomDeck = GameStateBuilder()
  .withDeck(
    DeckBuilder()
      .withCards([
        SuitAndRankCardBuilder().withSuit("Hearts").withRank("Ace").build(),
        SuitAndRankCardBuilder().withSuit("Hearts").withRank("Two").build(),
        // ... more cards
      ])
      .build(),
  )
  .build();
```

4. **Testing win conditions:**

```typescript
const nearWinState = GameStateBuilder()
  .withPlayers([
    PlayerBuilder().withScore(490).build(), // Just 10 points from winning
    PlayerBuilder().withScore(200).build(),
  ])
  .build();
```

5. **Error condition testing:**

```typescript
const invalidState = GameStateBuilder()
  .withPlayerCount(0) // Invalid player count
  .build(); // Should handle gracefully or throw expected error
```

### Best Practices:

- Use builders for complex state setup
- Create helper functions for common scenarios
- Name your test states descriptively
- Use builders to isolate what you're testing
- Prefix unused variables with underscore (\_) to avoid linting warnings
