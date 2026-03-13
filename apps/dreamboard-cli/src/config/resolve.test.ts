import { expect, test } from "bun:test";
import { resolveConfig } from "./resolve.js";
import { PROD_SUPABASE_ANON_KEY, PROD_SUPABASE_URL } from "../constants.js";

test("prod config always includes the published Supabase settings", () => {
  const config = resolveConfig(
    {
      environment: "prod",
    },
    {},
  );

  expect(config.supabaseUrl).toBe(PROD_SUPABASE_URL);
  expect(config.supabaseAnonKey).toBe(PROD_SUPABASE_ANON_KEY);
});
