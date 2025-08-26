import express from "express";
import multer from "multer";
import {
    createProperty,
    getProperties,
    getProperty,
    getPropertyLeases,
} from "../controllers/property.controllers";
import authMiddleware from "../middleware/auth";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.get("/", getProperties);

router.get("/:propertyId", getProperty);

router.post(
    "/",
    authMiddleware(["manager"]),
    upload.array("photos"),
    createProperty
);

router.get("/:propertyId/leases", getPropertyLeases);

export default router;
