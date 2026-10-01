import express from "express";
import { login, logout, register } from "../controllers/auth/index.controller";
import getAccessToken from "../controllers/auth/token.controller";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/refresh-token", getAccessToken);
router.get("/refresh_token", (_req, res) => res.sendStatus(405));

router.post("/logout", logout);

export default router;
