import { query } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as ai from "../services/aiService.js";
import { emitToBoard } from "../realtime/index.js";

const STICKY_COLORS = ["#fde68a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#ddd6fe", "#fed7aa"];
const STICKY = 190;
const GAP = 24;

const persistElements = async (boardId, userId, socketId, specs) => {
    const created = [];
    let z = Date.now();
    for (const s of specs) {
        const { rows } = await query(
            `INSERT INTO elements (whiteboard_id, type, data, z, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, type, data, z, created_by, updated_at`,
            [boardId, s.type, JSON.stringify(s.data), z++, userId]
        );
        created.push(rows[0]);
    }
    await query("UPDATE whiteboards SET updated_at = now() WHERE id = $1", [boardId]);
    for (const element of created) emitToBoard(boardId, "element:created", element, socketId);
    return created;
};

const brainstorm = asyncHandler(async (req, res) => {
    const topic = (req.body.topic || "").trim();
    if (!topic) throw ApiError.badRequest("A topic or prompt is required");
    const count = Math.min(Math.max(parseInt(req.body.count, 10) || 6, 1), 12);
    const originX = Number.isFinite(req.body.x) ? req.body.x : 80;
    const originY = Number.isFinite(req.body.y) ? req.body.y : 80;

    const notes = await ai.brainstormNotes(topic, count);
    const cols = Math.ceil(Math.sqrt(notes.length));

    const specs = notes.map((n, i) => ({
        type: "sticky",
        data: {
            x: originX + (i % cols) * (STICKY + GAP),
            y: originY + Math.floor(i / cols) * (STICKY + GAP),
            w: STICKY,
            h: STICKY,
            fill: STICKY_COLORS[i % STICKY_COLORS.length],
            text: n.text,
            fontSize: 16,
        },
    }));

    const elements = await persistElements(req.board.id, req.user.id, req.get("x-socket-id"), specs);
    res.status(201).json({ elements });
});

const outline = asyncHandler(async (req, res) => {
    const topic = (req.body.topic || "").trim();
    if (!topic) throw ApiError.badRequest("A topic is required");
    const count = Math.min(Math.max(parseInt(req.body.count, 10) || 6, 1), 12);
    const originX = Number.isFinite(req.body.x) ? req.body.x : 80;
    const originY = Number.isFinite(req.body.y) ? req.body.y : 80;

    const { title, points } = await ai.generateOutline(topic, count);

    const specs = [
        {
            type: "text",
            data: { x: originX, y: originY, w: 360, text: title, fontSize: 28, color: "#16161d", weight: 700 },
        },
        {
            type: "bullet",
            data: { x: originX, y: originY + 52, w: 360, items: points, fontSize: 16, color: "#16161d" },
        },
    ];

    const elements = await persistElements(req.board.id, req.user.id, req.get("x-socket-id"), specs);
    res.status(201).json({ elements });
});

const NODE = { rect: { w: 180, h: 72 }, ellipse: { w: 170, h: 72 }, diamond: { w: 170, h: 110 } };
const GAP_X = 60;
const GAP_Y = 80;

const borderPoint = (n, tx, ty) => {
    const cx = n.x + n.w / 2, cy = n.y + n.h / 2;
    const dx = tx - cx, dy = ty - cy;
    if (!dx && !dy) return { x: cx, y: cy };
    const scale = 1 / Math.max(Math.abs(dx) / (n.w / 2), Math.abs(dy) / (n.h / 2));
    return { x: cx + dx * scale, y: cy + dy * scale };
};

export { STICKY_COLORS, STICKY, GAP, persistElements, brainstorm, outline };



