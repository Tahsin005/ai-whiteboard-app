import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";

import { errorHandler, notFoundHandler } from "./src/middleware/errorHandler.js";
import apiRoutes from "./src/routes/index.js";

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

app.use(express.json({ limit: "10kb" }));

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

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

export { app };