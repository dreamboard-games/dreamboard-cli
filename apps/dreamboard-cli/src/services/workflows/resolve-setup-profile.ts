import { loadManifest } from "../project/local-files.js";

export async function resolveSetupProfileIdForSession(options: {
  projectRoot: string;
  requestedSetupProfileId?: string;
}): Promise<string | null> {
  const manifest = await loadManifest(options.projectRoot);
  const setupProfiles = manifest.setupProfiles ?? [];
  const requestedSetupProfileId =
    options.requestedSetupProfileId?.trim() || undefined;

  if (requestedSetupProfileId) {
    const requestedProfile = setupProfiles.find(
      (profile) => profile.id === requestedSetupProfileId,
    );
    if (!requestedProfile) {
      const knownProfiles = setupProfiles
        .map((profile) => profile.id)
        .join(", ");
      throw new Error(
        setupProfiles.length === 0
          ? `Unknown setup profile '${requestedSetupProfileId}'. The manifest defines no setup profiles.`
          : `Unknown setup profile '${requestedSetupProfileId}'. Expected one of: ${knownProfiles}.`,
      );
    }
    return requestedProfile.id;
  }

  if (setupProfiles.length === 0) {
    return null;
  }

  if (setupProfiles.length === 1) {
    return setupProfiles[0]?.id ?? null;
  }

  const knownProfiles = setupProfiles.map((profile) => profile.id).join(", ");
  throw new Error(
    `This manifest defines multiple setup profiles. Pass --setup-profile with one of: ${knownProfiles}.`,
  );
}
