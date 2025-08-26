import { wktToGeoJSON } from "@terraformer/wkt";
import { Request, Response } from "express";
import handleError from "../lib/error-handler";
import prisma from "../lib/prisma";

export const getManager = async (req: Request, res: Response) => {
    try {
        const { managerUserId } = req.params;
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
    } catch (error: any) {
        return handleError(error, res);
    }
};

export const getManagerProperties = async (req: Request, res: Response) => {
    try {
        const { managerUserId } = req.params;

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
                const coordinates: { coordinates: string }[] =
                    await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates FROM "Location" WHERE id = ${property.location.id}`;

                const geoJSON: any = wktToGeoJSON(
                    coordinates[0].coordinates || ""
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
            })
        );

        return res.status(200).json({
            success: true,
            data: propertiesWithFormattedLocation,
        });
    } catch (error: any) {
        return handleError(error, res);
    }
};
