import {
  isAllowedGamePath,
  isDynamicGeneratedPath,
  isDynamicSeedPath,
} from "./scaffold-ownership.js";

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertSafeRelativeProjectPath(
  filePath: string,
  sectionName: string,
): void {
  if (filePath.length === 0) {
    throw new Error(
      `Invalid scaffold payload: ${sectionName} contains an empty path.`,
    );
  }

  if (filePath.includes("\\")) {
    throw new Error(
      `Invalid scaffold payload: ${sectionName} path '${filePath}' must use forward slashes.`,
    );
  }

  if (filePath.startsWith("/") || /^[A-Za-z]:\//.test(filePath)) {
    throw new Error(
      `Invalid scaffold payload: ${sectionName} path '${filePath}' must be relative.`,
    );
  }

  const segments = filePath.split("/");
  if (
    segments.some(
      (segment) => segment.length === 0 || segment === "." || segment === "..",
    )
  ) {
    throw new Error(
      `Invalid scaffold payload: ${sectionName} path '${filePath}' is not normalized.`,
    );
  }

  if (!isAllowedGamePath(filePath)) {
    throw new Error(
      `Invalid scaffold payload: ${sectionName} path '${filePath}' is outside the allowed project structure.`,
    );
  }
}

function validateFileSection(
  sectionName: "generatedFiles" | "seedFiles",
  value: unknown,
  isExpectedPath: (filePath: string) => boolean,
): Record<string, string> {
  if (!isObjectRecord(value)) {
    throw new Error(
      `Invalid scaffold payload: ${sectionName} must be an object of relative paths to file contents.`,
    );
  }

  const files: Record<string, string> = {};
  for (const [filePath, content] of Object.entries(value)) {
    assertSafeRelativeProjectPath(filePath, sectionName);

    if (!isExpectedPath(filePath)) {
      throw new Error(
        `Invalid scaffold payload: ${sectionName} contains unexpected path '${filePath}'.`,
      );
    }

    if (typeof content !== "string") {
      throw new Error(
        `Invalid scaffold payload: ${sectionName}['${filePath}'] must be a string.`,
      );
    }

    files[filePath] = content;
  }

  return files;
}

export interface ValidatedDynamicScaffoldResponse {
  generatedFiles: Record<string, string>;
  seedFiles: Record<string, string>;
  allFiles: Record<string, string>;
}

export function validateDynamicScaffoldResponse(
  value: unknown,
): ValidatedDynamicScaffoldResponse {
  if (!isObjectRecord(value)) {
    throw new Error(
      "Invalid scaffold payload: response body must be an object.",
    );
  }

  const generatedFiles = validateFileSection(
    "generatedFiles",
    value.generatedFiles,
    isDynamicGeneratedPath,
  );
  const seedFiles = validateFileSection(
    "seedFiles",
    value.seedFiles,
    isDynamicSeedPath,
  );

  for (const filePath of Object.keys(generatedFiles)) {
    if (filePath in seedFiles) {
      throw new Error(
        `Invalid scaffold payload: path '${filePath}' cannot appear in both generatedFiles and seedFiles.`,
      );
    }
  }

  return {
    generatedFiles,
    seedFiles,
    allFiles: {
      ...generatedFiles,
      ...seedFiles,
    },
  };
}
