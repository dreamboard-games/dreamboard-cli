import crypto from "node:crypto";

export function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

export function getUserIdFromToken(token: string): string {
  const [, payload] = token.split(".");
  if (!payload) throw new Error("Invalid auth token.");
  const decoded = JSON.parse(
    Buffer.from(payload, "base64").toString("utf8"),
  ) as { sub?: string };
  if (!decoded.sub) throw new Error("Auth token missing user id.");
  return decoded.sub;
}
