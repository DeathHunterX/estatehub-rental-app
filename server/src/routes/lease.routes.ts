import express from "express";
import {
    getLeaseAgreementDraft,
    getLeasePayments,
    getLeases,
    requestRenewal,
    reviewRenewal,
} from "../controllers/lease.controller";

const router = express.Router();

router.get("/", getLeases);

router.get("/:leaseId/payments", getLeasePayments);
router.get("/:leaseId/agreement-draft", getLeaseAgreementDraft);
router.post("/:leaseId/renewal", requestRenewal);
router.patch("/:leaseId/renewal", reviewRenewal);

export default router;
