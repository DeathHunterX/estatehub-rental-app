import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        rules: {
            "react-hooks/set-state-in-effect": "warn",
            "react-hooks/refs": "warn",
            "react-hooks/purity": "warn",
        },
    },
    {
        files: ["src/components/shared/form-field.tsx"],
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
    globalIgnores([
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
        "src/types/prisma.d.ts",
    ]),
]);
