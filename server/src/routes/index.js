import express from "express";
import userRoutes from "./userRoutes.js";

const router = express.Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));

router.use("/users", userRoutes);

export default router;