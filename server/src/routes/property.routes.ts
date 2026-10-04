import express from "express";
import multer from "multer";
import {
    createProperty,
    getProperties,
    getDestinations,
    getProperty,
    getPropertyLeases,
    getPropertyPayments,
    uploadPropertyPhoto,
    updateProperty,
    deletePropertyPhoto,
    setPropertyListingStatus,
    archiveProperty,
    exportPropertyHistory,
} from "../controllers/property.controllers";
import authMiddleware from "../middlewares/auth.middleware";

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 20 },
});

const router = express.Router();

router.get("/", getProperties);
router.get("/destinations", getDestinations);
router.post(
    "/",
    authMiddleware(["manager"]),
    upload.array("photos"),
    createProperty
);

router.post(
    "/photos",
    authMiddleware(["manager"]),
    upload.single("photo"),
    uploadPropertyPhoto
);
router.delete("/photos", authMiddleware(["manager"]), deletePropertyPhoto);

router.get("/:propertyId", getProperty);
router.patch(
    "/:propertyId",
    authMiddleware(["manager"]),
    upload.none(),
    updateProperty
);

router.patch(
    "/:propertyId/listing-status",
    authMiddleware(["manager"]),
    setPropertyListingStatus
);

router.post(
    "/:propertyId/archive",
    authMiddleware(["manager"]),
    archiveProperty
);

router.get(
    "/:propertyId/history.csv",
    authMiddleware(["manager"]),
    exportPropertyHistory
);

router.get(
    "/:propertyId/leases",
    authMiddleware(["manager"]),
    getPropertyLeases
);

router.get(
    "/:propertyId/payments",
    authMiddleware(["manager"]),
    getPropertyPayments
);

export default router;
