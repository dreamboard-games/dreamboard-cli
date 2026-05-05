import { asPlayerId } from "@dreamboard/app-sdk/reducer";
import { createReducerBundle } from "@dreamboard/app-sdk/reducer";
import game from "./game";
import {
  boardHelpers,
  createInitialTable,
  literals,
  ids,
  manifestContract,
  type BoardState,
  type BoardSpaceFields,
  type BoardSpaceState,
} from "../shared/manifest-contract";

const bundle = createReducerBundle(game);
const firstPlayer = literals.playerIds[0] ?? asPlayerId("player-1");
const defaultZones = manifestContract.defaults.zones(literals.playerIds);
const defaultHands = manifestContract.defaults.hands(literals.playerIds);
const defaultResources = manifestContract.defaults.resources(
  literals.playerIds,
);
const initialTable = createInitialTable({ playerIds: literals.playerIds });
type FirstBoardId = (typeof literals.boardIds)[number];
const firstBoardId = (literals.boardIds as readonly string[])[0];
type FirstBoardState = BoardState<FirstBoardId>;
type FirstBoardSpaceState = BoardSpaceState<FirstBoardId>;
type FirstBoardSpaceFields = BoardSpaceFields<FirstBoardId>;
const firstBoardSpaceTypeLookup =
  firstBoardId == null
    ? null
    : boardHelpers.spaceKinds(firstBoardId as FirstBoardId);
const firstBoardSpaceType =
  firstBoardSpaceTypeLookup == null
    ? null
    : (Object.values(firstBoardSpaceTypeLookup)[0] ?? null);

ids.playerId.parse(firstPlayer);

void bundle;
void defaultZones.shared;
void defaultHands;
void defaultResources;
void initialTable;
void manifestContract.tableSchema;
void manifestContract;
void firstBoardSpaceType;
void (null as FirstBoardState | null);
void (null as FirstBoardSpaceState | null);
void (null as FirstBoardSpaceFields | null);
