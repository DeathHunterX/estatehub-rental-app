const config = {
    env: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT) || 3000,
    debug: process.env.APP_DEBUG! === "true",
    db: {
        url: process.env.DB_URL!,
    },
    jwt: {
        accessTokenSecret:
            process.env.JWT_ACCESS_TOKEN_SECRET ?? "access-token-secret",
        refreshTokenSecret:
            process.env.JWT_REFRESH_TOKEN_SECRET ?? "refresh-token-secret",
    },
};

export default config;
