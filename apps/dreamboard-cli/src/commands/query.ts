import { defineCommand } from "citty";
import { parseQueryCommandArgs } from "../flags.js";
import { CONFIG_FLAG_ARGS } from "../command-args.js";

export const QUERY_DISABLED_MESSAGE =
  "The `query` command is temporarily disabled.";

export default defineCommand({
  meta: {
    name: "query",
    description: "Temporarily disabled",
  },
  args: {
    title: {
      type: "positional",
      description: "Board game title to search in the rulebook library",
      required: true,
    },
    ...CONFIG_FLAG_ARGS,
  },
  async run({ args }) {
    parseQueryCommandArgs(args);
    throw new Error(QUERY_DISABLED_MESSAGE);
  },
});
