import { createInterface } from "node:readline/promises";

/**
 * Ask the user for a yes/no confirmation.
 *
 * Returns true only for explicit yes answers.
 */
export async function confirmPrompt(message: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await rl.question(`${message} (y/N): `);
    const normalized = answer.trim().toLowerCase();
    return normalized === "y" || normalized === "yes";
  } finally {
    rl.close();
  }
}
