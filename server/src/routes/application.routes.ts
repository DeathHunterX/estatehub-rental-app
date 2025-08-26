import express from "express";
import {
    createApplication,
    listApplications,
    updateApplication,
} from "../controllers/application.controller";
import authMiddleware from "../middleware/auth";

const router = express.Router();

router.get("/", authMiddleware(["tenant", "manager"]), listApplications);
router.post("/", authMiddleware(["tenant"]), createApplication);
router.patch("/:id/status", authMiddleware(["manager"]), updateApplication);

export default router;
