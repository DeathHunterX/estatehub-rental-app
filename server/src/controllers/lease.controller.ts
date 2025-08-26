import { Request, Response } from "express";
import handleError from "../lib/error-handler";
import prisma from "../lib/prisma";

export const getLeases = async (req: Request, res: Response) => {
    try {
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
    } catch (error: any) {
        return handleError(error, res);
    }
};

export const getLeasePayments = async (req: Request, res: Response) => {
    try {
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
    } catch (error: any) {
        return handleError(error, res);
    }
};
