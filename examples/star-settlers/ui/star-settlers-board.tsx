import { useMemo } from "react";
import type { PlayerId } from "@dreamboard/manifest-contract";
import { boardHelpers, idGuards } from "@dreamboard/manifest-contract";
import { HexGrid } from "@dreamboard/ui-sdk";
import {
  useBoardInteractions,
  useHexBoardView,
  type GameView,
} from "@dreamboard/ui-contract";

type Terrain = GameView["spaces"][number]["terrain"];
type LandTerrain = Exclude<Terrain, "deepSpace">;
type BoardContext = ReturnType<typeof useBoardInteractions>;
type PlayerInfoById = ReadonlyMap<PlayerId, { readonly color?: string }>;

// Hand-drawn design tokens.
//
// The wider Dreamboard brand is a warm-paper notebook: pencil-black
// strokes on Warm Paper with Post-it accents. The board used to render
// as a dark sci-fi panel that clashed with that language, so the whole
// palette is reframed here in pastel pencil-and-ink terms.
const PAPER = "#fdfbf7";
const PAPER_MUTED = "#e5e0d8";
const PENCIL = "#2d2d2d";
const POSTIT = "#fff9c4";
const ACCENT_RED = "#ff4d4d";
const HAND_FONT = "Patrick Hand, Caveat, ui-sans-serif, cursive";

const TERRAIN_THEME: Record<
  LandTerrain,
  {
    readonly label: string;
    readonly icon: string;
    readonly fill: string;
    readonly inner: string;
    readonly accent: string;
  }
> = {
  carbonCloud: {
    label: "Carbon Nebula",
    icon: "⚫",
    fill: "#ece4f5",
    inner: "#ddd0ee",
    accent: "#8b6bcf",
  },
  alloyField: {
    label: "Alloy Wreckage",
    icon: "🛰️",
    fill: "#f5dcc7",
    inner: "#edc9ac",
    accent: "#c2714a",
  },
  waterWorld: {
    label: "Hydrogen Ice",
    icon: "🧊",
    fill: "#dcecf5",
    inner: "#c6dfec",
    accent: "#4a8eb8",
  },
  crystalBelt: {
    label: "Crystal Belt",
    icon: "🔷",
    fill: "#d7ecec",
    inner: "#bfdfdf",
    accent: "#2d8a8a",
  },
  fiberGrove: {
    label: "Biofiber Bloom",
    icon: "🧬",
    fill: "#dfecd5",
    inner: "#cbdfbd",
    accent: "#5a8a4a",
  },
  deadZone: {
    label: "Dead Zone",
    icon: "☢️",
    fill: "#f3d8d8",
    inner: "#e8c3c3",
    accent: "#b05a5a",
  },
};

// Resource-tinted pastels for 2:1 port sticky notes. 3:1 generic ports
// use plain Post-it yellow so the trading rate reads before the good.
const PORT_TINT: Record<string, string> = {
  "3:1": POSTIT,
  crystal: "#d7ecec",
  water: "#dcecf5",
  fiber: "#dfecd5",
  carbon: "#ece4f5",
  alloy: "#f5dcc7",
};

const PORT_ACCENT: Record<string, string> = {
  "3:1": "#c2a13a",
  crystal: "#2d8a8a",
  water: "#4a8eb8",
  fiber: "#5a8a4a",
  carbon: "#8b6bcf",
  alloy: "#c2714a",
};

const PORT_LABEL: Record<string, string> = {
  "3:1": "3:1",
  crystal: "Q-C",
  water: "H₂",
  fiber: "BIO",
  carbon: "C",
  alloy: "AL",
};

const STAR_SETTLERS_HEX_SIZE = 56;
const STAR_SETTLERS_INITIAL_ZOOM = 0.9;
const TILE_OUTER_INSET = 6;
const TILE_INNER_INSET = 13;
const SECTOR = "sector" as const;
const SPACE_KINDS = boardHelpers.spaceKinds(SECTOR);
// Sticky-note ports sit out in the deep-space margin, pointing back at
// the coastline edge with a pencil tick.
const PORT_BADGE_OCEAN_OFFSET = 34;

function spaceKind(spaceId: string) {
  return idGuards.isSpaceId(spaceId) ? SPACE_KINDS[spaceId] : undefined;
}

function seededFraction(seed: string, salt: number) {
  let hash = salt * 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function seededRotation(seed: string, salt: number, range: number) {
  return (seededFraction(seed, salt) - 0.5) * 2 * range;
}

function starPoints(seed: string, count: number, radius: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = seededFraction(seed, index + 1) * Math.PI * 2;
    const distance = (0.28 + seededFraction(seed, index + 11) * 0.62) * radius;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      r: 0.6 + seededFraction(seed, index + 21) * 0.9,
    };
  });
}

export interface StarSettlersBoardProps {
  view: GameView;
  board: BoardContext;
  players: PlayerInfoById;
  controllingPlayerId: PlayerId | null;
  isMyTurn: boolean;
  gameplayPhase: string | null;
  onActionError: (error: unknown) => void;
}

export function StarSettlersBoard({
  view,
  board,
  players,
  controllingPlayerId,
  isMyTurn,
  gameplayPhase,
  onActionError,
}: StarSettlersBoardProps) {
  const staticBoard = view.board;

  const sector = useHexBoardView(SECTOR, { spaces: view.spaces });

  const boardEdges = useMemo(
    () =>
      (staticBoard?.edges ?? []).filter((edge) =>
        edge.spaceIds.some((id) => SPACE_KINDS[id] === "land"),
      ),
    [staticBoard?.edges],
  );

  const boardVertices = useMemo(
    () =>
      (staticBoard?.vertices ?? []).filter((vertex) =>
        vertex.spaceIds.some((id) => SPACE_KINDS[id] === "land"),
      ),
    [staticBoard?.vertices],
  );

  const renderBoard = useMemo(
    () => ({
      ...sector,
      edges: boardEdges,
      vertices: boardVertices,
    }),
    [sector, boardEdges, boardVertices],
  );

  const portsByEdge = view.portsByEdgeId;
  const portEndpointsByVertex = useMemo(() => {
    const endpoints: Record<string, string> = {};
    for (const edge of boardEdges) {
      const portType = portsByEdge[edge.id];
      if (!portType) continue;

      for (const vertex of boardVertices) {
        const touchesRelayEdge = edge.spaceIds.every((spaceId) =>
          vertex.spaceIds.includes(spaceId),
        );
        if (touchesRelayEdge) {
          endpoints[vertex.id] = portType;
        }
      }
    }
    return endpoints;
  }, [boardEdges, boardVertices, portsByEdge]);

  const coloniesByVertex = view.coloniesByVertexId;
  const routesByEdge = view.routesByEdgeId;
  const raiderActive =
    view.raiderPending && view.discardPending.length === 0 && isMyTurn;
  const setupPlacedOutpost = view.setup?.placedOutpost ?? false;
  const showInteractiveVertices =
    gameplayPhase !== "setup" || !setupPlacedOutpost;
  const showInteractiveEdges =
    gameplayPhase !== "setup" || setupPlacedOutpost;

  return (
    <div
      className="relative flex h-full min-h-0 w-full overflow-hidden rounded-2xl"
      style={{
        backgroundColor: PAPER,
        backgroundImage: `radial-gradient(${PENCIL}26 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
        boxShadow:
          "0 12px 30px -14px rgba(45,45,45,0.22), inset 0 0 0 1px rgba(45,45,45,0.08)",
      }}
    >
      <HexGrid
        board={renderBoard}
        width="100%"
        height="100%"
        hexSize={STAR_SETTLERS_HEX_SIZE}
        enablePanZoom
        initialZoom={STAR_SETTLERS_INITIAL_ZOOM}
        interactiveVertices={board.targetLayers.vertex({
          enabled: isMyTurn && showInteractiveVertices,
          onError: onActionError,
        })}
        interactiveEdges={board.targetLayers.edge({
          enabled: isMyTurn && showInteractiveEdges,
          onError: onActionError,
        })}
        interactiveSpaces={board.targetLayers.space({
          enabled: raiderActive,
          onError: onActionError,
        })}
        interactiveVertexSize={14}
        interactiveEdgeSize={14}
        className="h-full w-full"
        renderTile={(tile, geometry) => {
          const terrain = tile.view.terrain;
          const numberToken = tile.view.numberToken;

          const outerPoints = geometry.points({ inset: TILE_OUTER_INSET });
          const innerPoints = geometry.points({ inset: TILE_INNER_INSET });

          if (terrain === "deepSpace") {
            // Muted paper margin. A few low-contrast pencil dots keep
            // the "star map" flavour without pulling focus from the
            // land tiles or from the port sticky notes that sit here.
            const stars = starPoints(tile.id, 4, 30);
            return (
              <g style={{ pointerEvents: "none" }}>
                <polygon
                  points={outerPoints}
                  fill={PAPER_MUTED}
                  stroke={`${PENCIL}1f`}
                  strokeWidth={1.2}
                />
                {stars.map((star, index) => (
                  <circle
                    key={index}
                    cx={star.x}
                    cy={star.y}
                    r={star.r}
                    fill={PENCIL}
                    opacity={0.22}
                  />
                ))}
              </g>
            );
          }

          const theme = TERRAIN_THEME[terrain];
          const isRaiderHere = tile.id === view.raiderSpaceId;
          const isRaiderTarget =
            raiderActive && board.eligible.space.has(tile.id);
          const tokenRotation = seededRotation(tile.id, 7, 4);

          return (
            <g>
              <polygon
                points={outerPoints}
                fill={theme.fill}
                stroke={isRaiderTarget ? ACCENT_RED : PENCIL}
                strokeWidth={isRaiderTarget ? 3 : 2.2}
                strokeLinejoin="round"
              />
              <polygon
                points={innerPoints}
                fill={theme.inner}
                opacity={0.75}
              />
              <text
                y={-16}
                textAnchor="middle"
                fontSize={20}
                style={{ pointerEvents: "none" }}
              >
                {theme.icon}
              </text>
              <text
                y={29}
                textAnchor="middle"
                fontSize={7}
                fill={PENCIL}
                fontWeight="700"
                letterSpacing="0.14em"
                fontFamily={HAND_FONT}
                opacity={0.7}
                style={{ pointerEvents: "none" }}
              >
                {theme.label.toUpperCase()}
              </text>
              {numberToken != null && (
                <g
                  style={{ pointerEvents: "none" }}
                  transform={`rotate(${tokenRotation})`}
                >
                  {/* Hard offset shadow — flat pencil-black, zero blur */}
                  <circle cx={2} cy={2} r={14} fill={PENCIL} opacity={0.9} />
                  <circle
                    r={14}
                    fill={POSTIT}
                    stroke={PENCIL}
                    strokeWidth={1.8}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={14}
                    fontWeight="bold"
                    fontFamily={HAND_FONT}
                    fill={PENCIL}
                  >
                    {numberToken}
                  </text>
                </g>
              )}
              {isRaiderHere && (
                <g style={{ pointerEvents: "none" }}>
                  <circle cx={2} cy={43} r={11} fill={PENCIL} opacity={0.9} />
                  <circle
                    cy={41}
                    r={11}
                    fill={POSTIT}
                    stroke={PENCIL}
                    strokeWidth={1.8}
                  />
                  <text y={44} textAnchor="middle" fontSize={12}>
                    ☄️
                  </text>
                </g>
              )}
            </g>
          );
        }}
        renderEdge={(edge, position) => {
          const route = routesByEdge[edge.id];
          const portType = portsByEdge[edge.id];
          if (!route && !portType) return null;
          const routeColor = route
            ? (players.get(route.ownerId)?.color ?? "#fff")
            : "#fff";
          const portLabel = portType
            ? (PORT_LABEL[portType] ?? portType)
            : null;
          const portTint = portType ? (PORT_TINT[portType] ?? POSTIT) : POSTIT;
          const portAccent = portType
            ? (PORT_ACCENT[portType] ?? PENCIL)
            : PENCIL;
          const [firstSpaceId, secondSpaceId] = [edge.hex1, edge.hex2];
          const deepSpaceDirection =
            secondSpaceId && spaceKind(secondSpaceId) === "deepSpace"
              ? 1
              : firstSpaceId && spaceKind(firstSpaceId) === "deepSpace"
                ? -1
                : 0;
          const deepSpaceAngleRad = (position.centerAngle * Math.PI) / 180;
          const portBadgeX =
            position.midX +
            Math.cos(deepSpaceAngleRad) *
              deepSpaceDirection *
              PORT_BADGE_OCEAN_OFFSET;
          const portBadgeY =
            position.midY +
            Math.sin(deepSpaceAngleRad) *
              deepSpaceDirection *
              PORT_BADGE_OCEAN_OFFSET;
          const noteRotation = portType
            ? seededRotation(edge.id, 3, 7)
            : 0;
          return (
            <g>
              {portType && portLabel && (
                <g data-port-edge={edge.id} style={{ pointerEvents: "none" }}>
                  {/* Pencil tick from edge midpoint out to the sticky note */}
                  <line
                    x1={position.midX}
                    y1={position.midY}
                    x2={portBadgeX}
                    y2={portBadgeY}
                    stroke={PENCIL}
                    strokeOpacity={0.55}
                    strokeWidth={1.2}
                    strokeDasharray="3 2"
                    strokeLinecap="round"
                  />
                  {/* Sticky note: hard offset shadow + rotated paper */}
                  <g
                    transform={`translate(${portBadgeX} ${portBadgeY}) rotate(${noteRotation})`}
                  >
                    <rect
                      x={-20 + 2}
                      y={-14 + 2}
                      width={40}
                      height={28}
                      rx={3}
                      fill={PENCIL}
                      opacity={0.9}
                    />
                    <rect
                      x={-20}
                      y={-14}
                      width={40}
                      height={28}
                      rx={3}
                      fill={portTint}
                      stroke={PENCIL}
                      strokeWidth={1.8}
                    />
                    {portType === "3:1" ? (
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        y={1}
                        fontSize={13}
                        fontWeight="bold"
                        fontFamily={HAND_FONT}
                        fill={PENCIL}
                      >
                        {portLabel}
                      </text>
                    ) : (
                      <>
                        <text
                          textAnchor="middle"
                          y={-2}
                          fontSize={11}
                          fontWeight="bold"
                          fontFamily={HAND_FONT}
                          fill={PENCIL}
                        >
                          {portLabel}
                        </text>
                        <text
                          textAnchor="middle"
                          y={9}
                          fontSize={8}
                          fontFamily={HAND_FONT}
                          fill={portAccent}
                        >
                          2:1
                        </text>
                      </>
                    )}
                  </g>
                </g>
              )}
              {route && (
                <rect
                  x={position.midX - 19}
                  y={position.midY - 4.5}
                  width={38}
                  height={9}
                  rx={3}
                  transform={`rotate(${position.edgeAngle} ${position.midX} ${position.midY})`}
                  fill={routeColor}
                  stroke={PENCIL}
                  strokeWidth={1.6}
                />
              )}
            </g>
          );
        }}
        renderVertex={(vertex, position) => {
          const building = coloniesByVertex[vertex.id];
          const portType = portEndpointsByVertex[vertex.id];
          const portAccent = portType
            ? (PORT_ACCENT[portType] ?? PENCIL)
            : null;

          if (!building) {
            // Tiny resource-coloured mark on port-adjacent vertices so
            // the "which two corners belong to this port" relationship
            // is still legible without the old ring halos.
            if (portAccent) {
              return (
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={2.8}
                  fill={portAccent}
                  stroke={PENCIL}
                  strokeWidth={0.8}
                  style={{ pointerEvents: "none" }}
                />
              );
            }
            return null;
          }

          const color = players.get(building.ownerId)?.color ?? "#fff";
          const isHub = building.kind === "hub";

          if (isHub) {
            const rotation = seededRotation(vertex.id, 5, 8);
            return (
              <g
                transform={`translate(${position.x} ${position.y}) rotate(${rotation})`}
              >
                <rect
                  x={-9 + 1.5}
                  y={-9 + 1.5}
                  width={18}
                  height={18}
                  rx={2}
                  fill={PENCIL}
                  opacity={0.85}
                />
                <rect
                  x={-9}
                  y={-9}
                  width={18}
                  height={18}
                  rx={2}
                  fill={color}
                  stroke={PENCIL}
                  strokeWidth={2}
                />
              </g>
            );
          }

          return (
            <g>
              <circle
                cx={position.x + 1.5}
                cy={position.y + 1.5}
                r={7}
                fill={PENCIL}
                opacity={0.85}
              />
              <circle
                cx={position.x}
                cy={position.y}
                r={7}
                fill={color}
                stroke={PENCIL}
                strokeWidth={1.8}
              />
            </g>
          );
        }}
        renderInteractiveEdge={(edge, position, state) => {
          if (!state.isEnabled || !state.isEligible) return null;
          const route = routesByEdge[edge.id];
          if (route) return null;
          const color =
            controllingPlayerId == null
              ? POSTIT
              : (players.get(controllingPlayerId)?.color ?? POSTIT);
          const transform = `rotate(${position.edgeAngle} ${position.midX} ${position.midY})`;
          if (state.isHovered) {
            return (
              <rect
                x={position.midX - 19}
                y={position.midY - 4.5}
                width={38}
                height={9}
                rx={3}
                transform={transform}
                fill={color}
                stroke={PENCIL}
                strokeWidth={1.6}
              />
            );
          }
          // Rest state: a faint pencil dash along the edge — a
          // designer's "you could build here" tick, not a shout.
          return (
            <line
              x1={position.midX - 12}
              y1={position.midY}
              x2={position.midX + 12}
              y2={position.midY}
              transform={transform}
              stroke={PENCIL}
              strokeOpacity={0.28}
              strokeWidth={1.4}
              strokeDasharray="3 3"
              strokeLinecap="round"
            />
          );
        }}
        renderInteractiveVertex={(_vertex, position, state) => {
          if (!state.isEnabled || !state.isEligible) return null;
          if (state.isHovered) {
            return (
              <g style={{ pointerEvents: "none" }}>
                <circle
                  cx={position.x + 1.5}
                  cy={position.y + 1.5}
                  r={10}
                  fill={PENCIL}
                  opacity={0.85}
                />
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={10}
                  fill={POSTIT}
                  stroke={PENCIL}
                  strokeWidth={2}
                />
              </g>
            );
          }
          // Rest state: a small hollow pencil tick. Readable but
          // recedes behind the land tiles and built pieces.
          return (
            <circle
              cx={position.x}
              cy={position.y}
              r={3}
              fill={PAPER}
              stroke={PENCIL}
              strokeWidth={1.3}
              style={{ pointerEvents: "none" }}
            />
          );
        }}
      />
    </div>
  );
}
