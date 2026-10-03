import express from "express";
import {
    addChat,
    getChat,
    getChatReceiver,
    getChats,
    readChat,
} from "../controllers/chat.controller";
const router = express.Router();

router.get("/", getChats);
router.get("/:chatId/receiver", getChatReceiver);
router.get("/:chatId", getChat);
router.post("/", addChat);
router.put("/read/:chatId", readChat);

export default router;
