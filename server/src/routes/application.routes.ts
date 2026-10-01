import express from "express";
import {
    createApplication,
    listApplications,
    updateApplication,
    scheduleLegacyPaymentDeadline,
    updateApplicationQuote,
    chooseSettlementMethod,
    confirmCashSettlement,
    reportCashNotReceived,
    resolveCashDispute,
    retractCashConfirmation,
    withdrawApplication,
    requestApplicationCancellation,
} from "../controllers/application.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/", authMiddleware(["tenant", "manager"]), listApplications);
router.post("/", authMiddleware(["tenant"]), createApplication);

router.patch("/:id/status", authMiddleware(["manager"]), updateApplication);

router.patch(
    "/:id/payment-deadline",
    authMiddleware(["manager"]),
    scheduleLegacyPaymentDeadline
);

router.patch("/:id/quote", authMiddleware(["manager"]), updateApplicationQuote);

router.patch(
    "/:id/settlement-method",
    authMiddleware(["tenant"]),
    chooseSettlementMethod
);

router.post(
    "/:id/confirm-cash",
    authMiddleware(["tenant", "manager"]),
    confirmCashSettlement
);

router.post(
    "/:id/cash-not-received",
    authMiddleware(["manager"]),
    reportCashNotReceived
);

router.post(
    "/:id/resolve-cash-dispute",
    authMiddleware(["manager"]),
    resolveCashDispute
);

router.post(
    "/:id/retract-cash",
    authMiddleware(["tenant"]),
    retractCashConfirmation
);
router.post("/:id/withdraw", authMiddleware(["tenant"]), withdrawApplication);
router.post(
    "/:id/cancellation",
    authMiddleware(["manager"]),
    requestApplicationCancellation
);

export default router;
