// Minimal flat config (Phase 0). TypeScript correctness is enforced by `tsc`
// (`npm run typecheck`); ESLint here lints plain JS/MJS tooling files only.
export default [
  {
    ignores: ["**/dist/**", "**/.next/**", "**/node_modules/**", "**/*.ts", "**/*.tsx"],
  },
];
