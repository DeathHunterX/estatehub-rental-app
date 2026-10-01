import dotenv from "dotenv";

dotenv.config({
    path:
        process.env.NODE_ENV === "production" ? ".env" : [".env.local", ".env"],
    quiet: true,
});

// Existing local installations use DB_URL while Prisma expects DATABASE_URL.
process.env.DATABASE_URL ||= process.env.DB_URL;

const config = {
    env: process.env.NODE_ENV ?? "development",
    clientUrl: process.env.CLIENT_URL ?? "localhost:3000",
    port: Number(process.env.PORT) || 3000,
    debug: process.env.APP_DEBUG! === "true",
    db: {
        url: process.env.DATABASE_URL!,
    },
    jwt: {
        accessTokenSecret:
            process.env.JWT_ACCESS_TOKEN_SECRET ?? "access-token-secret",
        refreshTokenSecret:
            process.env.JWT_REFRESH_TOKEN_SECRET ?? "refresh-token-secret",
    },
};

export default config;
