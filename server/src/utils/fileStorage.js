import fs from "fs";
import path from "path";
import * as storage from "../config/storage.js";
import { UPLOAD_DIR } from "../config/upload.js";
import { query } from "../config/db.js";

/**
 * Saves a whiteboard file:
 * - If base64 dataURL, converts to buffer and uploads to Neon Object Storage (or local /uploads fallback)
 * - Inserts or updates whiteboard_files in PostgreSQL with the public S3 URL (or local URL)
 * - Returns the normalized file object { id, mimeType, dataURL, created }
 */
export async function persistWhiteboardFile(boardId, fileId, mimeType, rawDataUrl) {
    if (!fileId || !rawDataUrl) return null;

    let storedUrl = rawDataUrl;
    const finalMime = mimeType || "image/png";

    if (typeof rawDataUrl === "string" && rawDataUrl.startsWith("data:")) {
        const match = rawDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
            const detectedMime = match[1] || finalMime;
            const buffer = Buffer.from(match[2], "base64");
            const ext = detectedMime.split("/")[1]?.replace("+xml", "").split(";")[0] || "png";
            const filename = `${fileId}.${ext}`;

            if (storage.isEnabled()) {
                storedUrl = await storage.putObject(
                    `whiteboards/${boardId}/${filename}`,
                    buffer,
                    detectedMime
                );
            } else {
                fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
                const base = process.env.PUBLIC_URL || "";
                storedUrl = base ? `${base}/uploads/${filename}` : `/uploads/${filename}`;
            }
        }
    }

    await query(
        `INSERT INTO whiteboard_files (id, whiteboard_id, mime_type, data_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (whiteboard_id, id) DO UPDATE SET data_url = EXCLUDED.data_url, mime_type = EXCLUDED.mime_type`,
        [fileId, boardId, finalMime, storedUrl]
    );

    return {
        id: fileId,
        mimeType: finalMime,
        dataURL: storedUrl,
        created: Date.now(),
    };
}
