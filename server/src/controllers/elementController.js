import { query } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emitToBoard } from "../realtime/index.js";
import ApiError from "../utils/ApiError.js";
import { deleteUploadByUrl } from "../utils/fileCleanup.js";
import { persistWhiteboardFile } from "../utils/fileStorage.js";

const VALID_TYPES = [
    "text",
    "sticky",
    "rect",
    "rectangle",
    "ellipse",
    "diamond",
    "line",
    "arrow",
    "draw",
    "freedraw",
    "bullet",
    "image",
    "chart",
    "emoji",
    "frame",
];

const touchBoard = (boardId) => query(`UPDATE whiteboards SET updated_at = now() WHERE id = $1`, [boardId]);

const createElement = asyncHandler(async (req, res) => {
    const { type, id: clientId } = req.body;
    if (!VALID_TYPES.includes(type)) throw ApiError.badRequest("Invalid element type");
    const data = req.body.data && typeof req.body.data === "object" ? req.body.data : {};
    
    const z = Number.isFinite(req.body.z) ? req.body.z : 1000;

    let rows;
    if (clientId) {
        const result = await query(
            `INSERT INTO elements (id, whiteboard_id, type, data, z, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, type = EXCLUDED.type, updated_at = now()
            RETURNING id, type, data, z, created_by, updated_at`,
            [clientId, req.board.id, type, JSON.stringify(data), z, req.user.id]
        );
        rows = result.rows;
    } else {
        const result = await query(
            `INSERT INTO elements (whiteboard_id, type, data, z, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, type, data, z, created_by, updated_at`,
            [req.board.id, type, JSON.stringify(data), z, req.user.id]
        );
        rows = result.rows;
    }

    const element = rows[0];

    if (type === "image" && data && (data.dataURL || data.src)) {
        const fileId = data.fileId || element.id;
        const dataUrl = data.dataURL || data.src;
        await persistWhiteboardFile(req.board.id, fileId, data.mimeType, dataUrl)
            .catch((err) => console.error("Failed to persist whiteboard file:", err));
    }

    await touchBoard(req.board.id);
    emitToBoard(req.board.id, "element:created", element, req.get("x-socket-id"));
    res.status(201).json({ element });
});

const updateElement = asyncHandler(async (req, res) => {
    const fields = [];
    const values = [];
    let i = 1;

    if (req.body.data !== undefined || req.body.patch !== undefined) {
        const patchData = req.body.patch !== undefined ? req.body.patch : req.body.data;
        if (typeof patchData !== "object" || patchData === null) {
            throw ApiError.badRequest("data/patch must be an object");
        }
        // Shallow JSONB merge
        fields.push(`data = COALESCE(data, '{}'::jsonb) || $${i++}::jsonb`);
        values.push(JSON.stringify(patchData));
    }
    if (req.body.z !== undefined && Number.isFinite(req.body.z)) {
        fields.push(`z = $${i++}`);
        values.push(req.body.z);
    }
    if (!fields.length) throw ApiError.badRequest("No valid fields to update");

    fields.push(`updated_at = now()`);
    values.push(req.params.elementId, req.board.id);

    const { rows } = await query(
        `UPDATE elements SET ${fields.join(", ")}
        WHERE id = $${i++} AND whiteboard_id = $${i}
        RETURNING id, type, data, z, created_by, updated_at`,
        values
    );
    if (!rows.length) throw ApiError.notFound("Element not found");
    await touchBoard(req.board.id);

    const element = rows[0];
    emitToBoard(req.board.id, "element:updated", element, req.get("x-socket-id"));
    res.json({ element });
});

const batchUpdateElements = asyncHandler(async (req, res) => {
    const items = Array.isArray(req.body)
        ? req.body
        : Array.isArray(req.body.elements)
        ? req.body.elements
        : [];

    if (!items.length) {
        return res.json({ success: true, updated: [] });
    }

    const updated = [];
    for (const item of items) {
        if (!item.id) continue;
        const patchData = item.patch !== undefined ? item.patch : item.data;
        const fields = [];
        const values = [];
        let i = 1;

        if (patchData && typeof patchData === "object") {
            fields.push(`data = COALESCE(data, '{}'::jsonb) || $${i++}::jsonb`);
            values.push(JSON.stringify(patchData));
        }
        if (item.z !== undefined && Number.isFinite(item.z)) {
            fields.push(`z = $${i++}`);
            values.push(item.z);
        }
        if (!fields.length) continue;

        fields.push(`updated_at = now()`);
        values.push(item.id, req.board.id);

        const { rows } = await query(
            `UPDATE elements SET ${fields.join(", ")}
            WHERE id = $${i++} AND whiteboard_id = $${i}
            RETURNING id, type, data, z, created_by, updated_at`,
            values
        );
        if (rows.length) {
            updated.push(rows[0]);
            emitToBoard(req.board.id, "element:updated", rows[0], req.get("x-socket-id"));
        }
    }

    if (updated.length) await touchBoard(req.board.id);
    res.json({ success: true, updated });
});

const deleteElement = asyncHandler(async (req, res) => {
    const { rows } = await query(
        "DELETE FROM elements WHERE id = $1 AND whiteboard_id = $2 RETURNING type, data",
        [req.params.elementId, req.board.id]
    );
    if (!rows.length) throw ApiError.notFound("Element not found");
    await touchBoard(req.board.id);
    if (rows[0].type === "image") deleteUploadByUrl(rows[0].data?.src);

    // Clean up unreferenced whiteboard files
    const unreferenced = await query(
        `SELECT id, data_url FROM whiteboard_files 
        WHERE whiteboard_id = $1 
        AND id NOT IN (
            SELECT DISTINCT COALESCE(data->>'fileId', id::text) 
            FROM elements 
            WHERE whiteboard_id = $1 AND (type = 'image' OR data ? 'fileId')
        )`,
        [req.board.id]
    ).catch(() => ({ rows: [] }));

    for (const row of unreferenced.rows) {
        deleteUploadByUrl(row.data_url);
    }

    await query(
        `DELETE FROM whiteboard_files 
        WHERE whiteboard_id = $1 
        AND id NOT IN (
            SELECT DISTINCT COALESCE(data->>'fileId', id::text) 
            FROM elements 
            WHERE whiteboard_id = $1 AND (type = 'image' OR data ? 'fileId')
        )`,
        [req.board.id]
    ).catch((err) => console.error("File cleanup error:", err));

    emitToBoard(
        req.board.id,
        "element:deleted",
        { id: req.params.elementId },
        req.get("x-socket-id")
    );
    res.json({ success: true });
});

const batchDeleteElements = asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (!ids.length) return res.json({ success: true, count: 0 });

    const { rows } = await query(
        "DELETE FROM elements WHERE id = ANY($1::text[]) AND whiteboard_id = $2 RETURNING id, type, data",
        [ids, req.board.id]
    );

    await touchBoard(req.board.id);
    for (const r of rows) {
        if (r.type === "image") deleteUploadByUrl(r.data?.src);
        emitToBoard(req.board.id, "element:deleted", { id: r.id }, req.get("x-socket-id"));
    }

    // Clean up unreferenced whiteboard files
    const unreferencedBatch = await query(
        `SELECT id, data_url FROM whiteboard_files 
        WHERE whiteboard_id = $1 
        AND id NOT IN (
            SELECT DISTINCT COALESCE(data->>'fileId', id::text) 
            FROM elements 
            WHERE whiteboard_id = $1 AND (type = 'image' OR data ? 'fileId')
        )`,
        [req.board.id]
    ).catch(() => ({ rows: [] }));

    for (const row of unreferencedBatch.rows) {
        deleteUploadByUrl(row.data_url);
    }

    await query(
        `DELETE FROM whiteboard_files 
        WHERE whiteboard_id = $1 
        AND id NOT IN (
            SELECT DISTINCT COALESCE(data->>'fileId', id::text) 
            FROM elements 
            WHERE whiteboard_id = $1 AND (type = 'image' OR data ? 'fileId')
        )`,
        [req.board.id]
    ).catch((err) => console.error("File cleanup error:", err));

    res.json({ success: true, count: rows.length });
});

const bulkCreate = asyncHandler(async (req, res) => {
    const incoming = Array.isArray(req.body.elements) ? req.body.elements : [];
    const valid = incoming.filter((e) => VALID_TYPES.includes(e.type));
    if (!valid.length) throw ApiError.badRequest("No valid elements to create");

    const created = [];
    for (const e of valid) {
        const data = e.data && typeof e.data === "object" ? e.data : {};
        const z = Number.isFinite(e.z) ? e.z : 1000;
        let rows;
        if (e.id) {
            const res = await query(
                `INSERT INTO elements (id, whiteboard_id, type, data, z, created_by)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, type = EXCLUDED.type, updated_at = now()
                RETURNING id, type, data, z, created_by, updated_at`,
                [e.id, req.board.id, e.type, JSON.stringify(data), z, req.user.id]
            );
            rows = res.rows;
        } else {
            const res = await query(
                `INSERT INTO elements (whiteboard_id, type, data, z, created_by)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, type, data, z, created_by, updated_at`,
                [req.board.id, e.type, JSON.stringify(data), z, req.user.id]
            );
            rows = res.rows;
        }
        const savedElement = rows[0];
        created.push(savedElement);

        if (e.type === "image" && data && (data.dataURL || data.src)) {
            const fileId = data.fileId || savedElement.id;
            const dataUrl = data.dataURL || data.src;
            await persistWhiteboardFile(req.board.id, fileId, data.mimeType, dataUrl)
                .catch((err) => console.error("Failed to persist whiteboard file in bulkCreate:", err));
        }
    }
    await touchBoard(req.board.id);

    for (const element of created) {
        emitToBoard(req.board.id, "element:created", element, req.get("x-socket-id"));
    }
    res.status(201).json({ elements: created });
});

export {
    createElement,
    updateElement,
    batchUpdateElements,
    deleteElement,
    batchDeleteElements,
    bulkCreate,
};