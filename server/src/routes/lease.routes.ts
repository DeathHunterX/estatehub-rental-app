import express from "express";
import { getLeasePayments, getLeases } from "../controllers/lease.controller";

const router = express.Router();

router.get("/", getLeases);
router.get("/:leaseId/payments", getLeasePayments);

export default router;
