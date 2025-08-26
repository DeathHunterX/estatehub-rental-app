import express from "express";
import {
    getManager,
    getManagerProperties,
} from "../controllers/manager.controllers";

const router = express.Router();

router.get("/:managerUserId", getManager);
router.get("/:managerUserId/properties", getManagerProperties);

export default router;
