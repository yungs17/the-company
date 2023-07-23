module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  extends: ["standard", "plugin:prettier/recommended", "plugin:node/recommended", "prettier"],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
  },
  rules: {
    "node/no-unsupported-features/es-syntax": ["error", { ignores: ["modules", "dynamicImport"] }],
    "node/no-missing-import": ["off"],
    "prettier/prettier": ["error"],
  },
  plugins: ["prettier"],
};
