import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { addMember, createBoard, deleteBoard, getBoard, listBoards, removeMember, updateBoard } from "../controllers/whiteboardController.js";
import { createElement, bulkCreate, updateElement, deleteElement } from "../controllers/elementController.js";
import { uploadImage as uploadImageController } from "../controllers/uploadController.js";
import { uploadImage as uploadImageMiddleware } from "../middleware/upload.js";
import { requireBoardAccess, requireEditAccess } from "../middleware/whiteboardAccess.js";
import { brainstorm, outline, diagram, chart, editSelection, summary } from "../controllers/aiController.js";
const router = express.Router();

router.use(requireAuth);

router.get("/", listBoards);
router.post("/", createBoard);

router.get("/:boardId", requireBoardAccess, getBoard);
router.patch("/:boardId", requireBoardAccess, requireEditAccess, updateBoard);
router.delete("/:boardId", requireBoardAccess, deleteBoard);

router.post("/:boardId/members", requireBoardAccess, addMember);
router.delete("/:boardId/members/:userId", requireBoardAccess, removeMember);

router.post("/:boardId/uploads", requireBoardAccess, requireEditAccess, uploadImageMiddleware, uploadImageController);

router.post("/:boardId/elements", requireBoardAccess, requireEditAccess, createElement);
router.post("/:boardId/elements/bulk", requireBoardAccess, requireEditAccess, bulkCreate);
router.patch("/:boardId/elements/:elementId", requireBoardAccess, requireEditAccess, updateElement);
router.delete("/:boardId/elements/:elementId", requireBoardAccess, requireEditAccess, deleteElement);

router.post("/:boardId/ai/brainstorm", requireBoardAccess, requireEditAccess, brainstorm);
router.post("/:boardId/ai/outline", requireBoardAccess, requireEditAccess, outline);
router.post("/:boardId/ai/diagram", requireBoardAccess, requireEditAccess, diagram);
router.post("/:boardId/ai/chart", requireBoardAccess, requireEditAccess, chart);
router.post("/:boardId/ai/edit", requireBoardAccess, requireEditAccess, editSelection);
router.post("/:boardId/ai/summary", requireBoardAccess, summary);

export default router;