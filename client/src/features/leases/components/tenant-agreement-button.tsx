"use client";

import { Button } from "@/components/ui/button";
import { useLazyGetLeaseAgreementDraftQuery } from "@/lib/api/api";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function TenantAgreementButton({
    leaseId,
}: {
    leaseId: number;
}) {
    const [getDraft] = useLazyGetLeaseAgreementDraftQuery();
    const [downloading, setDownloading] = useState(false);

    const download = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            const draft = await getDraft(leaseId).unwrap();
            const { downloadLeaseAgreementPdf } =
                await import("@/features/leases/lib/lease-agreement-pdf");
            await downloadLeaseAgreementPdf(draft);
        } catch {
            toast.error(
                "Could not download the agreement draft. Please try again."
            );
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            onClick={download}
            disabled={downloading}
            className="gap-2"
        >
            {downloading ? (
                <Loader2 className="size-4 animate-spin" />
            ) : (
                <Download className="size-4" />
            )}
            {downloading
                ? "Preparing PDF..."
                : "Download agreement draft (PDF)"}
        </Button>
    );
}
