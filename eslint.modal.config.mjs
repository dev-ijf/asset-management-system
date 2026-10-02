import parser from "@typescript-eslint/parser";
import plugin from "@typescript-eslint/eslint-plugin";

export default [{
  files: ["src/components/master/master-record-form.tsx"],
  languageOptions: {
    parser,
    parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
  },
  plugins: { "@typescript-eslint": plugin },
  rules: {
    ...plugin.configs.recommended.rules,
    "no-unused-vars": "off",
    "no-undef": "off",
  },
}];
