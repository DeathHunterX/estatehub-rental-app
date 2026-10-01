"use client";

// Libraries
import { FileDown, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Components
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Libs
import { decryptSignature } from "@/features/signing/lib/signature-vault";

// Types
import type { Lease } from "@/types/prisma";
import type { ManagerSigningProfile } from "@/features/signing/types/signing-profile";

export default function LeaseAgreementButton({ lease, propertyName, address, profile }: {
    lease: Lease;
    propertyName: string;
    address: string;
    profile: ManagerSigningProfile | null;
}) {
    const [open, setOpen] = useState(false);
    const [passphrase, setPassphrase] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const hasSignature = Boolean(profile?.signatureCiphertext && profile.signatureSalt && profile.signatureIv);
    const download = async (signed: boolean) => {
        setError("");
        setBusy(true);
        try {
            const signatureDataUrl = signed && profile?.signatureCiphertext && profile.signatureSalt && profile.signatureIv
                ? await decryptSignature({ signatureCiphertext: profile.signatureCiphertext, signatureSalt: profile.signatureSalt, signatureIv: profile.signatureIv }, passphrase)
                : undefined;
            const { downloadLeaseAgreementPdf } = await import("@/features/leases/lib/lease-agreement-pdf");
            await downloadLeaseAgreementPdf({
                leaseId: lease.id, propertyName, address,
                tenantName: lease.tenant.user.name,
                tenantEmail: lease.tenant.user.email,
                tenantPhone: lease.tenant.user.phoneNumber ?? undefined,
                managerName: profile?.legalName ?? "",
                managerTitle: profile?.title ?? "",
                startDate: lease.startDate, endDate: lease.endDate,
                rent: lease.rent, deposit: lease.deposit,
                notes: profile?.agreementNotes ?? "",
                signatureDataUrl,
            });
            setOpen(false);
            setPassphrase("");
        } catch (reason) { setError(signed ? "Could not unlock the signature. Check the passphrase and try again." : reason instanceof Error ? reason.message : "Could not create the PDF."); }
        finally { setBusy(false); }
    };
    return <>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1 whitespace-nowrap"><FileDown className="size-4" /> Agreement PDF</Button>
        <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) { setPassphrase(""); setError(""); } }}>
            <DialogContent className="max-w-md border-border bg-card text-card-foreground">
                <DialogHeader><DialogTitle>Download agreement draft</DialogTitle><DialogDescription>The PDF contains the lease record and proposed terms. The tenant signature remains blank until a separate signing process is completed.</DialogDescription></DialogHeader>
                <div className="space-y-4 text-sm">
                    <p className="rounded-lg border border-border bg-muted/50 p-3 text-muted-foreground">An uploaded manager signature is a visual mark. This PDF is not a cryptographically signed or legally verified agreement.</p>
                    {!profile && <p className="text-muted-foreground">Set your legal name and terms in <Link href="/managers/settings" className="font-semibold text-primary underline">manager settings</Link> before sharing a draft.</p>}
                    {hasSignature && <div><Label htmlFor={`lease-signature-passphrase-${lease.id}`} className="flex items-center gap-2"><LockKeyhole className="size-4" /> Signature passphrase</Label><Input id={`lease-signature-passphrase-${lease.id}`} type="password" autoComplete="off" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} className="mt-2" /></div>}
                    {error && <p role="alert" className="text-destructive">{error}</p>}
                    <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => void download(false)}>{busy ? "Preparing..." : "Unsigned draft"}</Button>{hasSignature && <Button disabled={busy || !passphrase} onClick={() => void download(true)}>Unlock & download</Button>}</div>
                </div>
            </DialogContent>
        </Dialog>
    </>;
}
