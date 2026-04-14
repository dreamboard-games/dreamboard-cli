export function getPublishedPackageFiles(
  hasPublicSkillRoot: boolean,
): string[] {
  return hasPublicSkillRoot
    ? ["dist", "README.md", "skills"]
    : ["dist", "README.md"];
}
