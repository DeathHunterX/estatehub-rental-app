import { Location, Prisma } from "@prisma/client";
import { wktToGeoJSON } from "@terraformer/wkt";
import axios from "axios";

import { Request, Response } from "express";
import handleError from "../lib/error-handler";
import prisma from "../lib/prisma";
import { uploadImage } from "../services/cloudinary.service";

export const getProperties = async (req: Request, res: Response) => {
    try {
        const {
            favoriteIds,
            priceMin,
            priceMax,
            beds,
            baths,
            propertyType,
            squareFeetMin,
            squareFeetMax,
            amenities,
            availableFrom,
            latitude,
            longitude,
        } = req.query;

        let whereConditions: Prisma.Sql[] = [];

        if (favoriteIds) {
            const favoriteIdsArray = (favoriteIds as string)
                .split(",")
                .map(Number);
            whereConditions.push(
                Prisma.sql`p.id IN (${Prisma.join(favoriteIdsArray)})`
            );
        }

        if (priceMin) {
            whereConditions.push(
                Prisma.sql`p."pricePerMonth" >= ${Number(priceMin)}`
            );
        }

        if (priceMax) {
            whereConditions.push(
                Prisma.sql`p."pricePerMonth" <= ${Number(priceMax)}`
            );
        }

        if (beds && beds !== "any") {
            whereConditions.push(Prisma.sql`p.beds >= ${Number(beds)}`);
        }

        if (baths && baths !== "any") {
            whereConditions.push(Prisma.sql`p.baths >= ${Number(baths)}`);
        }

        if (squareFeetMin) {
            whereConditions.push(
                Prisma.sql`p."squareFeet" >= ${Number(squareFeetMin)}`
            );
        }

        if (squareFeetMax) {
            whereConditions.push(
                Prisma.sql`p."squareFeet" <= ${Number(squareFeetMax)}`
            );
        }

        if (propertyType && propertyType !== "any") {
            whereConditions.push(
                Prisma.sql`p."propertyType" = ${propertyType}::"PropertyType"`
            );
        }

        if (amenities && amenities !== "any") {
            const amenitiesArray = (amenities as string).split(",");
            whereConditions.push(Prisma.sql`p.amenities @> ${amenitiesArray}`);
        }

        if (availableFrom && availableFrom !== "any") {
            const availableFromDate =
                typeof availableFrom === "string" ? availableFrom : null;
            if (availableFromDate) {
                const date = new Date(availableFromDate);
                if (!isNaN(date.getTime())) {
                    whereConditions.push(
                        Prisma.sql`EXISTS (
                        SELECT 1 FROM "Lease" l 
                        WHERE l."propertyId" = p.id 
                        AND l."startDate" <= ${date.toISOString()}
                      )`
                    );
                }
            }
        }

        if (latitude && longitude) {
            const lat = parseFloat(latitude as string);
            const lng = parseFloat(longitude as string);
            const radiusInKilometers = 1000;
            const degrees = radiusInKilometers / 111;

            whereConditions.push(
                Prisma.sql`ST_DWithin(
                    l.coordinates::geometry,
                    ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
                    ${degrees}
                  )`
            );
        }

        const completeQuery = Prisma.sql`
                SELECT 
                  p.*,
                  json_build_object(
                    'id', l.id,
                    'address', l.address,
                    'city', l.city,
                    'state', l.state,
                    'country', l.country,
                    'postalCode', l."postalCode",
                    'coordinates', json_build_object(
                      'longitude', ST_X(l."coordinates"::geometry),
                      'latitude', ST_Y(l."coordinates"::geometry)
                    )
                  ) as location
                FROM "Property" p
                JOIN "Location" l ON p."locationId" = l.id
                ${
                    whereConditions.length > 0
                        ? Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`
                        : Prisma.empty
                }
              `;

        const properties = await prisma.$queryRaw(completeQuery);

        return res.status(200).json({
            success: true,
            data: properties,
        });
    } catch (error: any) {
        return handleError(error, res);
    }
};

export const getProperty = async (req: Request, res: Response) => {
    try {
        const { propertyId } = req.params;
        const property = await prisma.property.findUnique({
            where: {
                id: Number(propertyId),
            },
            include: {
                location: true,
            },
        });

        if (property) {
            const coordinates: { coordinates: string }[] =
                await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates FROM "Location" WHERE id = ${property.location.id}`;

            const geoJSON: any = wktToGeoJSON(coordinates[0].coordinates || "");
            const longitude = geoJSON.coordinates[0];
            const latitude = geoJSON.coordinates[1];

            const propertyWithCoordinates = {
                ...property,
                location: {
                    ...property.location,
                    coordinates: { longitude: longitude, latitude },
                },
            };
            return res.status(200).json({
                success: true,
                data: propertyWithCoordinates,
            });
        }
    } catch (error: any) {
        return handleError(error, res);
    }
};

export const createProperty = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        const {
            address,
            city,
            state,
            country,
            postalCode,
            managerUserId,
            ...propertyData
        } = req.body;

        const photoUrls = await Promise.all(
            files.map(async (file) => {
                return uploadImage(
                    file,
                    `/estate-hub/properties/${managerUserId}/${address}-${city}-${state}-${postalCode}-${country}`
                );
            })
        );

        const geocodingUrl = `https://nominatim.openstreetmap.org/search?${new URLSearchParams(
            {
                street: address,
                city,
                country,
                postalcode: postalCode,
                format: "json",
                limit: "1",
            }
        ).toString()}`;
        const geocodingResponse = await axios.get(geocodingUrl, {
            headers: {
                "User-Agent": "RealEstateApp (justsomedummyemail@gmail.com",
            },
        });
        const [longitude, latitude] =
            geocodingResponse.data[0]?.lon && geocodingResponse.data[0]?.lat
                ? [
                      parseFloat(geocodingResponse.data[0]?.lon),
                      parseFloat(geocodingResponse.data[0]?.lat),
                  ]
                : [0, 0];

        // create location
        const [location] = await prisma.$queryRaw<Location[]>`
                INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates)
                VALUES (${address}, ${city}, ${state}, ${country}, ${postalCode}, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
                RETURNING id, address, city, state, country, "postalCode", ST_AsText(coordinates) as coordinates;
              `;

        // create property
        const newProperty = await prisma.property.create({
            data: {
                ...propertyData,
                photoUrls,
                locationId: location.id,
                managerUserId,
                amenities:
                    typeof propertyData.amenities === "string"
                        ? propertyData.amenities.split(",")
                        : [],
                highlights:
                    typeof propertyData.highlights === "string"
                        ? propertyData.highlights.split(",")
                        : [],
                isPetsAllowed: propertyData.isPetsAllowed === "true",
                isParkingIncluded: propertyData.isParkingIncluded === "true",
                pricePerMonth: parseFloat(propertyData.pricePerMonth),
                securityDeposit: parseFloat(propertyData.securityDeposit),
                applicationFee: parseFloat(propertyData.applicationFee),
                beds: parseInt(propertyData.beds),
                baths: parseFloat(propertyData.baths),
                squareFeet: parseInt(propertyData.squareFeet),
            },
            include: {
                location: true,
                manager: true,
            },
        });

        return res.status(201).json({
            success: true,
            data: newProperty,
        });
    } catch (error: any) {
        return handleError(error, res);
    }
};

export const getPropertyLeases = async (req: Request, res: Response) => {
    try {
        const { propertyId } = req.params;
        const leases = await prisma.lease.findMany({
            where: { propertyId: Number(propertyId) },
            include: {
                tenant: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return res.status(200).json({
            success: true,
            data: leases,
        });
    } catch (error: any) {
        return handleError(error, res);
    }
};
