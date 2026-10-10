import "dotenv/config";
import express from "express";

import cors from "cors";
import http from "http";

import { errorHandler, notFoundHandler } from "./src/middleware/errorHandler.js";
import apiRoutes from "./src/routes/index.js";
import { initSocket } from "./src/socket/index.js";
import { UPLOAD_DIR } from "./src/config/upload.js";
const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));

app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "30d", immutable: true}))

app.get("/", (_req, res) => {
    res.json({
        name: "AI Whiteboard App Server",
        version: "1.0.0",
        status: "running"
    });
});

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5050;

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export { app };