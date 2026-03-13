export interface UiArgsMergeResult {
  content: string;
  addedInterfaces: string[];
  addedPhases: string[];
  conflicted: boolean;
  regenerated: boolean;
  reason?: string;
}

const GENERATED_INTERFACES_START =
  "<dreamboard:generated:phase-interfaces:start>";
const GENERATED_INTERFACES_END = "<dreamboard:generated:phase-interfaces:end>";
const GENERATED_PHASE_MAP_START = "<dreamboard:generated:phase-map:start>";
const GENERATED_PHASE_MAP_END = "<dreamboard:generated:phase-map:end>";

type MarkerPair = { start: string; end: string };
type MarkerBlock = { startEnd: number; endStart: number; inner: string };

const GENERATED_INTERFACES_MARKERS: MarkerPair = {
  start: GENERATED_INTERFACES_START,
  end: GENERATED_INTERFACES_END,
};

const GENERATED_PHASE_MAP_MARKERS: MarkerPair = {
  start: GENERATED_PHASE_MAP_START,
  end: GENERATED_PHASE_MAP_END,
};

function findMarkerBlock(
  content: string,
  markers: MarkerPair,
): MarkerBlock | null {
  const startIndex = content.indexOf(markers.start);
  if (startIndex === -1) return null;

  const startEnd = startIndex + markers.start.length;
  const endStart = content.indexOf(markers.end, startEnd);
  if (endStart === -1 || endStart < startEnd) return null;

  return {
    startEnd,
    endStart,
    inner: content.slice(startEnd, endStart),
  };
}

function replaceMarkerBlock(
  content: string,
  markers: MarkerPair,
  newInner: string,
): string | null {
  const block = findMarkerBlock(content, markers);
  if (!block) return null;
  return `${content.slice(0, block.startEnd)}${newInner}${content.slice(block.endStart)}`;
}

function collectInterfaceNames(content: string): Set<string> {
  const matches = content.matchAll(
    /export\s+interface\s+([A-Za-z0-9_]+)\s*\{/g,
  );
  return new Set(Array.from(matches, (match) => match[1]));
}

function collectPhaseNames(content: string): Set<string> {
  const matches = content.matchAll(
    /^\s*([A-Za-z0-9_]+)\s*:\s*[A-Za-z0-9_]+\s*;\s*$/gm,
  );
  return new Set(Array.from(matches, (match) => match[1]));
}

export function mergeUiArgsContent(
  local: string,
  incoming: string,
): UiArgsMergeResult {
  const incomingInterfacesBlock = findMarkerBlock(
    incoming,
    GENERATED_INTERFACES_MARKERS,
  );
  const incomingPhaseMapBlock = findMarkerBlock(
    incoming,
    GENERATED_PHASE_MAP_MARKERS,
  );
  if (!incomingInterfacesBlock || !incomingPhaseMapBlock) {
    return {
      content: local,
      addedInterfaces: [],
      addedPhases: [],
      conflicted: true,
      regenerated: false,
      reason:
        "Incoming scaffolded shared/ui-args.ts is missing required generated markers.",
    };
  }

  const incomingInterfaces = collectInterfaceNames(
    incomingInterfacesBlock.inner,
  );
  const incomingPhases = collectPhaseNames(incomingPhaseMapBlock.inner);

  if (local.trim().length === 0) {
    return {
      content: incoming,
      addedInterfaces: Array.from(incomingInterfaces).sort(),
      addedPhases: Array.from(incomingPhases).sort(),
      conflicted: false,
      regenerated: false,
    };
  }

  const localInterfacesBlock = findMarkerBlock(
    local,
    GENERATED_INTERFACES_MARKERS,
  );
  const localPhaseMapBlock = findMarkerBlock(
    local,
    GENERATED_PHASE_MAP_MARKERS,
  );

  if (!localInterfacesBlock || !localPhaseMapBlock) {
    return {
      content: incoming,
      addedInterfaces: Array.from(incomingInterfaces).sort(),
      addedPhases: Array.from(incomingPhases).sort(),
      conflicted: false,
      regenerated: true,
      reason:
        "Local shared/ui-args.ts is missing generated markers. Regenerated from scaffold template.",
    };
  }

  const localInterfaces = collectInterfaceNames(localInterfacesBlock.inner);
  const localPhases = collectPhaseNames(localPhaseMapBlock.inner);

  const mergedInterfaces = replaceMarkerBlock(
    local,
    GENERATED_INTERFACES_MARKERS,
    incomingInterfacesBlock.inner,
  );
  if (mergedInterfaces === null) {
    return {
      content: local,
      addedInterfaces: [],
      addedPhases: [],
      conflicted: true,
      regenerated: false,
      reason:
        "Could not replace generated interface block in shared/ui-args.ts.",
    };
  }

  const merged = replaceMarkerBlock(
    mergedInterfaces,
    GENERATED_PHASE_MAP_MARKERS,
    incomingPhaseMapBlock.inner,
  );
  if (merged === null) {
    return {
      content: local,
      addedInterfaces: [],
      addedPhases: [],
      conflicted: true,
      regenerated: false,
      reason:
        "Could not replace generated phase map block in shared/ui-args.ts.",
    };
  }

  const addedInterfaces = Array.from(incomingInterfaces)
    .filter((name) => !localInterfaces.has(name))
    .sort();
  const addedPhases = Array.from(incomingPhases)
    .filter((name) => !localPhases.has(name))
    .sort();

  return {
    content: merged,
    addedInterfaces,
    addedPhases,
    conflicted: false,
    regenerated: false,
  };
}
