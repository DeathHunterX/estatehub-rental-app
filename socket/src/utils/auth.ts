import { createHmac, timingSafeEqual } from "node:crypto";

type AccessClaims = { id: string; exp: number; nbf?: number };

export const verifyAccessToken = (
    token: unknown,
    secret: string
): AccessClaims | null => {
    if (typeof token !== "string" || token.length > 8192 || !secret)
        return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    try {
        const [headerPart, payloadPart, signaturePart] = parts;
        const header = JSON.parse(
            Buffer.from(headerPart, "base64url").toString("utf8")
        );
        if (header?.alg !== "HS256") return null;

        const expected = createHmac("sha256", secret)
            .update(`${headerPart}.${payloadPart}`)
            .digest();
        const actual = Buffer.from(signaturePart, "base64url");
        if (
            actual.length !== expected.length ||
            !timingSafeEqual(actual, expected)
        )
            return null;

        const payload = JSON.parse(
            Buffer.from(payloadPart, "base64url").toString("utf8")
        );
        const now = Math.floor(Date.now() / 1000);
        if (
            typeof payload?.id !== "string" ||
            !payload.id ||
            typeof payload.exp !== "number" ||
            payload.exp <= now ||
            (payload.nbf !== undefined &&
                (typeof payload.nbf !== "number" || payload.nbf > now))
        ) {
            return null;
        }
        return { id: payload.id, exp: payload.exp, nbf: payload.nbf };
    } catch {
        return null;
    }
};
