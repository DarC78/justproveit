import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // ✅ Framework-specific override for Next.js Document
  {
    files: ["src/pages/_document.tsx"],
    rules: {
      // These components are framework-internal, not normal React components
      "react/no-unknown-property": "off",
      "react/react-in-jsx-scope": "off",

      // TypeScript rules that break next/document
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-wrapper-object-types": "off",
    },
  },
]);

export default eslintConfig;