import parser from "@typescript-eslint/parser";
import plugin from "@typescript-eslint/eslint-plugin";

export default [{
  files: [
    "src/app/(dashboard)/dashboard/archive/**/*.ts",
    "src/app/(dashboard)/dashboard/archive/**/*.tsx",
    "src/app/(dashboard)/dashboard/assets/actions.ts",
    "src/app/(dashboard)/dashboard/assets/page.tsx",
    "src/app/(dashboard)/dashboard/assets/[[]id[]]/page.tsx",
    "src/app/(dashboard)/dashboard/reports/assets/export/route.ts",
    "src/components/assets/archive-table-client.tsx",
    "src/components/assets/asset-form-client.tsx",
    "src/components/assets/asset-bulk-client.tsx",
    "src/components/ui/confirm-dialog.tsx",
    "src/lib/asset-history.ts",
  ],
  languageOptions: { parser, parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } } },
  plugins: { "@typescript-eslint": plugin },
  rules: { ...plugin.configs.recommended.rules, "no-unused-vars": "off", "no-undef": "off" },
}];
