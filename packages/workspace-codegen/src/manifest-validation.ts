import type {
  HexBoardSpec,
  HexBoardTemplateSpec,
  HexSpaceSpec,
  HexVertexSpec,
  BoardCard,
  BoardSpec,
  BoardTemplateSpec,
  GameTopologyManifest,
  SetupOptionSpec,
  ZoneSpec,
} from "@dreamboard/sdk-types";
import { resolveHexVertexGeometryKey } from "./hex-geometry.js";

function isHexBoardTemplateSpec(
  boardTemplate: BoardTemplateSpec,
): boardTemplate is Extract<BoardTemplateSpec, { layout: "hex" }> {
  return boardTemplate.layout === "hex";
}

function isHexBoardSpec(
  board: BoardSpec,
): board is Extract<BoardSpec, { layout: "hex" }> {
  return board.layout === "hex";
}

function collectDuplicateIdIssues(options: {
  entries: ReadonlyArray<{ id?: string | null; path: string }>;
  label: string;
}): string[] {
  const issues: string[] = [];
  const pathsById = new Map<string, string[]>();

  for (const entry of options.entries) {
    const id = entry.id?.trim();
    if (!id) {
      continue;
    }
    const paths = pathsById.get(id) ?? [];
    paths.push(entry.path);
    pathsById.set(id, paths);
  }

  for (const [id, paths] of pathsById.entries()) {
    if (paths.length > 1) {
      issues.push(`${paths.join(", ")}: Duplicate ${options.label} '${id}'.`);
    }
  }

  return issues;
}

function renderCardInstanceIds(card: BoardCard): string[] {
  return card.count > 1
    ? Array.from(
        { length: card.count },
        (_, index) => `${card.type}-${index + 1}`,
      )
    : [card.type];
}

function expandSeedIds<
  Seed extends {
    id?: string | null;
    typeId: string;
    count?: number | null;
  },
>(seeds: readonly Seed[]): string[] {
  return seeds.flatMap((seed) => {
    const count = seed.count ?? 1;
    const baseId = seed.id ?? seed.typeId;
    return count > 1
      ? Array.from({ length: count }, (_, index) => `${baseId}-${index + 1}`)
      : [baseId];
  });
}

function validateSetupProfileReferences(
  manifest: GameTopologyManifest,
): string[] {
  const issues: string[] = [];
  const optionChoiceIdsByOptionId = new Map<string, Set<string>>(
    (manifest.setupOptions ?? []).map((option, optionIndex) => {
      const choiceIds = new Set<string>();
      for (const choice of option.choices ?? []) {
        choiceIds.add(choice.id);
      }
      if (!option.id) {
        issues.push(
          `manifest.setupOptions[${optionIndex}].id: Missing option id.`,
        );
      }
      return [option.id, choiceIds];
    }),
  );

  for (const [profileIndex, profile] of (
    manifest.setupProfiles ?? []
  ).entries()) {
    const optionValues = profile.optionValues ?? {};
    for (const [optionId, choiceId] of Object.entries(optionValues)) {
      const allowedChoices = optionChoiceIdsByOptionId.get(optionId);
      if (!allowedChoices) {
        issues.push(
          `manifest.setupProfiles[${profileIndex}].optionValues.${optionId}: Unknown setup option '${optionId}'.`,
        );
        continue;
      }
      if (!allowedChoices.has(choiceId)) {
        issues.push(
          `manifest.setupProfiles[${profileIndex}].optionValues.${optionId}: Unknown choice '${choiceId}' for setup option '${optionId}'.`,
        );
      }
    }
  }

  return issues;
}

function validateBoardTemplateDuplicates(
  boardTemplates: readonly BoardTemplateSpec[],
): string[] {
  const issues: string[] = [];

  for (const [index, boardTemplate] of boardTemplates.entries()) {
    if (isHexBoardTemplateSpec(boardTemplate)) {
      issues.push(
        ...collectDuplicateIdIssues({
          entries: (boardTemplate.spaces ?? []).map((space, spaceIndex) => ({
            id: space.id,
            path: `manifest.boardTemplates[${index}].spaces[${spaceIndex}].id`,
          })),
          label: "space id",
        }),
      );
      continue;
    }

    issues.push(
      ...collectDuplicateIdIssues({
        entries: (boardTemplate.spaces ?? []).map((space, spaceIndex) => ({
          id: space.id,
          path: `manifest.boardTemplates[${index}].spaces[${spaceIndex}].id`,
        })),
        label: "space id",
      }),
    );
    issues.push(
      ...collectDuplicateIdIssues({
        entries: (boardTemplate.containers ?? []).map(
          (container, containerIndex) => ({
            id: container.id,
            path: `manifest.boardTemplates[${index}].containers[${containerIndex}].id`,
          }),
        ),
        label: "container id",
      }),
    );
    issues.push(
      ...collectDuplicateIdIssues({
        entries: (boardTemplate.relations ?? []).map(
          (relation, relationIndex) => ({
            id: relation.id,
            path: `manifest.boardTemplates[${index}].relations[${relationIndex}].id`,
          }),
        ),
        label: "relation id",
      }),
    );
  }

  return issues;
}

function validateBoardDuplicates(boards: readonly BoardSpec[]): string[] {
  const issues: string[] = [];

  for (const [index, board] of boards.entries()) {
    if (isHexBoardSpec(board)) {
      issues.push(
        ...collectDuplicateIdIssues({
          entries: (board.spaces ?? []).map((space, spaceIndex) => ({
            id: space.id,
            path: `manifest.boards[${index}].spaces[${spaceIndex}].id`,
          })),
          label: "space id",
        }),
      );
      continue;
    }

    issues.push(
      ...collectDuplicateIdIssues({
        entries: (board.spaces ?? []).map((space, spaceIndex) => ({
          id: space.id,
          path: `manifest.boards[${index}].spaces[${spaceIndex}].id`,
        })),
        label: "space id",
      }),
    );
    issues.push(
      ...collectDuplicateIdIssues({
        entries: (board.containers ?? []).map((container, containerIndex) => ({
          id: container.id,
          path: `manifest.boards[${index}].containers[${containerIndex}].id`,
        })),
        label: "container id",
      }),
    );
    issues.push(
      ...collectDuplicateIdIssues({
        entries: (board.relations ?? []).map((relation, relationIndex) => ({
          id: relation.id,
          path: `manifest.boards[${index}].relations[${relationIndex}].id`,
        })),
        label: "relation id",
      }),
    );
  }

  return issues;
}

function validateSetupOptionChoiceDuplicates(
  options: readonly SetupOptionSpec[],
): string[] {
  const issues: string[] = [];

  for (const [optionIndex, option] of options.entries()) {
    issues.push(
      ...collectDuplicateIdIssues({
        entries: (option.choices ?? []).map((choice, choiceIndex) => ({
          id: choice.id,
          path: `manifest.setupOptions[${optionIndex}].choices[${choiceIndex}].id`,
        })),
        label: "setup option choice id",
      }),
    );
  }

  return issues;
}

function resolveHexSpaces(
  board: HexBoardSpec,
  template: HexBoardTemplateSpec | undefined,
): HexSpaceSpec[] {
  if (!template) {
    return [...(board.spaces ?? [])].sort((left, right) =>
      left.id.localeCompare(right.id),
    );
  }

  const templateSpacesById = new Map(
    (template.spaces ?? []).map((space) => [space.id, space] as const),
  );
  const overridesById = new Map(
    (board.spaces ?? []).map((space) => [space.id, space] as const),
  );
  for (const overrideId of overridesById.keys()) {
    if (!templateSpacesById.has(overrideId)) {
      continue;
    }
  }

  return (template.spaces ?? [])
    .map((templateSpace) => {
      const override = overridesById.get(templateSpace.id);
      if (!override) {
        return templateSpace;
      }
      return {
        ...templateSpace,
        ...override,
        id: templateSpace.id,
        q: templateSpace.q,
        r: templateSpace.r,
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

function validateHexVertexRefs(options: {
  ownerPath: string;
  ownerLabel: string;
  spaces: readonly HexSpaceSpec[];
  vertices: readonly HexVertexSpec[];
}): string[] {
  const issues: string[] = [];
  const spacesById = new Map(
    options.spaces.map((space) => [space.id, space] as const),
  );

  for (const [vertexIndex, vertex] of options.vertices.entries()) {
    try {
      resolveHexVertexGeometryKey(vertex.ref, spacesById);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown hex vertex error.";
      issues.push(
        `${options.ownerPath}.vertices[${vertexIndex}].ref: ${options.ownerLabel} with spaces '${vertex.ref.spaces.join(", ")}' failed validation. ${message}`,
      );
    }
  }

  return issues;
}

function validateHexBoardVertexRefs(
  manifest: GameTopologyManifest,
): string[] {
  const issues: string[] = [];
  const hexTemplatesById = new Map(
    (manifest.boardTemplates ?? [])
      .filter(isHexBoardTemplateSpec)
      .map((boardTemplate) => [boardTemplate.id, boardTemplate] as const),
  );

  for (const [templateIndex, template] of (manifest.boardTemplates ?? []).entries()) {
    if (!isHexBoardTemplateSpec(template)) {
      continue;
    }
    issues.push(
      ...validateHexVertexRefs({
        ownerPath: `manifest.boardTemplates[${templateIndex}]`,
        ownerLabel: `Hex board template '${template.id}'`,
        spaces: template.spaces ?? [],
        vertices: template.vertices ?? [],
      }),
    );
  }

  for (const [boardIndex, board] of (manifest.boards ?? []).entries()) {
    if (!isHexBoardSpec(board)) {
      continue;
    }
    issues.push(
      ...validateHexVertexRefs({
        ownerPath: `manifest.boards[${boardIndex}]`,
        ownerLabel: `Hex board '${board.id}'`,
        spaces: resolveHexSpaces(board, hexTemplatesById.get(board.templateId ?? "")),
        vertices: board.vertices ?? [],
      }),
    );
  }

  return issues;
}

export function validateManifestAuthoring(
  manifest: GameTopologyManifest,
): string[] {
  const issues: string[] = [];

  issues.push(
    ...collectDuplicateIdIssues({
      entries: manifest.cardSets.map((cardSet, index) => ({
        id: cardSet.id,
        path: `manifest.cardSets[${index}].id`,
      })),
      label: "card set id",
    }),
  );
  issues.push(
    ...collectDuplicateIdIssues({
      entries: manifest.cardSets.flatMap((cardSet, cardSetIndex) =>
        cardSet.type === "manual"
          ? cardSet.cards.flatMap((card, cardIndex) =>
              renderCardInstanceIds(card).map((cardId) => ({
                id: cardId,
                path: `manifest.cardSets[${cardSetIndex}].cards[${cardIndex}].type`,
              })),
            )
          : [],
      ),
      label: "card runtime id",
    }),
  );
  issues.push(
    ...collectDuplicateIdIssues({
      entries: (manifest.zones ?? []).map((zone: ZoneSpec, index) => ({
        id: zone.id,
        path: `manifest.zones[${index}].id`,
      })),
      label: "zone id",
    }),
  );
  issues.push(
    ...collectDuplicateIdIssues({
      entries: (manifest.boardTemplates ?? []).map((boardTemplate, index) => ({
        id: boardTemplate.id,
        path: `manifest.boardTemplates[${index}].id`,
      })),
      label: "board template id",
    }),
  );
  issues.push(
    ...validateBoardTemplateDuplicates(manifest.boardTemplates ?? []),
  );
  issues.push(
    ...collectDuplicateIdIssues({
      entries: (manifest.boards ?? []).map((board, index) => ({
        id: board.id,
        path: `manifest.boards[${index}].id`,
      })),
      label: "board id",
    }),
  );
  issues.push(...validateBoardDuplicates(manifest.boards ?? []));
  issues.push(
    ...collectDuplicateIdIssues({
      entries: (manifest.pieceTypes ?? []).map((pieceType, index) => ({
        id: pieceType.id,
        path: `manifest.pieceTypes[${index}].id`,
      })),
      label: "piece type id",
    }),
  );
  issues.push(
    ...collectDuplicateIdIssues({
      entries: expandSeedIds(manifest.pieceSeeds ?? []).map(
        (pieceId, index) => ({
          id: pieceId,
          path: `manifest.pieceSeeds[*][${index}]`,
        }),
      ),
      label: "piece runtime id",
    }),
  );
  issues.push(
    ...collectDuplicateIdIssues({
      entries: (manifest.dieTypes ?? []).map((dieType, index) => ({
        id: dieType.id,
        path: `manifest.dieTypes[${index}].id`,
      })),
      label: "die type id",
    }),
  );
  issues.push(
    ...collectDuplicateIdIssues({
      entries: expandSeedIds(manifest.dieSeeds ?? []).map((dieId, index) => ({
        id: dieId,
        path: `manifest.dieSeeds[*][${index}]`,
      })),
      label: "die runtime id",
    }),
  );
  issues.push(
    ...collectDuplicateIdIssues({
      entries: (manifest.resources ?? []).map((resource, index) => ({
        id: resource.id,
        path: `manifest.resources[${index}].id`,
      })),
      label: "resource id",
    }),
  );
  issues.push(
    ...collectDuplicateIdIssues({
      entries: (manifest.setupOptions ?? []).map((option, index) => ({
        id: option.id,
        path: `manifest.setupOptions[${index}].id`,
      })),
      label: "setup option id",
    }),
  );
  issues.push(
    ...validateSetupOptionChoiceDuplicates(manifest.setupOptions ?? []),
  );
  issues.push(
    ...collectDuplicateIdIssues({
      entries: (manifest.setupProfiles ?? []).map((profile, index) => ({
        id: profile.id,
        path: `manifest.setupProfiles[${index}].id`,
      })),
      label: "setup profile id",
    }),
  );
  issues.push(...validateSetupProfileReferences(manifest));
  issues.push(...validateHexBoardVertexRefs(manifest));

  return issues;
}
