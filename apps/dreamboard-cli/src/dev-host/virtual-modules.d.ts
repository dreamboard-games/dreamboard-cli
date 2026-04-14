declare module "virtual:dreamboard-dev-config" {
  export interface DreamboardDevConfig {
    apiBaseUrl: string;
    authToken: string | null;
    userId: string | null;
    sessionId: string;
    shortCode: string;
    gameId: string;
    seed: number | null;
    compiledResultId: string;
    setupProfileId: string | null;
    playerCount: number;
    debug: boolean;
    slug: string;
    autoStartGame: boolean;
  }

  const config: DreamboardDevConfig;
  export default config;
}
