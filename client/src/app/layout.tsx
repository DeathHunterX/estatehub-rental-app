import type { Metadata } from "next";
import Providers from "../providers";
import "./globals.css";

export const metadata: Metadata = {
    title: "EstateHub | Find your next home",
    description: "Find rental homes and manage your rental journey with EstateHub.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                suppressHydrationWarning={true}
                className="antialiased"
            >
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
