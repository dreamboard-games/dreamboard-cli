import { IS_PUBLISHED_BUILD } from "./build-target.js";

export const CONFIG_FLAG_ARGS = IS_PUBLISHED_BUILD
  ? {}
  : {
      env: {
        type: "string" as const,
        description: "Environment: local | dev | prod",
      },
      token: {
        type: "string" as const,
        description: "Auth token (Supabase JWT)",
      },
    };

export const SCREENSHOT_CAPTURE_ARGS = {
  output: {
    type: "string" as const,
    description:
      "Output file path (default: .dreamboard/screenshots/run-<timestamp>.png)",
  },
  delay: {
    type: "string" as const,
    description:
      "Milliseconds to wait after the game loads before capturing (default: 3000)",
    default: "3000",
  },
  width: {
    type: "string" as const,
    description: "Viewport width in pixels (default: 390)",
    default: "390",
  },
  height: {
    type: "string" as const,
    description: "Viewport height in pixels (default: 844)",
    default: "844",
  },
};
