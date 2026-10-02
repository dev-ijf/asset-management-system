import parser from "@typescript-eslint/parser";
import plugin from "@typescript-eslint/eslint-plugin";

export default [{
  files: ["src/lib/asset-bulk*.ts", "src/components/assets/asset-bulk-client.tsx", "src/components/tables/data-table.tsx", "src/app/(dashboard)/dashboard/assets/bulk-actions.ts", "src/app/(dashboard)/dashboard/assets/page.tsx", "scripts/asset-bulk.test.ts"],
  languageOptions: { parser, parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } } },
  plugins: { "@typescript-eslint": plugin },
  rules: { ...plugin.configs.recommended.rules, "no-unused-vars": "off", "no-undef": "off" },
}];
