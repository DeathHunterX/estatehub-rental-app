import type { Metadata } from "next";
import PolicyDocument from "@/features/policies/components/policy-document";
import { readPublicPolicy } from "@/features/policies/lib/policy-source";

export const metadata: Metadata = {
    title: "Cookie Policy | EstateHub",
    robots: { index: false, follow: true },
};

export default function CookiesPage() {
    return <PolicyDocument markdown={readPublicPolicy("cookies")} />;
}
