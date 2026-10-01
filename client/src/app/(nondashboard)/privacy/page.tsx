import type { Metadata } from "next";
import PolicyDocument from "@/features/policies/components/policy-document";
import { readPublicPolicy } from "@/features/policies/lib/policy-source";

export const metadata: Metadata = { title: "Privacy Policy | EstateHub", robots: { index: false, follow: true } };
export default function PolicyPage() { return <PolicyDocument markdown={readPublicPolicy("privacy")} />; }
