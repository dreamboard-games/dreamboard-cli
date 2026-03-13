import { defineCommand } from "citty";
import consola from "consola";
import { resolveProjectContext } from "../config/resolve.js";
import { parsePullCommandArgs } from "../flags.js";
import { pullIntoDirectory } from "../services/project/sync.js";
import { getLocalDiff } from "../services/project/local-files.js";

export default defineCommand({
  meta: {
    name: "pull",
    description: "Pull latest server sources into the current project",
  },
  args: {
    force: {
      type: "boolean",
      description: "Override conflicts",
      default: false,
    },
    env: { type: "string", description: "Environment: local | dev | prod" },
    token: { type: "string", description: "Auth token (Supabase JWT)" },
  },
  async run({ args }) {
    const parsedArgs = parsePullCommandArgs(args);
    const { projectRoot, projectConfig, config } =
      await resolveProjectContext(parsedArgs);

    const localDiff = await getLocalDiff(projectRoot);
    if (
      (localDiff.modified.length > 0 || localDiff.added.length > 0) &&
      !parsedArgs.force
    ) {
      throw new Error(
        "Local changes detected. Use --force to overwrite local files.",
      );
    }

    await pullIntoDirectory(config, projectRoot, projectConfig);
    consola.success("Pulled latest sources.");
  },
});
