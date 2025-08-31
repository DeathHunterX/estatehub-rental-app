import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { NotFoundError } from "../errors/http-error";
import prisma from "../lib/prisma";

export const listApplications = async (req: Request, res: Response) => {
    const { userId, userType } = req.query;

    let whereClause: Prisma.ApplicationWhereInput = {};

    if (userId && userType) {
        if (userType === "tenant") {
            whereClause = { tenantUserId: String(userId) };
        } else if (userType === "manager") {
            whereClause = {
                property: {
                    managerUserId: String(userId),
                },
            };
        }
    }

    const applications = await prisma.application.findMany({
        where: whereClause,
        include: {
            property: {
                include: {
                    location: true,
                    manager: {
                        include: {
                            user: true,
                        },
                    },
                },
            },
            tenant: {
                include: {
                    user: true,
                },
            },
        },
    });

    function calculateNextPaymentDate(startDate: Date): Date {
        const today = new Date();
        const nextPaymentDate = new Date(startDate);

        while (nextPaymentDate <= today) {
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        }

        return nextPaymentDate;
    }

    const formattedApplications = await Promise.all(
        applications.map(async (application) => {
            const lease = await prisma.lease.findFirst({
                where: {
                    tenant: {
                        userId: application.tenantUserId,
                    },
                    propertyId: application.propertyId,
                },
                orderBy: { startDate: "desc" },
            });
            return {
                ...application,
                property: {
                    ...application.property,
                    address: application.property.location.address,
                },
                manager: application.property.manager,
                lease: lease
                    ? {
                          ...lease,
                          nextPaymentDate: calculateNextPaymentDate(
                              lease.startDate
                          ),
                      }
                    : null,
            };
        })
    );

    return res.status(200).json({
        success: true,
        data: formattedApplications,
    });
};

export const createApplication = async (req: Request, res: Response) => {
    const {
        applicationDate,
        status,
        propertyId,
        tenantUserId,
        name,
        email,
        phoneNumber,
        message,
    } = req.body;

    const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
            pricePerMonth: true,
            securityDeposit: true,
        },
    });

    if (!property) {
        throw new NotFoundError("Property not found");
    }

    const newApplication = await prisma.$transaction(async (prisma) => {
        // Create lease first
        const lease = await prisma.lease.create({
            data: {
                startDate: applicationDate,
                endDate: new Date(
                    new Date().setFullYear(new Date().getFullYear() + 1)
                ),
                rent: property?.pricePerMonth,
                deposit: property?.securityDeposit,
                property: {
                    connect: { id: propertyId },
                },

                tenant: {
                    connect: { userId: tenantUserId },
                },
            },
        });

        // Then create application with lease connection
        const application = await prisma.application.create({
            data: {
                applicationDate: new Date(applicationDate),
                status,
                name,
                email,
                phoneNumber,
                message,
                property: {
                    connect: { id: propertyId },
                },
                tenant: {
                    connect: { userId: tenantUserId },
                },
                lease: {
                    connect: { id: lease.id },
                },
            },
            include: {
                property: true,
                tenant: true,
                lease: true,
            },
        });

        return application;
    });

    return res.status(201).json({
        success: true,
        data: newApplication,
    });
};

export const updateApplication = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const application = await prisma.application.findUnique({
        where: { id: Number(id) },
        include: {
            property: true,
            tenant: true,
        },
    });

    if (!application) {
        throw new NotFoundError("Application not found");
    }

    if (status === "Approved") {
        const newLease = await prisma.lease.create({
            data: {
                startDate: new Date(),
                endDate: new Date(
                    new Date().setFullYear(new Date().getFullYear() + 1)
                ),
                rent: application.property.pricePerMonth,
                deposit: application.property.securityDeposit,
                propertyId: application.propertyId,
                tenantUserId: application.tenantUserId,
            },
        });

        // Update the property to connect the tenant
        await prisma.property.update({
            where: { id: application.propertyId },
            data: {
                tenants: {
                    connect: { userId: application.tenantUserId },
                },
            },
        });

        // Update the application with the new lease ID
        await prisma.application.update({
            where: { id: Number(id) },
            data: { status, leaseId: newLease.id },
            include: {
                property: true,
                tenant: true,
                lease: true,
            },
        });
    } else {
        // Update the application status (for both "Denied" and other statuses)
        await prisma.application.update({
            where: { id: Number(id) },
            data: { status },
        });
    }

    // Respond with the updated application details
    const updatedApplication = await prisma.application.findUnique({
        where: { id: Number(id) },
        include: {
            property: true,
            tenant: true,
            lease: true,
        },
    });

    return res.status(200).json({
        success: true,
        data: updatedApplication,
    });
};
