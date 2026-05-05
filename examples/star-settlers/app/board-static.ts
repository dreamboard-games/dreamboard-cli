import type { GameContract } from "./game-contract";
import { defineStaticView } from "@dreamboard/app-sdk/reducer";

export const boardStatic = defineStaticView<GameContract>()({
  project: ({ q }) => {
    return q.board.hex("sector");
  },
});
