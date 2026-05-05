import { expect, test } from "bun:test";
import { classifyRefreshError } from "./refresh-error.ts";

test("classifies known permanent Supabase refresh errors", () => {
  const cases = [
    "Invalid Refresh Token: Refresh Token Not Found",
    "Refresh Token Already Used",
    "Refresh Token has been revoked",
    "refresh_token_already_used",
    "invalid_grant: refresh token expired",
  ];
  for (const message of cases) {
    expect(classifyRefreshError({ message }).kind).toBe("permanent_invalid");
  }
});

test("classifies network-like errors as network", () => {
  const cases = [
    new Error("fetch failed"),
    new Error("getaddrinfo ENOTFOUND example.supabase.co"),
    new Error("ECONNREFUSED 127.0.0.1:8080"),
    new Error("ETIMEDOUT"),
    new Error("socket hang up"),
  ];
  for (const error of cases) {
    expect(classifyRefreshError(error).kind).toBe("network");
  }
});

test("defaults ambiguous errors to transient so disk state is preserved", () => {
  const cases = [
    { message: "" },
    { message: "Something went wrong" },
    { message: "503 Service Unavailable" },
    new Error("Supabase returned an unexpected payload"),
    "just a string",
  ];
  for (const error of cases) {
    expect(classifyRefreshError(error).kind).toBe("transient");
  }
});

test("preserves the original error message in the classification", () => {
  const classification = classifyRefreshError({
    message: "Invalid Refresh Token: Refresh Token Not Found",
  });
  expect(classification.message).toBe(
    "Invalid Refresh Token: Refresh Token Not Found",
  );
});
