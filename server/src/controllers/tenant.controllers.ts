import type { GeographyQueryRow, AuthenticatedRequest } from "../types/global";
import { wktToGeoJSON } from "@terraformer/wkt";
import { Prisma } from "@prisma/client";
import { Response } from "express";
import { ConflictError, ForbiddenError } from "../errors/http-error";
import prisma from "../lib/prisma";
import { activeLeaseWhere } from "../services/policies/rental-policy";

export const getTenant = async (req: AuthenticatedRequest, res: Response) => {
    const { tenantUserId } = req.params;
    if (tenantUserId !== req.user!.id)
        throw new ForbiddenError("Tenant access denied");
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

export const getCurrentResidences = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const { tenantUserId } = req.params;
    if (tenantUserId !== req.user!.id)
        throw new ForbiddenError("Tenant access denied");

    const properties = await prisma.property.findMany({
        where: {
            leases: { some: { tenantUserId, ...activeLeaseWhere() } },
        },
        include: {
            location: true,
        },
    });

    // Fetch the coordinates for each property location and format them as GeoJSON.
    const locationIds = properties.map((property) => property.location.id);
    const coordinates: (GeographyQueryRow & { id: number })[] =
        locationIds.length
            ? await prisma.$queryRaw`
                SELECT id, ST_asText(coordinates) as coordinates
                FROM "Location"
                WHERE id
                IN (${Prisma.join(locationIds)})
            `
            : [];
    const coordinatesById = new Map(
        coordinates.map((row) => [row.id, row.coordinates])
    );

    // Format the property locations as GeoJSON and include them in the response.
    const residencesWithFormattedLocation = properties.map((property) => {
        const geoJSON: any = wktToGeoJSON(
            coordinatesById.get(property.location.id) || ""
        );
        const longitude = geoJSON.coordinates[0];
        const latitude = geoJSON.coordinates[1];

        return {
            ...property,
            location: {
                ...property.location,
                coordinates: { longitude: longitude, latitude },
            },
        };
    });

    return res.status(200).json({
        success: true,
        data: residencesWithFormattedLocation,
    });
};

export const addFavorProperty = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const { tenantId, propertyId } = req.params;

    const tenantIdNumber = Number(tenantId);
    const propertyIdNumber = Number(propertyId);

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantIdNumber },
        select: {
            userId: true,
            favorites: {
                where: { id: propertyIdNumber },
                select: { id: true },
                take: 1,
            },
        },
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

export const removeFavorProperty = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const { tenantId, propertyId } = req.params;

    const tenantIdNumber = Number(tenantId);
    const propertyIdNumber = Number(propertyId);
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantIdNumber },
    });
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
