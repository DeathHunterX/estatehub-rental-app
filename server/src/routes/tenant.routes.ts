import express from "express";
import {
    addFavorProperty,
    getCurrentResidences,
    getTenant,
    removeFavorProperty,
} from "../controllers/tenant.controllers";

const router = express.Router();

router.get("/:tenantUserId", getTenant);

router.get("/:tenantUserId/current-residences", getCurrentResidences);

router.post("/:tenantId/favorites/:propertyId", addFavorProperty);

router.delete("/:tenantId/favorites/:propertyId", removeFavorProperty);

export default router;
