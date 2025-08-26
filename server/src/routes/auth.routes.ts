import express from "express";
import { login, logout, register } from "../controllers/auth";
import getAccessToken from "../controllers/auth/token";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/refresh_token", getAccessToken);

router.post("/logout", logout);

export default router;
