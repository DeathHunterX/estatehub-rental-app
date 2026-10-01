import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { extractPublicPolicy } from "./public-policy";

const files = {
    terms: "estatehub-terms-of-service-public-en.md",
    privacy: "estatehub-privacy-policy-public-en.md",
    cookies: "estatehub-cookie-policy-public-en.md",
    refund: "estatehub-refund-cancellation-policy-public-en.md",
} as const;

export type PolicyKey = keyof typeof files;

export const readPublicPolicy = (key: PolicyKey): string => {
    const directory = resolve(process.cwd(), "..", "docs", "legal");
    return extractPublicPolicy(readFileSync(join(directory, files[key]), "utf8"));
};
