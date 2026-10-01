import type { Application, Lease, ManagerSigningProfile, Prisma, Property, User } from "@prisma/client";
import type { Request } from "express";

// Express global declarations
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

// Auth
export type AuthenticatedRequest = Request;
export type UserIdentity = Pick<User, "id" | "role">;

export interface AccessTokenPayload {
    id: string;
    exp: number;
}

// Application
export type ApplicationPaymentTarget = Pick<Application,
    "leaseId" | "propertyId" | "tenantUserId" | "paidAt"
>;

export type ApplicationPaymentWindow = Pick<Application,
    "cancellationRequestedAt" | "paymentDueAt" | "tenantConfirmedAt"
>;

// Lease
export type LeaseAccessTarget = Pick<Lease, "tenantUserId"> & {
    property: Pick<Property, "managerUserId">;
};

// Location
export interface LocationAddress {
    address?: string | null;
    subdistrict?: string | null;
    district?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
}

export type GeocodingAddress = LocationAddress & {
    address: string;
    city: string;
    country: string;
};

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface GeographyQueryRow {
    coordinates: string;
}

// Property
export type PropertyListingState = Pick<Property,
    "listingStatus" | "closedAt" | "archivedAt"
>;

export interface PropertyPhotoAsset {
    public_id: string;
    secure_url: string;
    created_at: string;
}

export interface PropertyPhotoRateLimit {
    count: number;
    resetAt: number;
}

// Search
export interface FiltersState {
    location: string;
    beds: string;
    baths: string;
    propertyType: string;
    amenities: string[];
    availableFrom: string;
    priceRange: [number, number] | [null, null];
    squareFeet: [number, number] | [null, null];
    latitude: number;
    longitude: number;
}

// Signing profile
export type AgreementSetupProfile = Pick<ManagerSigningProfile,
    "legalName" | "agreementNotes" | "signatureCiphertext" | "signatureSalt" |
    "signatureIv" | "signatureUpdatedAt" | "acceptedPrivacyAt" |
    "acceptedSharingAt" | "acceptedPolicyVersion"
>;

// Seed
export type SeedName = Uncapitalize<Prisma.ModelName>;
export type SeedRow = Record<string, any>;
export type SeedData = Record<SeedName, SeedRow[]>;

export interface SeedConflictRow {
    id?: string | number;
    email?: string;
    userId?: string;
    provider?: string;
    providerAccountId?: string;
    leaseId?: number | null;
    managerUserId?: string;
}
