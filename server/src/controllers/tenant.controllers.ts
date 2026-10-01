import type { GeographyQueryRow, AuthenticatedRequest } from "../types/global";
import { wktToGeoJSON } from "@terraformer/wkt";
import { Response } from "express";
import { ConflictError, ForbiddenError } from "../errors/http-error";
import prisma from "../lib/prisma";
import { activeLeaseWhere } from "../services/policies/rental-policy";

export const getTenant = async (req: AuthenticatedRequest, res: Response) => {
    const { tenantUserId } = req.params;
    if (tenantUserId !== req.user!.id) throw new ForbiddenError("Tenant access denied");
    const tenant = await prisma.tenant.findUnique({
        where: { userId: tenantUserId },
        include: {
            favorites: true,
            user: true,
        },
    });

    return res.status(200).json({
        success: true,
        data: tenant,
    });
};

export const getCurrentResidences = async (req: AuthenticatedRequest, res: Response) => {
    const { tenantUserId } = req.params;
    if (tenantUserId !== req.user!.id) throw new ForbiddenError("Tenant access denied");

    const properties = await prisma.property.findMany({
        where: {
            leases: { some: { tenantUserId, ...activeLeaseWhere() } },
        },
        include: {
            location: true,
        },
    });

    const residencesWithFormattedLocation = await Promise.all(
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
        data: residencesWithFormattedLocation,
    });
};

export const addFavorProperty = async (req: AuthenticatedRequest, res: Response) => {
    const { tenantId, propertyId } = req.params;

    const tenantIdNumber = Number(tenantId);
    const propertyIdNumber = Number(propertyId);

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantIdNumber },
        include: { favorites: true },
    });
    if (!tenant || tenant.userId !== req.user!.id) {
        throw new ForbiddenError("Favorites access denied");
    }

    const existingFavorites = tenant?.favorites || [];

    if (
        !existingFavorites.some((favorite) => favorite.id === propertyIdNumber)
    ) {
        const updatedTenant = await prisma.tenant.update({
            where: { id: tenantIdNumber },
            data: {
                favorites: {
                    connect: { id: propertyIdNumber },
                },
            },
            include: { favorites: true },
        });

        return res.status(200).json({
            success: true,
            data: updatedTenant,
        });
    } else {
        throw new ConflictError("Property already in favorites");
    }
};

export const removeFavorProperty = async (req: AuthenticatedRequest, res: Response) => {
    const { tenantId, propertyId } = req.params;

    const tenantIdNumber = Number(tenantId);
    const propertyIdNumber = Number(propertyId);
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantIdNumber } });
    if (!tenant || tenant.userId !== req.user!.id) {
        throw new ForbiddenError("Favorites access denied");
    }

    const updatedTenant = await prisma.tenant.update({
        where: { id: tenantIdNumber },
        data: {
            favorites: {
                disconnect: { id: propertyIdNumber },
            },
        },
        include: { favorites: true },
    });

    return res.status(200).json({
        success: true,
        data: updatedTenant,
    });
};
