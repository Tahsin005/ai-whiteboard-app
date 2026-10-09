import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { searchUsers } from "../controllers/userController.js";

const router = express.Router();

router.get("/search", requireAuth, searchUsers);

export default router;