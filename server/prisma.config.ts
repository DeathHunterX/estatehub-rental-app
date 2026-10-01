import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({
    path: process.env.NODE_ENV === "production" ? ".env" : [".env.local", ".env"],
    quiet: true,
});
process.env.DATABASE_URL ||= process.env.DB_URL;

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "ts-node prisma/seed.ts",
    },
});
