import parser from "@typescript-eslint/parser";
import plugin from "@typescript-eslint/eslint-plugin";

export default [{
  files: [
    "src/components/ui/{toast-provider,confirm-dialog}.tsx",
    "src/components/master/{master-form-feedback,master-crud-client,asset-categories-client,asset-locations-client,asset-statuses-client}.tsx",
    "src/components/assets/{asset-form-client,asset-bulk-client,asset-photo-section}.tsx",
    "src/components/security/security-management-client.tsx",
    "src/components/transactions/transaction-forms.tsx",
    "src/components/approvals/approval-actions-client.tsx",
    "src/app/(dashboard)/dashboard/layout.tsx",
  ],
  languageOptions: { parser, parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } } },
  plugins: { "@typescript-eslint": plugin },
  rules: { ...plugin.configs.recommended.rules, "no-unused-vars": "off", "no-undef": "off" },
}];
