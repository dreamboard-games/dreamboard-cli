import { config } from "@dreamboard/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    // Fixture files use Cosmos's object-export pattern with quoted fixture names,
    // which ESLint doesn't recognize as React components. Hooks and console usage
    // are expected in these development-only files.
    files: ["src/**/__fixtures__/**/*.tsx", "src/**/__fixtures__/**/*.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "no-console": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
];

