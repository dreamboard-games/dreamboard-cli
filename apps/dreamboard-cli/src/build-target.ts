declare const __DREAMBOARD_BUILD_CHANNEL__: string | undefined;

const injectedBuildChannel =
  typeof __DREAMBOARD_BUILD_CHANNEL__ === "string"
    ? __DREAMBOARD_BUILD_CHANNEL__
    : undefined;

export const BUILD_CHANNEL =
  injectedBuildChannel === "published" ? "published" : "development";

export const IS_PUBLISHED_BUILD = BUILD_CHANNEL === "published";
export const PUBLISHED_ENVIRONMENT = "prod" as const;
