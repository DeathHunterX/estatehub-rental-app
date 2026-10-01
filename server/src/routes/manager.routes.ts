import express from "express";
import {
    getManager,
    getManagerProperties,
    getManagerSigningProfile,
    updateManagerSigningProfile,
} from "../controllers/manager.controllers";

const router = express.Router();

router.get("/signing-profile", getManagerSigningProfile);
router.put("/signing-profile", updateManagerSigningProfile);

router.get("/:managerUserId", getManager);

router.get("/:managerUserId/properties", getManagerProperties);

export default router;
