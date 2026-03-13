import { expect, test } from "bun:test";
import { QUERY_DISABLED_MESSAGE, default as queryCommand } from "./query.ts";

test("query command is temporarily disabled", async () => {
  await expect(
    queryCommand.run({
      args: {
        title: "Chess",
      },
    }),
  ).rejects.toThrow(QUERY_DISABLED_MESSAGE);
});
