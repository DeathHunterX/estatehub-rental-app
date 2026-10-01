"use client";

// Libraries
import { FileCheck2, LockKeyhole } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";

// Components
import PageSkeleton from "@/components/shared/page-skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// APIs
import { useGetManagerSigningProfileQuery, useUpdateManagerSigningProfileMutation } from "@/lib/api/api";

// Libs
import { decryptSignature, encryptSignature } from "@/features/signing/lib/signature-vault";

// Types
import type { ManagerSigningProfile } from "@/features/signing/types/signing-profile";

const resizeSignature = async (file: File) => {
    if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2_000_000) throw new Error("Choose a PNG or JPEG image smaller than 2 MB.");
    const bitmap = await createImageBitmap(file);
    try {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 200;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Image processing is unavailable.");
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / bitmap.width, canvas.height / bitmap.height);
        const width = bitmap.width * scale;
        const height = bitmap.height * scale;
        context.drawImage(bitmap, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        const png = canvas.toDataURL("image/png");
        return png.length <= 55000 ? png : canvas.toDataURL("image/jpeg", 0.78);
    } finally {
        bitmap.close();
    }
};

function SigningSetupForm({ profile }: { profile: ManagerSigningProfile | null }) {
    const [legalName, setLegalName] = useState(profile?.legalName ?? "");
    const [title, setTitle] = useState(profile?.title ?? "");
    const [agreementNotes, setAgreementNotes] = useState(profile?.agreementNotes ?? "");
    const [image, setImage] = useState<string | null>(null);
    const [verifiedImage, setVerifiedImage] = useState<string | null>(null);
    const [passphrase, setPassphrase] = useState("");
    const [acceptPrivacy, setAcceptPrivacy] = useState(Boolean(profile?.acceptedPrivacyAt));
    const [acceptSharing, setAcceptSharing] = useState(Boolean(profile?.acceptedSharingAt));
    const [busy, setBusy] = useState(false);
    const [updateProfile] = useUpdateManagerSigningProfileMutation();
    const hasStoredSignature = Boolean(profile?.signatureCiphertext && profile.signatureSalt && profile.signatureIv);

    const chooseImage = async (file: File | undefined) => {
        if (!file) return;
        try { setImage(await resizeSignature(file)); setVerifiedImage(null); }
        catch (error) { toast.error(error instanceof Error ? error.message : "Could not read signature image."); }
    };

    const verify = async () => {
        if (!profile?.signatureCiphertext || !profile.signatureSalt || !profile.signatureIv) return;
        setBusy(true);
        try {
            const plaintext = await decryptSignature({ signatureCiphertext: profile.signatureCiphertext, signatureSalt: profile.signatureSalt, signatureIv: profile.signatureIv }, passphrase);
            setVerifiedImage(plaintext);
            toast.success("Encrypted signature verified.");
        } catch { toast.error("Passphrase is incorrect or the signature cannot be verified."); }
        finally { setBusy(false); setPassphrase(""); }
    };

    const save = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (legalName.trim().length < 2) return toast.error("Enter the signer's legal name.");
        if (agreementNotes.trim().length < 10) return toast.error("Enter the lease agreement terms (at least 10 characters).");
        if (!image && !hasStoredSignature) return toast.error("Add a manager signature to finish setup.");
        if (!acceptPrivacy || !acceptSharing) return toast.error("Acknowledge both privacy and information-sharing terms.");
        setBusy(true);
        try {
            const encrypted = image ? await encryptSignature(image, passphrase) : {};
            if (image && await decryptSignature(encrypted as Awaited<ReturnType<typeof encryptSignature>>, passphrase) !== image) throw new Error("Signature verification failed.");
            await updateProfile({ legalName: legalName.trim(), title: title.trim(), agreementNotes: agreementNotes.trim(), acceptPrivacy, acceptSharing, ...encrypted }).unwrap();
            setImage(null);
            setVerifiedImage(null);
            setPassphrase("");
            toast.success(image ? "Encrypted signature and agreement settings saved." : "Agreement settings saved.");
        } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save agreement settings."); }
        finally { setBusy(false); }
    };

    return (
        <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-8" aria-labelledby="agreement-setup-title">
            <div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 size-5 text-primary" /><div><h2 id="agreement-setup-title" className="text-lg font-semibold">Lease agreement setup</h2><p className="mt-1 text-sm text-muted-foreground">Add your legal identity, agreement terms and encrypted signature. Complete both acknowledgements to create properties and approve applications.</p></div></div>
            <form className="mt-6 space-y-5" onSubmit={save}>
                <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="signing-legal-name">Signer legal name</Label><Input id="signing-legal-name" value={legalName} onChange={(event) => setLegalName(event.target.value)} maxLength={120} required className="mt-2" /></div><div><Label htmlFor="signing-title">Title or capacity</Label><Input id="signing-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Property manager / owner" className="mt-2" /></div></div>
                <div><Label htmlFor="agreement-notes">Lease agreement terms</Label><Textarea id="agreement-notes" value={agreementNotes} onChange={(event) => setAgreementNotes(event.target.value)} minLength={10} maxLength={2000} rows={4} required placeholder="Utilities, maintenance, house rules, payment arrangements..." className="mt-2" /><p className="mt-1 text-xs text-muted-foreground">These terms appear in each draft PDF. Review them with the tenant before signing.</p></div>
                <div className="rounded-xl border border-border bg-background p-4"><div className="flex items-center gap-2"><LockKeyhole className="size-4 text-primary" /><h3 className="font-semibold">Manager signature image</h3></div><p className="mt-2 text-sm text-muted-foreground">The image is encrypted in your browser with AES-GCM before storage. Your passphrase is never sent to the server and cannot be recovered.</p>
                    <label className="mt-4 block text-sm font-medium" htmlFor="signing-image">Choose a PNG or JPEG signature</label><Input id="signing-image" type="file" accept="image/png,image/jpeg" className="mt-2" onChange={(event) => void chooseImage(event.target.files?.[0])} />
                    {(image || verifiedImage) && <div className="relative mt-4 h-28 max-w-sm overflow-hidden rounded-lg border border-border bg-white"><Image src={image || verifiedImage || ""} alt="Signature preview" fill unoptimized sizes="384px" className="object-contain" /></div>}
                    <p className="mt-3 text-xs text-muted-foreground">{hasStoredSignature ? `Encrypted signature saved${profile?.signatureUpdatedAt ? ` on ${new Date(profile.signatureUpdatedAt).toLocaleDateString()}` : ""}.` : "A signature is required to finish setup."}</p>
                    {(image || hasStoredSignature) && <div className="mt-4 max-w-md"><Label htmlFor="signing-passphrase">{image ? "New signature passphrase (at least 12 characters)" : "Passphrase to verify stored signature"}</Label><Input id="signing-passphrase" type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} autoComplete="new-password" className="mt-2" />{hasStoredSignature && !image && <Button type="button" variant="outline" className="mt-3" onClick={() => void verify()} disabled={!passphrase || busy}>Verify encrypted signature</Button>}</div>}
                </div>
                <div className="space-y-3 rounded-xl border border-border bg-background p-4 text-sm text-foreground">
                    <p className="font-semibold">Privacy and information sharing</p>
                    <label className="flex cursor-pointer items-start gap-3"><Checkbox checked={acceptPrivacy} onCheckedChange={(checked) => setAcceptPrivacy(checked === true)} aria-label="Acknowledge privacy responsibilities" className="mt-0.5" /><span>I will use applicant contact details, messages and payment information only to review applications, prepare leases and manage the tenancy; I will protect that information and restrict access to people handling those tasks.</span></label>
                    <label className="flex cursor-pointer items-start gap-3"><Checkbox checked={acceptSharing} onCheckedChange={(checked) => setAcceptSharing(checked === true)} aria-label="Acknowledge information-sharing responsibilities" className="mt-0.5" /><span>I understand applicant information may be shared with the involved tenant and manager for the rental process. I will not disclose it to unrelated parties without an appropriate basis or permission.</span></label>
                    <p className="text-xs text-muted-foreground">Your acknowledgements and their date are recorded with this setup.</p>
                </div>
                <div className="flex justify-end"><Button type="submit" disabled={busy || (Boolean(image) && passphrase.length < 12)}>{busy ? "Saving..." : "Save agreement settings"}</Button></div>
            </form>
        </section>
    );
}

export default function SigningSetup() {
    const { data: profile, isLoading, isError } = useGetManagerSigningProfileQuery();
    if (isLoading) return <PageSkeleton variant="form" />;
    if (isError) return <div role="alert" className="rounded-xl border border-border bg-card p-6 text-sm text-destructive">Agreement settings could not be loaded.</div>;
    return <SigningSetupForm key={profile?.updatedAt ?? "new"} profile={profile ?? null} />;
}
