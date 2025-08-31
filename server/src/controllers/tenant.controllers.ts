import { wktToGeoJSON } from "@terraformer/wkt";
import { Request, Response } from "express";
import { ConflictError } from "../errors/http-error";
import prisma from "../lib/prisma";

export const getTenant = async (req: Request, res: Response) => {
    const { tenantUserId } = req.params;
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

export const getCurrentResidences = async (req: Request, res: Response) => {
    const { tenantUserId } = req.params;

    const properties = await prisma.property.findMany({
        where: {
            tenants: { some: { userId: tenantUserId } },
        },
        include: {
            location: true,
        },
    });

    const residencesWithFormattedLocation = await Promise.all(
        properties.map(async (property) => {
            const coordinates: { coordinates: string }[] =
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

export const addFavorProperty = async (req: Request, res: Response) => {
    const { tenantId, propertyId } = req.params;

    const tenantIdNumber = Number(tenantId);
    const propertyIdNumber = Number(propertyId);

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantIdNumber },
        include: { favorites: true },
    });

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

export const removeFavorProperty = async (req: Request, res: Response) => {
    const { tenantId, propertyId } = req.params;

    const tenantIdNumber = Number(tenantId);
    const propertyIdNumber = Number(propertyId);

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
