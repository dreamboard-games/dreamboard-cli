import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const resolveLocal = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      {
        find: /^react$/,
        replacement: resolveLocal("./node_modules/react/index.js"),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: resolveLocal("./node_modules/react/jsx-runtime.js"),
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: resolveLocal("./node_modules/react/jsx-dev-runtime.js"),
      },
      {
        find: /^react-dom$/,
        replacement: resolveLocal("./node_modules/react-dom/index.js"),
      },
      {
        find: /^react-dom\/client$/,
        replacement: resolveLocal("./node_modules/react-dom/client.js"),
      },
    ],
  },
});
