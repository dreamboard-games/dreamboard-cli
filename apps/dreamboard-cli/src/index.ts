import { defineCommand, runMain } from "citty";
import { IS_PUBLISHED_BUILD } from "./build-target.js";
import { formatCliError } from "./utils/errors.js";
import cmdNew from "./commands/new.js";
import cmdClone from "./commands/clone.js";
import cmdPush from "./commands/push.js";
import cmdStatus from "./commands/status.js";
import cmdUpdate from "./commands/update.js";
import cmdRun from "./commands/run.js";
import cmdStart from "./commands/start.js";
import cmdQuery from "./commands/query.js";
import cmdAuth from "./commands/auth.js";
import cmdLogin from "./commands/login.js";
import cmdLogout from "./commands/logout.js";
import cmdConfig from "./commands/config.js";
import cmdTest from "./commands/test.js";

// ---------------------------------------------------------------------------
// Global error handlers prevent runtime-specific stack previews from spilling
// into CLI output. Instead we emit a single clean error line.
// ---------------------------------------------------------------------------
function handleFatalError(error: unknown): void {
  const message = formatCliError(error);
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

process.on("uncaughtException", handleFatalError);
process.on("unhandledRejection", handleFatalError);

const subCommands = {
  new: cmdNew,
  clone: cmdClone,
  push: cmdPush,
  status: cmdStatus,
  update: cmdUpdate,
  run: cmdRun,
  start: cmdStart,
  test: cmdTest,
  login: cmdLogin,
  logout: cmdLogout,
  config: cmdConfig,
  ...(IS_PUBLISHED_BUILD ? {} : { query: cmdQuery, auth: cmdAuth }),
};

const main = defineCommand({
  meta: {
    name: "dreamboard",
    version: "0.1.4",
    description: "Dreamboard CLI — game development platform",
  },
  subCommands,
});

void runMain(main).catch(handleFatalError);
