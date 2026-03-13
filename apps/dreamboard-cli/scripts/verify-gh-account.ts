import { spawnSync } from "node:child_process";

const expectedAccount = "ctan1345";

const result = spawnSync("gh", ["auth", "status"], {
  encoding: "utf8",
});

if (result.error) {
  throw result.error;
}

const output = `${result.stdout}\n${result.stderr}`;
if (result.status !== 0) {
  throw new Error(output.trim() || "gh auth status failed");
}

const sections = output
  .split(/\n(?=\s*[✓X-] Logged in to github\.com account )/)
  .map((section) => section.trim())
  .filter(Boolean);

const matchingSection = sections.find((section) =>
  section.includes(`Logged in to github.com account ${expectedAccount}`),
);

if (!matchingSection) {
  throw new Error(
    `GitHub CLI is not logged into github.com as ${expectedAccount}. Run 'gh auth login' or 'gh auth switch -u ${expectedAccount}'.`,
  );
}

if (!matchingSection.includes("Active account: true")) {
  throw new Error(
    `GitHub CLI account ${expectedAccount} is not active. Run 'gh auth switch -u ${expectedAccount}' before creating PRs or releases.`,
  );
}

process.stdout.write(
  `gh auth status is using github.com account ${expectedAccount}.\n`,
);
