import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async headers() {
        return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
    },
    /* config options here */
    turbopack: {
        root: process.cwd(),
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "http",
                hostname: "**",
                port: "",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;
