import dotenv from "dotenv";

dotenv.config({
    path: process.env.NODE_ENV === "production" ? ".env" : [".env.local", ".env", "../server/.env.local"],
    quiet: true,
});

const config = {
    env: process.env.NODE_ENV ?? "development",
    clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
    socketPort: Number(process.env.SOCKET_PORT) || 4000,
    accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
    apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:5000/api",
};

export default config;
