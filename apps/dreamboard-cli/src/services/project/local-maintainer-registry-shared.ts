import crypto from "node:crypto";
import path from "node:path";
import { BUILD_CHANNEL, IS_PUBLISHED_BUILD } from "../../build-target.js";
import { ENVIRONMENT_CONFIGS } from "../../constants.js";
import type {
  LocalMaintainerRegistryConfig,
  LocalMaintainerRegistryPackages,
  LocalMaintainerSdkPackageName,
} from "../../types.js";
import { exists, readJsonFile } from "../../utils/fs.js";

export const LOCAL_REGISTRY_HOST = "127.0.0.1";
export const LOCAL_REGISTRY_PORT = 4873;
export const LOCAL_REGISTRY_URL = `http://${LOCAL_REGISTRY_HOST}:${LOCAL_REGISTRY_PORT}`;
export const LOCAL_SCOPE_NPMRC_CONTENT = `@dreamboard:registry=${LOCAL_REGISTRY_URL}\n`;
export const SDK_PUBLISH_ORDER: readonly LocalMaintainerSdkPackageName[] = [
  "@dreamboard/api-client",
  "@dreamboard/sdk-types",
  "@dreamboard/app-sdk",
  "@dreamboard/ui-sdk",
];

export type SnapshotManifest = {
  snapshotsByFingerprint: Record<string, LocalMaintainerRegistryConfig>;
};

export type PackageJsonShape = {
  name?: string;
  version?: string;
  description?: string;
  type?: string;
  main?: string;
  types?: string;
  exports?: Record<string, unknown>;
  typesVersions?: Record<string, unknown>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

export function toLocalSnapshotTimestamp(date: Date = new Date()): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function shortHash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
}

export function isLocalMaintainerRegistryEnabled(apiBaseUrl: string): boolean {
  return (
    !IS_PUBLISHED_BUILD &&
    apiBaseUrl === ENVIRONMENT_CONFIGS.local?.apiBaseUrl &&
    BUILD_CHANNEL === "development"
  );
}

export function packageShortName(
  packageName: LocalMaintainerSdkPackageName,
): string {
  return packageName.replace("@dreamboard/", "");
}

export async function readWorkspaceLocalMaintainerRegistryFromPackageJson(
  projectRoot: string,
  fallbackRegistryUrl: string = LOCAL_REGISTRY_URL,
): Promise<LocalMaintainerRegistryConfig | null> {
  const packageJsonPath = path.join(projectRoot, "package.json");
  if (!(await exists(packageJsonPath))) {
    return null;
  }

  const packageJson = await readJsonFile<PackageJsonShape>(packageJsonPath);
  const appSdkVersion = packageJson.dependencies?.["@dreamboard/app-sdk"];
  const uiSdkVersion = packageJson.dependencies?.["@dreamboard/ui-sdk"];
  const sdkTypesVersion =
    packageJson.devDependencies?.["@dreamboard/sdk-types"];
  if (
    !appSdkVersion?.includes("-local.") ||
    !uiSdkVersion?.includes("-local.") ||
    !sdkTypesVersion?.includes("-local.")
  ) {
    return null;
  }

  return {
    registryUrl: fallbackRegistryUrl,
    snapshotId: shortHash(
      `${appSdkVersion}:${uiSdkVersion}:${sdkTypesVersion}:${fallbackRegistryUrl}`,
    ),
    fingerprint: shortHash(
      `${appSdkVersion}:${uiSdkVersion}:${sdkTypesVersion}:${fallbackRegistryUrl}`,
    ),
    publishedAt: "",
    packages: {
      "@dreamboard/api-client": "",
      "@dreamboard/app-sdk": appSdkVersion,
      "@dreamboard/sdk-types": sdkTypesVersion,
      "@dreamboard/ui-sdk": uiSdkVersion,
    } satisfies LocalMaintainerRegistryPackages,
  };
}

export function getLocalMaintainerNpmrcContent(
  localMaintainerRegistry: LocalMaintainerRegistryConfig | null | undefined,
): string | null {
  if (!localMaintainerRegistry) {
    return null;
  }
  return LOCAL_SCOPE_NPMRC_CONTENT.replace(
    LOCAL_REGISTRY_URL,
    localMaintainerRegistry.registryUrl,
  );
}

export function didLocalMaintainerSnapshotChange(
  previous: LocalMaintainerRegistryConfig | undefined,
  next: LocalMaintainerRegistryConfig | null,
): boolean {
  if (!next) {
    return false;
  }
  return previous?.snapshotId !== next.snapshotId;
}

export function isLocalMaintainerRegistryUrl(
  fileContent: string | null,
): boolean {
  if (!fileContent) {
    return false;
  }
  return /@dreamboard:registry=http:\/\/127\.0\.0\.1:\d+/.test(fileContent);
}
