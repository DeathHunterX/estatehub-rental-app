import express from "express";
import {
    addChat,
    getChat,
    getChats,
    readChat,
} from "../controllers/chat.controller";
const router = express.Router();

router.get("/", getChats);
router.get("/:chatId", getChat);
router.post("/", addChat);
router.put("/read/:chatId", readChat);

export default router;
