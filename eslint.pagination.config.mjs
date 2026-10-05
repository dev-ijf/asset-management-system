import parser from "@typescript-eslint/parser";
import plugin from "@typescript-eslint/eslint-plugin";

export default [{
  files: [
    "src/lib/pagination.ts",
    "src/components/tables/pagination.tsx",
    "src/components/master/*-page.tsx",
    "src/components/security/security-management-client.tsx",
    "src/app/(dashboard)/dashboard/{assets,approvals,maintenance,users,roles,permissions}/page.tsx",
    "src/app/(dashboard)/dashboard/master/[masterPage]/page.tsx",
    "src/app/(dashboard)/dashboard/transactions/*/page.tsx",
    "src/app/(dashboard)/dashboard/reports/assets/page.tsx",
  ],
  languageOptions: { parser, parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } } },
  plugins: { "@typescript-eslint": plugin },
  rules: { ...plugin.configs.recommended.rules, "no-unused-vars": "off", "no-undef": "off" },
}];
