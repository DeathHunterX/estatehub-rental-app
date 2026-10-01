export type ManagerSigningProfile = {
    managerUserId: string;
    legalName: string;
    title: string;
    agreementNotes: string;
    signatureCiphertext: string | null;
    signatureSalt: string | null;
    signatureIv: string | null;
    signatureUpdatedAt: string | null;
    acceptedPrivacyAt: string | null;
    acceptedSharingAt: string | null;
    acceptedPolicyVersion: string | null;
    updatedAt: string;
};

export type SigningProfileUpdate = Pick<ManagerSigningProfile, "legalName" | "title" | "agreementNotes"> & {
    signatureCiphertext?: string;
    signatureSalt?: string;
    signatureIv?: string;
    acceptPrivacy?: boolean;
    acceptSharing?: boolean;
};
