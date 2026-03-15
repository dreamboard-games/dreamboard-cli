import { queryWorkshopRulebook } from "@dreamboard/api-client";
import { defineCommand } from "citty";
import { CONFIG_FLAG_ARGS } from "../command-args.js";
import { loadGlobalConfig } from "../config/global-config.js";
import {
  configureClient,
  requireAuth,
  resolveConfig,
} from "../config/resolve.js";
import { parseQueryCommandArgs } from "../flags.js";
import { formatApiError } from "../utils/errors.js";

export default defineCommand({
  meta: {
    name: "query",
    description: "Query rulebook text by title",
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
    const parsedArgs = parseQueryCommandArgs(args);
    const config = resolveConfig(await loadGlobalConfig(), parsedArgs);
    requireAuth(config);
    await configureClient(config);

    const { data, error, response } = await queryWorkshopRulebook({
      query: {
        title: parsedArgs.title,
      },
    });

    if (!data) {
      throw new Error(
        formatApiError(
          error,
          response,
          `Failed to query rulebook for '${parsedArgs.title}'`,
        ),
      );
    }

    console.log(data.ruleText);
  },
});
