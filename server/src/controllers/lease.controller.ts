import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getLeases = async (req: Request, res: Response) => {
    const leases = await prisma.lease.findMany({
        include: {
            tenant: true,
            property: true,
        },
    });

    return res.status(200).json({
        success: true,
        data: leases,
    });
};

export const getLeasePayments = async (req: Request, res: Response) => {
    const { leaseId } = req.params;
    const payments = await prisma.payment.findMany({
        where: {
            leaseId: Number(leaseId),
        },
    });

    return res.status(200).json({
        success: true,
        data: payments,
    });
};
