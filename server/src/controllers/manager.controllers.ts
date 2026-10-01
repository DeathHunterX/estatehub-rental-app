import type { GeographyQueryRow, AuthenticatedRequest } from "../types/global";
import { wktToGeoJSON } from "@terraformer/wkt";
import { Response } from "express";
import { ForbiddenError } from "../errors/http-error";
import prisma from "../lib/prisma";
import { parseSigningProfile } from "../services/policies/signing-profile";

export const getManager = async (req: AuthenticatedRequest, res: Response) => {
    const { managerUserId } = req.params;
    if (managerUserId !== req.user!.id)
        throw new ForbiddenError("Manager access denied");
    const manager = await prisma.manager.findUnique({
        where: { userId: managerUserId },
        include: {
            user: true,
            managedProperties: true,
        },
    });

    return res.status(200).json({
        success: true,
        data: manager,
    });
};

export const getManagerProperties = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const { managerUserId } = req.params;
    if (managerUserId !== req.user!.id)
        throw new ForbiddenError("Manager access denied");

    const properties = await prisma.property.findMany({
        where: {
            managerUserId: managerUserId,
        },
        include: {
            location: true,
        },
    });

    const propertiesWithFormattedLocation = await Promise.all(
        properties.map(async (property) => {
            const coordinates: GeographyQueryRow[] =
                await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates FROM "Location" WHERE id = ${property.location.id}`;

            const geoJSON: any = wktToGeoJSON(coordinates[0].coordinates || "");
            const longitude = geoJSON.coordinates[0];
            const latitude = geoJSON.coordinates[1];

            return {
                ...property,
                location: {
                    ...property.location,
                    coordinates: { longitude: longitude, latitude },
                },
            };
        })
    );

    return res.status(200).json({
        success: true,
        data: propertiesWithFormattedLocation,
    });
};

export const getManagerSigningProfile = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const profile = await prisma.managerSigningProfile.findUnique({
        where: { managerUserId: req.user!.id },
    });
    return res.status(200).json({ success: true, data: profile });
};

export const updateManagerSigningProfile = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const input = parseSigningProfile(req.body);
    const signatureUpdate = input.clearSignature
        ? {
              signatureCiphertext: null,
              signatureSalt: null,
              signatureIv: null,
              signatureUpdatedAt: null,
          }
        : input.signatureCiphertext
          ? {
                signatureCiphertext: input.signatureCiphertext,
                signatureSalt: input.signatureSalt,
                signatureIv: input.signatureIv,
                signatureUpdatedAt: new Date(),
            }
          : {};
    const acceptedAt = new Date();
    const consentUpdate = {
        ...(input.acceptPrivacy ? { acceptedPrivacyAt: acceptedAt } : {}),
        ...(input.acceptSharing ? { acceptedSharingAt: acceptedAt } : {}),
        ...(input.acceptPrivacy && input.acceptSharing
            ? { acceptedPolicyVersion: "2026-09-27" }
            : {}),
    };
    const profile = await prisma.managerSigningProfile.upsert({
        where: { managerUserId: req.user!.id },
        create: {
            managerUserId: req.user!.id,
            legalName: input.legalName,
            title: input.title,
            agreementNotes: input.agreementNotes,
            ...signatureUpdate,
            ...consentUpdate,
        },
        update: {
            legalName: input.legalName,
            title: input.title,
            agreementNotes: input.agreementNotes,
            ...signatureUpdate,
            ...consentUpdate,
        },
    });
    return res.status(200).json({ success: true, data: profile });
};
