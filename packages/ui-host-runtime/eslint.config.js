import { config } from "@dreamboard/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    files: ["src/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["src/**/__fixtures__/**/*.tsx", "src/**/__fixtures__/**/*.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "no-console": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
];
