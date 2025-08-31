import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

/* MIDDLEWARE IMPORTS */
import errorHandler from "./errors/error-handler";
import authMiddleware from "./middleware/auth";

/* ROUTE IMPORTS */
import applicationRoutes from "./routes/application.routes";
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chat.route";
import leaseRoutes from "./routes/lease.routes";
import managerRoutes from "./routes/manager.routes";
import messageRoutes from "./routes/message.route";
import propertyRoutes from "./routes/property.routes";
import tenantRoutes from "./routes/tenant.routes";
import userRoutes from "./routes/user.route";

/* CONFIGURATIONS */
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
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

app.use(errorHandler);

app.get("/", (req, res) => {
    res.send("Hello World");
});

/* SERVER */
const port = Number(process.env.SERVER_PORT!) || 5000;

app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
});
