import { setupProfiles, shuffle } from "../shared/manifest-contract";

export default setupProfiles({
  standard: {
    initialPhase: "setup",
    bootstrap: [
      // Shuffle the tech card deck
      shuffle({
        type: "sharedZone",
        zoneId: "tech-deck",
      }),
    ],
  },
});
