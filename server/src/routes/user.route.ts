import express from "express";
import { getMe, updateMe } from "../controllers/auth/session";

const router = express.Router();

router.get("/me", getMe);

router.put("/me", updateMe);

export default router;
