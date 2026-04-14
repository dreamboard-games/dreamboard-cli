/**
 * Result of validating a player action
 */
export interface ValidationResult {
  /** Whether the action is valid */
  valid: boolean;
  /** Machine-readable error code if validation failed */
  errorCode?: string;
  /** Human-readable error message if validation failed */
  message?: string;
}

/**
 * Structured authoritative submission failure returned by runtime submit APIs.
 */
export interface SubmissionError extends Error {
  /** Machine-readable error code when available */
  errorCode?: string;
}

/**
 * Plugin session state
 */
export interface PluginSessionState {
  /** Session initialization status */
  status: "loading" | "ready";
  /** Current session ID (null if not initialized) */
  sessionId: string | null;
  /** Player IDs that this user can control (immutable after game starts) */
  controllablePlayerIds: string[];
  /** The currently selected player ID that the user is controlling */
  controllingPlayerId: string | null;
  /** User ID of the controller (null if not initialized) */
  userId: string | null;
}

/**
 * RuntimeAPI provides the interface between plugin code and the game runtime.
 * This API is exposed to plugin iframes for subscribing to game events and submitting actions.
 */
export interface RuntimeAPI {
  /**
   * Validate a player action before submitting it.
   * This allows checking if an action is valid without actually executing it.
   *
   * @param playerId - ID of the player performing the action (e.g., 'player-1')
   * @param actionType - Type of action being validated (e.g., 'playCard', 'drawCard')
   * @param params - Action-specific parameters
   * @returns Promise that resolves with validation result
   *
   * @example
   * ```typescript
   * const result = await runtime.validateAction('player-1', 'playCard', {
   *   cardId: 'card-42'
   * });
   * if (!result.valid) {
   *   console.log('Validation failed:', result.errorCode, result.message);
   * }
   * ```
   */
  validateAction: (
    playerId: string,
    actionType: string,
    params: Record<string, unknown>,
  ) => Promise<ValidationResult>;

  /**
   * Submit a player action to the game server.
   *
   * @param playerId - ID of the player performing the action (e.g., 'player-1')
   * @param actionType - Type of action being performed (e.g., 'playCard', 'drawCard')
   * @param params - Action-specific parameters
   * @returns Promise that resolves when the authority accepts the submission
   *
   * @throws SubmissionError if action submission fails or is rejected
   *
   * @example
   * ```typescript
   * await runtime.submitAction('player-1', 'playCard', {
   *   cardId: 'card-42',
   *   targetZone: 'discard-pile'
   * });
   * ```
   */
  submitAction: (
    playerId: string,
    actionType: string,
    params: Record<string, unknown>,
  ) => Promise<void>;

  /**
   * Submit a response to an active gameplay prompt.
   *
   * @param playerId - ID of the player responding to the prompt
   * @param promptId - Active prompt instance ID
   * @param response - Prompt-specific response payload
   * @returns Promise that resolves when the authority accepts the response
   */
  submitPromptResponse: (
    playerId: string,
    promptId: string,
    response: unknown,
  ) => Promise<void>;

  /**
   * Submit a window action for an active gameplay window.
   *
   * @param playerId - ID of the player acting in the window
   * @param windowId - Active window instance ID
   * @param actionType - Window action type
   * @param params - Optional action parameters
   * @returns Promise that resolves when the authority accepts the action
   */
  submitWindowAction: (
    playerId: string,
    windowId: string,
    actionType: string,
    params?: Record<string, unknown>,
  ) => Promise<void>;

  /**
   * Get the current plugin session state.
   * Returns initialization status and session/player IDs.
   *
   * @returns Current plugin session state
   *
   * @example
   * ```typescript
   * const { status, sessionId, playerId } = runtime.getSessionState();
   * if (status === "ready") {
   *   console.log('Connected to session:', sessionId);
   * }
   * ```
   */
  getSessionState: () => PluginSessionState;

  /**
   * Disconnect from the runtime and clean up all listeners.
   * Should be called when the plugin is unmounting.
   */
  disconnect: () => void;

  /**
   * Request to switch to a different player.
   * Only works if the user controls multiple seats.
   * The parent window will handle the switch and update the session state.
   *
   * @param playerId - ID of the player to switch to
   *
   * @example
   * ```typescript
   * // Switch to player-2
   * runtime.switchPlayer?.('player-2');
   * ```
   */
  switchPlayer?: (playerId: string) => void;
}
