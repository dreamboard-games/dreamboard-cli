#!/usr/bin/env bun

import { runMain } from "citty";
import { buildBeCliCommand } from "../src/be-cli/command.js";

function handleFatalError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

void runMain(buildBeCliCommand()).catch(handleFatalError);
