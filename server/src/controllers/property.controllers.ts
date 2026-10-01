// Packages
import { Amenity, Highlight, Location, Prisma, PropertyListingStatus, PropertyType } from "@prisma/client";
import { wktToGeoJSON } from "@terraformer/wkt";
import { randomUUID } from "crypto";
import { Request, Response } from "express";

// Errors
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, RequestError } from "../errors/http-error";

// Data
import prisma from "../lib/prisma";

// Policies
import { isLeaseAgreementSetupComplete } from "../services/policies/signing-profile";
import { activeLeaseWhere, availability, canArchive, isMoneyAmount } from "../services/policies/rental-policy";

// Services
import { geocodePropertyAddress } from "../services/geocoding.service";
import { deleteImage, uploadImage } from "../services/cloudinary.service";

// Utils
import { csvCell, parseIntegerId } from "../utils/utils";
import { locationSearchTerms } from "../utils/location-search";
import { assertPropertyPhotoCount, newStagedPhotoFolder, parsePropertyPhotoUrls } from "../utils/property-photos";

// Types
import type { Coordinates, GeographyQueryRow, PropertyPhotoRateLimit, AuthenticatedRequest } from "../types/global";

export const getProperties = async (req: Request, res: Response) => {
    // Build composable SQL filters so text, availability and radius conditions combine safely.
    const {
        favoriteIds,
        location,
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

    let whereConditions: Prisma.Sql[] = [Prisma.sql`p."archivedAt" IS NULL`, Prisma.sql`p."listingStatus" = 'Free'::"PropertyListingStatus"`,
        Prisma.sql`NOT EXISTS (SELECT 1 FROM "Lease" active WHERE active."propertyId" = p.id AND active."startDate" <= NOW() AND active."endDate" >= NOW() - INTERVAL '1 day')`];

    if (favoriteIds) {
        const favoriteIdsArray = (favoriteIds as string).split(",").map(Number);
        whereConditions.push(
            Prisma.sql`p.id IN (${Prisma.join(favoriteIdsArray)})`
        );
    }

    if (typeof location === "string" && location.trim() && !(latitude && longitude)) {
        const searchableAddress = Prisma.sql`regexp_replace(lower(unaccent(concat_ws(' ', l.address, l.subdistrict, l.district, l.city, l.state, l.country, l."postalCode"))), '[[:space:][:punct:]]', '', 'g')`;
        for (const term of locationSearchTerms(location)) {
            whereConditions.push(Prisma.sql`${searchableAddress} LIKE '%' || lower(unaccent(${term})) || '%'`);
        }
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
        whereConditions.push(Prisma.sql`p.amenities @> ${amenitiesArray}::"Amenity"[]`);
    }

    if (availableFrom && availableFrom !== "any") {
        const availableFromDate =
            typeof availableFrom === "string" ? availableFrom : null;
        if (availableFromDate) {
            const date = new Date(availableFromDate);
            if (!isNaN(date.getTime())) {
                whereConditions.push(
                    Prisma.sql`NOT EXISTS (
                        SELECT 1 FROM "Lease" l 
                        WHERE l."propertyId" = p.id 
                        AND l."startDate" <= ${date}
                        AND l."endDate" >= ${date}
                      )`
                );
            }
        }
    }

    if (latitude && longitude) {
        const lat = parseFloat(latitude as string);
        const lng = parseFloat(longitude as string);
        whereConditions.push(
            Prisma.sql`ST_DWithin(
                    l.coordinates,
                    ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
                    50000
                  )`
        );
    }

    const completeQuery = Prisma.sql`
                SELECT 
                  p.*,
                  CASE WHEN EXISTS (SELECT 1 FROM "Application" waiting WHERE waiting."propertyId" = p.id AND waiting.status IN ('Pending'::"ApplicationStatus", 'Approved'::"ApplicationStatus")) THEN 'Waiting' ELSE 'Free' END AS availability,
                  json_build_object(
                    'id', l.id,
                    'address', l.address,
                    'subdistrict', l.subdistrict,
                    'district', l.district,
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
};

export const getProperty = async (req: Request, res: Response) => {
    const { propertyId } = req.params;
    const property = await prisma.property.findUnique({
        where: {
            id: Number(propertyId),
        },
        include: {
            location: true,
        },
    });

    if (property && !property.archivedAt) {
        const [occupied, waiting] = await Promise.all([
            prisma.lease.findFirst({ where: { propertyId: property.id, ...activeLeaseWhere() }, select: { id: true } }),
            prisma.application.findFirst({ where: { propertyId: property.id, status: "Pending" }, select: { id: true } }),
        ]);
        const coordinates: GeographyQueryRow[] =
            await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates FROM "Location" WHERE id = ${property.location.id}`;

        const geoJSON: any = wktToGeoJSON(coordinates[0].coordinates || "");
        const longitude = geoJSON.coordinates[0];
        const latitude = geoJSON.coordinates[1];

        const propertyWithCoordinates = {
            ...property,
            availability: availability(property, !!occupied, !!waiting),
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
    throw new NotFoundError("Property not found");
};

export const createProperty = async (req: AuthenticatedRequest, res: Response) => {
    const files = (req.files ?? []) as Express.Multer.File[];
    const {
        address,
        subdistrict,
        district,
        city,
        state,
        country,
        postalCode,
        ...propertyData
    } = req.body;
    const managerUserId = req.user!.id;
    const signingProfile = await prisma.managerSigningProfile.findUnique({ where: { managerUserId } });
    if (!isLeaseAgreementSetupComplete(signingProfile)) {
        throw new ForbiddenError("Complete lease agreement setup before creating a property");
    }

    if (![address, city, country].every((part) => typeof part === "string" && part.trim())) {
        throw new BadRequestError("Street address, city and country are required");
    }
    if (!isMoneyAmount(Number(propertyData.pricePerMonth)) || !isMoneyAmount(Number(propertyData.securityDeposit), true) || !isMoneyAmount(Number(propertyData.applicationFee), true)) {
        throw new BadRequestError("Rent, deposit and application fee must be valid amounts with at most two decimal places");
    }
    const coordinates = await geocodePropertyAddress({ address, subdistrict, district, city, state, country, postalCode });
    if (!coordinates) {
        throw new BadRequestError("We could not locate this full address. Check the street, city and country, then try again.");
    }

    const uploadedUrls = await Promise.all(
        files.map(async (file) => {
            return uploadImage(
                file,
                `estate-hub/properties/${randomUUID()}`
            );
        })
    );
    const photoUrls = assertPropertyPhotoCount(req.body.photoUrls
        ? parsePropertyPhotoUrls(req.body.photoUrls, managerUserId)
        : uploadedUrls);

    // create location
    const [location] = await prisma.$queryRaw<Location[]>`
                INSERT INTO "Location" (address, subdistrict, district, city, state, country, "postalCode", coordinates)
                VALUES (${address.trim()}, ${String(subdistrict ?? "").trim() || null}, ${String(district ?? "").trim() || null}, ${city.trim()}, ${String(state ?? "").trim()}, ${country.trim()}, ${String(postalCode ?? "").trim()}, ST_SetSRID(ST_MakePoint(${coordinates.longitude}, ${coordinates.latitude}), 4326))
                RETURNING id, address, subdistrict, district, city, state, country, "postalCode", ST_AsText(coordinates) as coordinates;
              `;

    // create property
    const newProperty = await prisma.property.create({
        data: {
            ...propertyData,
            photoUrls,
            locationId: location.id,
            managerUserId,
            amenities: typeof propertyData.amenities === "string" ? propertyData.amenities.split(",").filter(Boolean) : [],
            highlights: typeof propertyData.highlights === "string" ? propertyData.highlights.split(",").filter(Boolean) : [],
            isPetsAllowed: propertyData.isPetsAllowed === "true",
            isParkingIncluded: propertyData.isParkingIncluded === "true",
            pricePerMonth: Number(propertyData.pricePerMonth),
            securityDeposit: Number(propertyData.securityDeposit),
            applicationFee: Number(propertyData.applicationFee),
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
};

export const getPropertyLeases = async (req: AuthenticatedRequest, res: Response) => {
    const { propertyId } = req.params;
    const property = await prisma.property.findUnique({
        where: { id: Number(propertyId) },
        select: { managerUserId: true },
    });
    if (!property) throw new NotFoundError("Property not found");
    if (property.managerUserId !== req.user!.id) {
        throw new ForbiddenError("Property access denied");
    }
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
};

const uploadWindows = new Map<string, PropertyPhotoRateLimit>();

export const uploadPropertyPhoto = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) throw new BadRequestError("Choose an image to upload");
    const userId = req.user!.id;
    const now = Date.now();
    const current = uploadWindows.get(userId);
    const window = current && current.resetAt > now ? current : { count: 0, resetAt: now + 24 * 60 * 60 * 1000 };
    if (window.count >= 50) throw new RequestError(429, "Daily photo upload limit reached. Try again tomorrow.");
    window.count += 1;
    uploadWindows.set(userId, window);
    const url = await uploadImage(req.file, newStagedPhotoFolder(userId, process.env.CLOUDINARY_API_SECRET ?? ""));
    return res.status(201).json({ success: true, data: { url } });
};

export const deletePropertyPhoto = async (req: AuthenticatedRequest, res: Response) => {
    const url = parsePropertyPhotoUrls(JSON.stringify([req.body?.url]), req.user!.id)[0];
    const referenced = await prisma.property.findFirst({ where: { photoUrls: { has: url } }, select: { id: true } });
    if (referenced) throw new ForbiddenError("A saved property still uses this photo");
    if (!(await deleteImage(url))) throw new BadRequestError("Could not remove property photo");
    return res.status(200).json({ success: true });
};

export const updateProperty = async (req: AuthenticatedRequest, res: Response) => {
    const propertyId = parseIntegerId(req.params.propertyId, "Invalid property ID");
    const existing = await prisma.property.findUnique({ where: { id: propertyId }, include: { location: true } });
    if (!existing || existing.archivedAt) throw new NotFoundError("Property not found");
    if (existing.managerUserId !== req.user!.id) throw new ForbiddenError("Property access denied");

    const body = req.body;
    const requiredText = ["name", "description", "address", "city", "country"] as const;
    const amenities = String(body.amenities ?? "").split(",").filter(Boolean);
    const highlights = String(body.highlights ?? "").split(",").filter(Boolean);
    const numericFields = ["pricePerMonth", "securityDeposit", "applicationFee", "beds", "baths", "squareFeet"] as const;
    if (requiredText.some((key) => typeof body[key] !== "string" || !body[key].trim()) ||
        numericFields.some((key) => !Number.isFinite(Number(body[key])) || Number(body[key]) < 0) ||
        !isMoneyAmount(Number(body.pricePerMonth)) || !isMoneyAmount(Number(body.securityDeposit), true) || !isMoneyAmount(Number(body.applicationFee), true) ||
        !Number.isInteger(Number(body.beds)) || !Number.isInteger(Number(body.squareFeet)) ||
        amenities.some((value) => !Object.values(Amenity).includes(value as Amenity)) ||
        highlights.some((value) => !Object.values(Highlight).includes(value as Highlight)) ||
        !Object.values(PropertyType).includes(body.propertyType)) {
        throw new BadRequestError("Invalid property details");
    }
    const photoUrls = parsePropertyPhotoUrls(body.photoUrls, req.user!.id, existing.photoUrls);
    const locationChanged = ["address", "subdistrict", "district", "city", "state", "country", "postalCode"].some(
        (key) => String(body[key] ?? "").trim() !== String(existing.location[key as keyof typeof existing.location] ?? "").trim()
    );
    let geocoded: Coordinates | null = null;
    // Reuse the saved coordinates unless an address field actually changed.
    if (locationChanged) {
        geocoded = await geocodePropertyAddress({
            address: body.address, subdistrict: body.subdistrict, district: body.district,
            city: body.city, state: body.state, country: body.country, postalCode: body.postalCode,
        });
        if (!geocoded) {
            throw new BadRequestError("We could not locate this full address. Check the street, city and country, then try again.");
        }
    }
    const updated = await prisma.$transaction(async (tx) => {
        // Lock the listing before checking approvals and propagating price changes to pending offers.
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${propertyId} FOR UPDATE`;
        const approved = await tx.application.findFirst({ where: { propertyId, status: "Approved", leaseId: null }, select: { id: true } });
        if (approved) throw new ConflictError("Resolve the approved application before editing this property");
        const current = await tx.property.findUnique({ where: { id: propertyId }, select: { pricePerMonth: true, securityDeposit: true } });
        if (!current) throw new NotFoundError("Property not found");
        const nextRent = Number(body.pricePerMonth);
        const nextDeposit = Number(body.securityDeposit);
        const priceChanged = current.pricePerMonth !== nextRent || current.securityDeposit !== nextDeposit;
        await tx.location.update({
            where: { id: existing.locationId },
            data: {
                address: String(body.address).trim(), city: String(body.city).trim(),
                subdistrict: String(body.subdistrict ?? "").trim() || null,
                district: String(body.district ?? "").trim() || null,
                state: String(body.state ?? "").trim(), country: String(body.country).trim(), postalCode: String(body.postalCode ?? "").trim(),
            },
        });
        if (geocoded) {
            await tx.$executeRaw`UPDATE "Location" SET coordinates = ST_SetSRID(ST_MakePoint(${geocoded.longitude}, ${geocoded.latitude}), 4326) WHERE id = ${existing.locationId}`;
        }
        const saved = await tx.property.update({
            where: { id: propertyId },
            data: {
                name: String(body.name).trim(), description: String(body.description).trim(),
                pricePerMonth: Number(body.pricePerMonth), securityDeposit: Number(body.securityDeposit),
                applicationFee: Number(body.applicationFee), beds: Number(body.beds), baths: Number(body.baths),
                squareFeet: Number(body.squareFeet), propertyType: body.propertyType as PropertyType,
                isPetsAllowed: body.isPetsAllowed === "true", isParkingIncluded: body.isParkingIncluded === "true",
                amenities: amenities as Amenity[], highlights: highlights as Highlight[], photoUrls,
            },
            include: { location: true },
        });
        if (priceChanged) {
            const pending = await tx.application.findMany({
                where: { propertyId, status: "Pending" },
                select: { id: true, tenantUserId: true },
            });
            if (pending.length) {
                await tx.application.updateMany({
                    where: { propertyId, status: "Pending" },
                    data: { originalMonthlyRent: nextRent, agreedMonthlyRent: nextRent, originalDeposit: nextDeposit },
                });
                const money = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
                await tx.notification.createMany({
                    data: pending.map((application) => ({
                        userId: application.tenantUserId,
                        kind: "PropertyPriceChanged",
                        title: "Price updated for your application",
                        body: `The price for ${saved.name} changed: monthly rent ${money(current.pricePerMonth)} → ${money(nextRent)}, deposit ${money(current.securityDeposit)} → ${money(nextDeposit)}. Review your pending application; you can withdraw it if the new terms do not work for you.`,
                        resourceId: application.id,
                    })),
                });
            }
        }
        return saved;
    });
    return res.status(200).json({ success: true, data: updated });
};

export const getPropertyPayments = async (req: AuthenticatedRequest, res: Response) => {
    const propertyId = Number(req.params.propertyId);
    const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { managerUserId: true },
    });
    if (!property) throw new NotFoundError("Property not found");
    if (property.managerUserId !== req.user!.id) {
        throw new ForbiddenError("Property access denied");
    }
    const payments = await prisma.payment.findMany({
        where: { lease: { propertyId } },
    });
    return res.status(200).json({ success: true, data: payments });
};

export const setPropertyListingStatus = async (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.propertyId);
    const status = req.body.status;
    if (!Number.isInteger(id) || !Object.values(PropertyListingStatus).includes(status)) throw new BadRequestError("Invalid listing status");
    const updated = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${id} FOR UPDATE`;
        const property = await tx.property.findUnique({ where: { id } });
        if (!property || property.archivedAt) throw new NotFoundError("Property not found");
        if (property.managerUserId !== req.user!.id) throw new ForbiddenError("Property access denied");
        if (status === PropertyListingStatus.Free) {
            const occupied = await tx.lease.findFirst({ where: { propertyId: id, ...activeLeaseWhere() }, select: { id: true } });
            if (occupied) throw new ConflictError("An active lease prevents reopening this property");
        } else {
            const approved = await tx.application.findFirst({
                where: { propertyId: id, status: "Approved", leaseId: null }, select: { id: true },
            });
            if (approved) throw new ConflictError("Resolve or withdraw the approved application before closing this property");
            const cancelled = await tx.application.findMany({
                where: { propertyId: id, status: "Pending" }, select: { id: true, tenantUserId: true },
            });
            if (cancelled.length) {
                await tx.application.updateMany({ where: { id: { in: cancelled.map((item) => item.id) } }, data: { status: "Denied", denialReason: "The manager closed this listing before approval." } });
                await tx.notification.createMany({ data: cancelled.map((item) => ({
                    userId: item.tenantUserId, kind: "ApplicationDenied", title: "Listing closed",
                    body: `${property.name} is no longer accepting applications. Your application was declined.`, resourceId: item.id,
                })) });
            }
        }
        return tx.property.update({ where: { id }, data: {
            listingStatus: status, closedAt: status === PropertyListingStatus.Closed ? new Date() : null,
        } });
    });
    return res.json({ success: true, data: updated });
};

export const archiveProperty = async (req: AuthenticatedRequest, res: Response) => {
    const id = parseIntegerId(req.params.propertyId, "Invalid property ID");
    const updated = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${id} FOR UPDATE`;
        const property = await tx.property.findUnique({ where: { id } });
        if (!property) throw new NotFoundError("Property not found");
        if (property.managerUserId !== req.user!.id) throw new ForbiddenError("Property access denied");
        const occupied = await tx.lease.findFirst({ where: { propertyId: id, ...activeLeaseWhere() }, select: { id: true } });
        if (!canArchive(property, !!occupied)) throw new ConflictError("Close the property for 30 days and finish any active lease before archiving");
        const approved = await tx.application.findFirst({ where: { propertyId: id, status: "Approved", leaseId: null }, select: { id: true } });
        if (approved) throw new ConflictError("Resolve the approved application before archiving this property");
        return tx.property.update({ where: { id }, data: { archivedAt: new Date() } });
    });
    return res.json({ success: true, data: updated });
};

export const exportPropertyHistory = async (req: AuthenticatedRequest, res: Response) => {
    const id = parseIntegerId(req.params.propertyId, "Invalid property ID");
    const property = await prisma.property.findUnique({ where: { id }, include: {
        applications: { include: { tenant: { include: { user: true } } } },
        leases: { include: { tenant: { include: { user: true } }, payments: true } },
    } });
    if (!property) throw new NotFoundError("Property not found");
    if (property.managerUserId !== req.user!.id) throw new ForbiddenError("Property access denied");
    const rows: unknown[][] = [["record_type", "record_id", "property_id", "tenant", "email", "status", "monthly_rent", "deposit", "amount_due", "amount_paid", "date"]];
    for (const item of property.applications) rows.push(["application", item.id, id, item.tenant.user.name, item.tenant.user.email, item.status, item.agreedMonthlyRent, item.originalDeposit, "", "", item.applicationDate.toISOString()]);
    for (const item of property.leases) {
        rows.push(["lease", item.id, id, item.tenant.user.name, item.tenant.user.email, item.renewalStatus ?? "Active", item.rent, item.deposit, "", "", item.startDate.toISOString()]);
        for (const payment of item.payments) rows.push(["payment", payment.id, id, item.tenant.user.name, item.tenant.user.email, payment.paymentStatus, item.rent, item.deposit, payment.amountDue, payment.amountPaid, payment.paymentDate.toISOString()]);
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="property-${id}-history.csv"`);
    return res.send(`\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`);
};
