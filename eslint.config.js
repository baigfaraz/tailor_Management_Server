const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  { ignores: ["node_modules/", "coverage/", "docs/"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
  },
  {
    files: ["test/**/*.js", "**/*.mjs"],
    languageOptions: { sourceType: "module", globals: { ...globals.node } },
  },
];
