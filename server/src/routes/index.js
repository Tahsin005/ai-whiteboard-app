import express from "express";
import userRoutes from "./userRoutes.js";
import whiteboardRoutes from "./whiteboardRoutes.js";

const router = express.Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));

router.use("/users", userRoutes);
router.use("/whiteboards", whiteboardRoutes);

export default router;