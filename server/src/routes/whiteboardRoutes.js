import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { addMember, createBoard, deleteBoard, getBoard, listBoards, removeMember, updateBoard } from "../controllers/whiteboardController.js";
import { requireBoardAccess, requireEditAccess } from "../middleware/whiteboardAccess.js";
const router = express.Router();

router.use(requireAuth);

router.get("/", listBoards);
router.post("/", createBoard);

router.get("/:boardId", requireBoardAccess, getBoard);
router.patch("/:boardId", requireBoardAccess, requireEditAccess, updateBoard);
router.delete("/:boardId", requireBoardAccess, deleteBoard);

router.post("/:boardId/members", requireBoardAccess, addMember);
router.delete("/:boardId/members/:userId", requireBoardAccess, removeMember);

export default router;