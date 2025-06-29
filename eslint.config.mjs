import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Base Next.js recommended configs
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Disable specific rules for Prisma generated files
  {
    files: ["lib/generated/prisma/**/*.{ts,js}"], // Adjust path if generated files live elsewhere
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },

  // Optionally, you can globally ignore the entire generated folder:
  {
    ignores: ["lib/generated/prisma/**"],
  },
];

export default eslintConfig;
