// Libraries
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

// Middlewares
import errorHandler from "./middlewares/error-handler";
import authMiddleware from "./middlewares/auth.middleware";

// Routes
import applicationRoutes from "./routes/application.routes";
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chat.route";
import leaseRoutes from "./routes/lease.routes";
import managerRoutes from "./routes/manager.routes";
import messageRoutes from "./routes/message.route";
import notificationRoutes from "./routes/notification.routes";
import propertyRoutes from "./routes/property.routes";
import tenantRoutes from "./routes/tenant.routes";
import userRoutes from "./routes/user.route";

// Config
import config from "./config";

// Background services
import { cleanStagedPropertyPhotos } from "./services/staged-photo-cleanup.service";
import { sendLeaseReminders } from "./services/lease-reminders.service";
import { processApplicationDeadlines } from "./services/application-deadlines.service";

/* CONFIGURATIONS */
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(cookieParser());

/* ROUTES */
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", authMiddleware(["manager", "tenant"]), userRoutes);
app.use("/api/managers", authMiddleware(["manager"]), managerRoutes);
app.use("/api/tenants", authMiddleware(["tenant"]), tenantRoutes);
app.use("/api/leases", authMiddleware(["manager", "tenant"]), leaseRoutes);
app.use(
    "/api/applications",
    authMiddleware(["manager", "tenant"]),
    applicationRoutes
);

app.use("/api/chats", authMiddleware(["manager", "tenant"]), chatRoutes);
app.use("/api/messages", authMiddleware(["manager", "tenant"]), messageRoutes);
app.use("/api/notifications", authMiddleware(["manager", "tenant"]), notificationRoutes);

app.use(errorHandler);

app.get("/", (_, res) => {
    res.send("Hello World");
});

/* SERVER */
const port = Number(config.port!) || 5000;

app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
    const runPhotoCleanup = () => void cleanStagedPropertyPhotos().catch((error) => console.error("Property photo cleanup failed", error));
    setTimeout(runPhotoCleanup, 60_000).unref();
    setInterval(runPhotoCleanup, 24 * 60 * 60 * 1000).unref();
    const runLeaseReminders = () => void sendLeaseReminders().catch((error) => console.error("Lease reminders failed", error));
    setTimeout(runLeaseReminders, 10_000).unref();
    setInterval(runLeaseReminders, 24 * 60 * 60 * 1000).unref();
    const runApplicationDeadlines = () => void processApplicationDeadlines().catch((error) => console.error("Application deadlines failed", error));
    setTimeout(runApplicationDeadlines, 10_000).unref();
    setInterval(runApplicationDeadlines, 60 * 60 * 1000).unref();
});
