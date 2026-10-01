import type { ManagerSigningProfile } from "../types/signing-profile";

export function isManagerAgreementReady(profile: ManagerSigningProfile | null | undefined): boolean {
    return Boolean(profile && profile.legalName.trim().length >= 2 && profile.agreementNotes.trim().length >= 10 &&
        profile.signatureCiphertext && profile.signatureSalt && profile.signatureIv && profile.signatureUpdatedAt &&
        profile.acceptedPrivacyAt && profile.acceptedSharingAt && profile.acceptedPolicyVersion === "2026-09-27");
}
