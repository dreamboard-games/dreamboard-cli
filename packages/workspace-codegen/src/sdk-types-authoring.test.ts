import { createRequire } from "node:module";
import path from "node:path";
import { expect, test } from "bun:test";

const require = createRequire(import.meta.url);
const tscBin = require.resolve("typescript/bin/tsc");
const fixtureRoot = path.join(import.meta.dir, "__fixtures__", "sdk-types");
const workspaceCodegenRoot = path.resolve(import.meta.dir, "..");

function runTypecheck(fileName: string) {
  return Bun.spawnSync({
    cmd: [
      tscBin,
      "--noEmit",
      "--strict",
      "--target",
      "ES2022",
      "--module",
      "ESNext",
      "--moduleResolution",
      "bundler",
      fileName,
    ],
    cwd: workspaceCodegenRoot,
    stdout: "pipe",
    stderr: "pipe",
  });
}

function expectTypecheckFailure(
  fileName: string,
  expectedSnippets: readonly string[],
) {
  const result = runTypecheck(path.join(fixtureRoot, fileName));
  const decoder = new TextDecoder();
  const output = `${decoder.decode(result.stdout)}\n${decoder.decode(result.stderr)}`;

  expect(result.exitCode).not.toBe(0);
  for (const snippet of expectedSnippets) {
    expect(output).toContain(snippet);
  }
}

test("defineTopologyManifest accepts valid typed references", () => {
  const result = runTypecheck(path.join(fixtureRoot, "valid-manifest.ts"));
  const decoder = new TextDecoder();
  if (result.exitCode !== 0) {
    throw new Error(
      `Typecheck failed for valid-manifest.ts\nstdout:\n${decoder.decode(result.stdout)}\nstderr:\n${decoder.decode(result.stderr)}`,
    );
  }
});

test("defineTopologyManifest accepts valid player-scoped seed homes with ownerId", () => {
  const result = runTypecheck(
    path.join(fixtureRoot, "valid-player-scoped-seed-homes.ts"),
  );
  const decoder = new TextDecoder();
  if (result.exitCode !== 0) {
    throw new Error(
      `Typecheck failed for valid-player-scoped-seed-homes.ts\nstdout:\n${decoder.decode(result.stdout)}\nstderr:\n${decoder.decode(result.stderr)}`,
    );
  }
});

test("defineTopologyManifest accepts omitted boardTemplates", () => {
  const result = runTypecheck(
    path.join(fixtureRoot, "valid-manifest-omits-board-templates.ts"),
  );
  const decoder = new TextDecoder();
  if (result.exitCode !== 0) {
    throw new Error(
      `Typecheck failed for valid-manifest-omits-board-templates.ts\nstdout:\n${decoder.decode(result.stdout)}\nstderr:\n${decoder.decode(result.stderr)}`,
    );
  }
});

test("defineTopologyManifest accepts die types that omit sides", () => {
  const result = runTypecheck(
    path.join(fixtureRoot, "valid-die-type-omits-sides.ts"),
  );
  const decoder = new TextDecoder();
  if (result.exitCode !== 0) {
    throw new Error(
      `Typecheck failed for valid-die-type-omits-sides.ts\nstdout:\n${decoder.decode(result.stdout)}\nstderr:\n${decoder.decode(result.stderr)}`,
    );
  }
});

test("defineTopologyManifest rejects invalid typed references", () => {
  const result = runTypecheck(path.join(fixtureRoot, "invalid-manifest.ts"));
  const decoder = new TextDecoder();
  const output = `${decoder.decode(result.stdout)}\n${decoder.decode(result.stderr)}`;

  expect(result.exitCode).not.toBe(0);
  expect(output).toContain(
    "Type '\"discard\"' is not assignable to type '\"draw\"'",
  );
  expect(output).toContain(
    "Type '\"missing-card-set\"' is not assignable to type '\"main\"'",
  );
  expect(output).toContain(
    "Type '\"space-b\"' is not assignable to type '\"space-a\"'",
  );
  expect(output).toContain(
    'Type \'"missing-slot"\' is not assignable to type \'"worker-rest" | "staging"\'',
  );
  expect(output).toContain(
    "Type '\"draft\"' is not assignable to type '\"standard\"'",
  );
});

test("defineTopologyManifest rejects invalid strict slot host ids", () => {
  const result = runTypecheck(
    path.join(fixtureRoot, "invalid-slot-host-manifest.ts"),
  );
  const decoder = new TextDecoder();
  const output = `${decoder.decode(result.stdout)}\n${decoder.decode(result.stderr)}`;

  expect(result.exitCode).not.toBe(0);
  expect(output).toContain(
    "Type '\"missing-host\"' is not assignable to type '\"mat-alpha\"'",
  );
});

test("defineTopologyManifest rejects invalid strict slot ids", () => {
  const result = runTypecheck(
    path.join(fixtureRoot, "invalid-slot-id-manifest.ts"),
  );
  const decoder = new TextDecoder();
  const output = `${decoder.decode(result.stdout)}\n${decoder.decode(result.stderr)}`;

  expect(result.exitCode).not.toBe(0);
  expect(output).toContain(
    "Type '\"missing-slot\"' is not assignable to type '\"staging\"'",
  );
});

test("defineTopologyManifest rejects missing required card properties", () => {
  expectTypecheckFailure("invalid-card-properties-missing-required.ts", [
    "Property 'value' is missing",
  ]);
});

test("defineTopologyManifest rejects extra card property keys", () => {
  expectTypecheckFailure("invalid-card-properties-extra-key.ts", [
    "'unexpected' does not exist in type",
  ]);
});

test("defineTopologyManifest rejects wrong card scalar property values", () => {
  expectTypecheckFailure("invalid-card-properties-wrong-scalar.ts", [
    "Type 'string' is not assignable to type 'number'",
  ]);
});

test("defineTopologyManifest rejects wrong card enum values", () => {
  expectTypecheckFailure("invalid-card-properties-wrong-enum.ts", [
    'Type \'"stars"\' is not assignable to type \'"sun" | "moon"\'',
  ]);
});

test("defineTopologyManifest rejects wrong nested card property values", () => {
  expectTypecheckFailure("invalid-card-properties-wrong-nested.ts", [
    "Type 'number' is not assignable to type 'string'",
  ]);
});

test("defineTopologyManifest rejects wrong piece scalar field values", () => {
  expectTypecheckFailure("invalid-piece-fields-wrong-scalar.ts", [
    "Type 'string' is not assignable to type 'number'",
  ]);
});

test("defineTopologyManifest rejects wrong piece enum field values", () => {
  expectTypecheckFailure("invalid-piece-fields-wrong-enum.ts", [
    'Type \'"resting"\' is not assignable to type \'"ready" | "spent"\'',
  ]);
});

test("defineTopologyManifest rejects wrong piece card id references", () => {
  expectTypecheckFailure("invalid-piece-fields-wrong-card-id.ts", [
    "Type '\"missing-card\"' is not assignable to type '\"ace\"'",
  ]);
});

test("defineTopologyManifest rejects wrong piece zone id references", () => {
  expectTypecheckFailure("invalid-piece-fields-wrong-zone-id.ts", [
    "Type '\"discard\"' is not assignable to type '\"draw\"'",
  ]);
});

test("defineTopologyManifest rejects extra piece field keys", () => {
  expectTypecheckFailure("invalid-piece-fields-extra-key.ts", [
    "'extra' does not exist in type",
  ]);
});

test("defineTopologyManifest rejects per-player space homes without ownerId", () => {
  expectTypecheckFailure("invalid-piece-home-per-player-space-no-owner.ts", [
    "Property 'ownerId' is missing",
    '"player-grid"',
  ]);
});

test("defineTopologyManifest rejects per-player container homes without ownerId", () => {
  expectTypecheckFailure(
    "invalid-piece-home-per-player-container-no-owner.ts",
    ["Property 'ownerId' is missing", '"player-grid"'],
  );
});

test("defineTopologyManifest rejects per-player edge homes without ownerId", () => {
  expectTypecheckFailure("invalid-piece-home-per-player-edge-no-owner.ts", [
    "Property 'ownerId' is missing",
    '"player-grid"',
  ]);
});

test("defineTopologyManifest rejects per-player vertex homes without ownerId", () => {
  expectTypecheckFailure("invalid-piece-home-per-player-vertex-no-owner.ts", [
    "Property 'ownerId' is missing",
    '"player-grid"',
  ]);
});

test("defineTopologyManifest rejects piece seeds with unknown type ids", () => {
  expectTypecheckFailure("invalid-piece-seed-type-id.ts", [
    "Type '\"missing-meeple\"' is not assignable to type '\"meeple\"'",
  ]);
});

test("defineTopologyManifest rejects wrong die player id references", () => {
  expectTypecheckFailure("invalid-die-fields-wrong-player-id.ts", [
    `Type '"player-3"' is not assignable to type`,
  ]);
});

test("defineTopologyManifest rejects wrong die resource id references", () => {
  expectTypecheckFailure("invalid-die-fields-wrong-resource-id.ts", [
    "Type '\"missing-resource\"' is not assignable to type '\"supply\"'",
  ]);
});

test("defineTopologyManifest rejects wrong die array item values", () => {
  expectTypecheckFailure("invalid-die-fields-wrong-array-item.ts", [
    "Type 'string' is not assignable to type 'number'",
  ]);
});

test("defineTopologyManifest rejects die seeds with unknown type ids", () => {
  expectTypecheckFailure("invalid-die-seed-type-id.ts", [
    "Type '\"missing-d6\"' is not assignable to type '\"d6\"'",
  ]);
});

test("defineTopologyManifest rejects per-player zone homes without ownerId", () => {
  expectTypecheckFailure("invalid-die-home-per-player-zone-no-owner.ts", [
    "Property 'ownerId' is missing",
    '"main-hand"',
  ]);
});

test("defineTopologyManifest rejects invalid board container card-set references", () => {
  const result = runTypecheck(
    path.join(fixtureRoot, "invalid-container-card-set-manifest.ts"),
  );
  const decoder = new TextDecoder();
  const output = `${decoder.decode(result.stdout)}\n${decoder.decode(result.stderr)}`;

  expect(result.exitCode).not.toBe(0);
  expect(output).toContain(
    "Type '\"missing-card-set\"' is not assignable to type '\"main\"'",
  );
});

test("defineTopologyManifest rejects edge ids in generic board field schemas", () => {
  expectTypecheckFailure("invalid-generic-board-edge-id.ts", [
    "not assignable to type 'never'",
  ]);
});

test("defineTopologyManifest rejects invalid nested generic board fields", () => {
  expectTypecheckFailure("invalid-generic-board-nested-field.ts", [
    "Type 'number' is not assignable to type 'string'",
  ]);
});

test("defineTopologyManifest rejects wrong square-board space ids in board fields", () => {
  expectTypecheckFailure("invalid-square-board-space-id.ts", [
    "missing-space",
    "not assignable to type",
  ]);
});

test("defineTopologyManifest rejects wrong square-board edge ids in board fields", () => {
  expectTypecheckFailure("invalid-square-board-edge-id.ts", [
    "square-edge:missing",
    "not assignable to type",
  ]);
});

test("defineTopologyManifest rejects wrong square-board vertex ids in board fields", () => {
  expectTypecheckFailure("invalid-square-board-vertex-id.ts", [
    "square-vertex:9,9",
    "not assignable to type",
  ]);
});

test("defineTopologyManifest rejects extra square-template space field keys", () => {
  expectTypecheckFailure("invalid-square-space-fields-extra-key.ts", [
    "'extra' does not exist in type",
  ]);
});

test("defineTopologyManifest rejects wrong square-template space field enums", () => {
  expectTypecheckFailure("invalid-square-space-fields-enum.ts", [
    'Type \'"lava"\' is not assignable to type \'"grass" | "water"\'',
  ]);
});

test("defineTopologyManifest rejects wrong square relation space ids", () => {
  expectTypecheckFailure("invalid-square-relation-space-id.ts", [
    "missing-space",
    "not assignable to type",
  ]);
});

test("defineTopologyManifest rejects wrong square relation field scalars", () => {
  expectTypecheckFailure("invalid-square-relation-field-scalar.ts", [
    "Type 'string' is not assignable to type 'number'",
  ]);
});

test("defineTopologyManifest rejects wrong square container host space ids", () => {
  expectTypecheckFailure("invalid-square-container-host-space-id.ts", [
    "missing-space",
    "not assignable to type",
  ]);
});

test("defineTopologyManifest rejects wrong square container field space ids", () => {
  expectTypecheckFailure("invalid-square-container-field-space-id.ts", [
    "missing-space",
    "not assignable to type",
  ]);
});

test("defineTopologyManifest rejects wrong hex edge ids in edge fields", () => {
  expectTypecheckFailure("invalid-hex-edge-field-edge-id.ts", [
    "hex-edge:missing",
    "not assignable to type",
  ]);
});

test("defineTopologyManifest rejects wrong hex vertex ids in vertex fields", () => {
  expectTypecheckFailure("invalid-hex-vertex-field-vertex-id.ts", [
    "hex-vertex:missing",
    "not assignable to type",
  ]);
});

test("defineTopologyManifest rejects invalid card visibility player ids", () => {
  expectTypecheckFailure("invalid-card-visibility.ts", [
    `Type '"player-3"' is not assignable to type`,
  ]);
});

test("defineTopologyManifest rejects invalid piece visibility player ids", () => {
  expectTypecheckFailure("invalid-piece-visibility.ts", [
    `Type '"player-3"' is not assignable to type`,
  ]);
});

test("defineTopologyManifest rejects invalid die visibility player ids", () => {
  expectTypecheckFailure("invalid-die-visibility.ts", [
    `Type '"player-3"' is not assignable to type`,
  ]);
});
