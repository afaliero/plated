const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const tseslint = require("typescript-eslint");

/**
 * Parent-relative imports are banned in favour of the "@/" alias defined in
 * each workspace's tsconfig paths. Same-directory "./foo" stays legal — it's
 * unambiguous, and packages/shared depends on it (see its index.ts: that
 * package ships raw TS consumed by both Metro and tsx, so its internal
 * imports are deliberately bare and relative).
 */
const noParentRelativeImports = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: ["../*", "../**"],
          message:
            'Use the "@/" alias instead of a parent-relative import (see "paths" in tsconfig.json).',
        },
      ],
    },
  ],
};

module.exports = defineConfig([
  {
    ignores: [
      "**/node_modules/**",
      "**/.expo/**",
      "**/dist/**",
      "**/build/**",
      "apps/mobile/assets/**",
      "apps/api/types/**",
    ],
  },

  // Backend and shared schemas: plain TypeScript, no React.
  {
    files: ["apps/api/**/*.ts", "packages/shared/**/*.ts"],
    extends: [tseslint.configs.recommended],
    rules: {
      ...noParentRelativeImports,
    },
  },

  // Mobile: Expo's config brings the React Native, React and hooks plugins.
  {
    files: ["apps/mobile/**/*.{ts,tsx}"],
    extends: [expoConfig],
    settings: {
      // Teaches import/no-unresolved about the "@/*" alias, so it validates
      // aliased paths instead of reporting every one as missing.
      "import/resolver": {
        typescript: { project: "apps/mobile/tsconfig.json" },
      },
    },
    rules: {
      ...noParentRelativeImports,
      // Expo ships this as a warning. Promote it: a hook with an incomplete
      // dep array reads stale props/state, which is a bug, not a style nit.
      "react-hooks/exhaustive-deps": "error",
    },
  },
]);
