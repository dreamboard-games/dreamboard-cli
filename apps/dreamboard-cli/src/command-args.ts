export const CONFIG_FLAG_ARGS = {
  env: {
    type: "string" as const,
    description: "Environment: local | dev | prod",
  },
  token: {
    type: "string" as const,
    description: "Auth token (Supabase JWT)",
  },
};
