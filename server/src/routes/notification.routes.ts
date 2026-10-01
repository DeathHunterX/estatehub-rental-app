import express from "express";
import {
    listNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from "../controllers/notification.controller";

const router = express.Router();

router.get("/", listNotifications);

router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

export default router;
