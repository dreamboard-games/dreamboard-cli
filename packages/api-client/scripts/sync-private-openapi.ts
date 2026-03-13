import { cp } from "node:fs/promises";
import path from "node:path";

const packageRoot = path.resolve(import.meta.dir, "..");
const sourcePath = path.resolve(
  packageRoot,
  "..",
  "private-contracts",
  "documentation.yaml",
);
const targetPath = path.join(packageRoot, "openapi", "documentation.yaml");

if (!(await Bun.file(sourcePath).exists())) {
  throw new Error(
    "Private OpenAPI bundle not found at packages/private-contracts/documentation.yaml. " +
      "This helper only works from the private monorepo checkout; public repos should update packages/api-client/openapi/documentation.yaml manually.",
  );
}

await cp(sourcePath, targetPath, { force: true });
process.stdout.write(
  "Synced packages/api-client/openapi/documentation.yaml from packages/private-contracts/documentation.yaml.\n",
);
