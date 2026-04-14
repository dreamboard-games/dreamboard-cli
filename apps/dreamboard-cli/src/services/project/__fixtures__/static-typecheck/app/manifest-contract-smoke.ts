import { createReducerBundle } from "@dreamboard/app-sdk/reducer/bundle";
import game from "./game";
import { literals, ids, manifestContract } from "../shared/manifest-contract";

const bundle = createReducerBundle(game);
const firstPlayer = literals.playerIds[0] ?? "player-1";
const defaultZones = manifestContract.defaults.zones(literals.playerIds);
const defaultHands = manifestContract.defaults.hands(literals.playerIds);
const defaultResources = manifestContract.defaults.resources(
  literals.playerIds,
);

ids.playerId.parse(firstPlayer);

void bundle;
void defaultZones.shared;
void defaultHands;
void defaultResources;
void manifestContract.tableSchema;
void manifestContract;
