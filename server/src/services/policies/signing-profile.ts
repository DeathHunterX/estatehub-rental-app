import type { AgreementSetupProfile } from "../../types/global";
import { BadRequestError } from "../../errors/http-error";

export function isLeaseAgreementSetupComplete(
    profile: AgreementSetupProfile | null
): boolean {
    if (!profile) return false;
    return Boolean(
        profile.legalName.trim().length >= 2 &&
            profile.agreementNotes.trim().length >= 10 &&
            profile.signatureCiphertext &&
            profile.signatureSalt &&
            profile.signatureIv &&
            profile.signatureUpdatedAt &&
            profile.acceptedPrivacyAt &&
            profile.acceptedSharingAt &&
            profile.acceptedPolicyVersion === "2026-09-27"
    );
}

const text = (value: unknown, max: number, label: string) => {
    if (typeof value !== "string" || value.trim().length > max)
        throw new BadRequestError(`Invalid ${label}`);
    return value.trim();
};

export function parseSigningProfile(value: unknown) {
    if (!value || typeof value !== "object")
        throw new BadRequestError("Invalid signing profile");
    const input = value as Record<string, unknown>;
    const legalName = text(input.legalName, 120, "legal name");
    if (legalName.length < 2)
        throw new BadRequestError("Legal name is required");
    const title = text(input.title ?? "", 120, "title");
    const agreementNotes = text(
        input.agreementNotes ?? "",
        2000,
        "agreement notes"
    );
    const signatureFields = [
        input.signatureCiphertext,
        input.signatureSalt,
        input.signatureIv,
    ];
    const hasSignature = signatureFields.some((field) => field != null);
    if (
        hasSignature &&
        signatureFields.some(
            (field) =>
                typeof field !== "string" ||
                !/^[A-Za-z0-9+/]+={0,2}$/.test(field)
        )
    ) {
        throw new BadRequestError("Encrypted signature is incomplete");
    }
    const signatureCiphertext = hasSignature
        ? String(input.signatureCiphertext)
        : undefined;
    const signatureSalt = hasSignature
        ? String(input.signatureSalt)
        : undefined;
    const signatureIv = hasSignature ? String(input.signatureIv) : undefined;
    if (
        signatureCiphertext &&
        (signatureCiphertext.length < 32 ||
            signatureCiphertext.length > 75000 ||
            signatureSalt!.length !== 24 ||
            signatureIv!.length !== 16)
    ) {
        throw new BadRequestError("Invalid encrypted signature");
    }
    if (
        input.clearSignature != null &&
        typeof input.clearSignature !== "boolean"
    )
        throw new BadRequestError("Invalid clear signature flag");
    if (input.clearSignature && hasSignature)
        throw new BadRequestError("Choose either a new signature or removal");
    if (input.acceptPrivacy != null && typeof input.acceptPrivacy !== "boolean")
        throw new BadRequestError("Invalid privacy acknowledgement");
    if (input.acceptSharing != null && typeof input.acceptSharing !== "boolean")
        throw new BadRequestError("Invalid data-sharing acknowledgement");
    return {
        legalName,
        title,
        agreementNotes,
        signatureCiphertext,
        signatureSalt,
        signatureIv,
        clearSignature: input.clearSignature === true,
        acceptPrivacy: input.acceptPrivacy === true,
        acceptSharing: input.acceptSharing === true,
    };
}
