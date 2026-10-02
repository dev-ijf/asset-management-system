import parser from "@typescript-eslint/parser";
import plugin from "@typescript-eslint/eslint-plugin";

export default [{
  files: ["src/lib/asset-image.ts", "src/lib/google-drive.ts", "src/lib/asset-photo-storage.ts",
    "src/components/assets/*.tsx", "src/app/(dashboard)/dashboard/assets/*.ts", "src/app/(dashboard)/dashboard/assets/*.tsx",
    "src/app/(dashboard)/dashboard/assets/[[]id[]]/page.tsx", "src/app/api/assets/**/*.ts", "scripts/cleanup-drive-photos.ts", "scripts/setup-drive-storage.ts"],
  languageOptions: { parser, parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } } },
  plugins: { "@typescript-eslint": plugin },
  rules: { ...plugin.configs.recommended.rules, "no-unused-vars": "off", "no-undef": "off" },
}];
