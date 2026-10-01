import type { Metadata } from "next";
import PolicyDocument from "@/features/policies/components/policy-document";
import { readPublicPolicy } from "@/features/policies/lib/policy-source";

export const metadata: Metadata = {
    title: "Refund & Cancellation Policy | EstateHub",
    robots: { index: false, follow: true },
};

export default function RefundCancellationPage() {
    return <PolicyDocument markdown={readPublicPolicy("refund")} />;
}
