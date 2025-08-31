const config = {
    env: process.env.NODE_ENV ?? "development",
    clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
    socketPort: Number(process.env.SOCKET_PORT) || 4000,
};

export default config;
