import tseslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";


export default [
  {
    files: ["src/**/*.ts"],
    ignores: ["dist", "node_modules"],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "single"],
      "no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
];
