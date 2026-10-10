import fs from "fs";
import path from "path";
import { UPLOAD_DIR } from "../config/upload.js";
import * as storage from "../config/storage.js";

const deleteUploadByUrl = (src) => {
    if (typeof src !== "string") return;

    if (storage.isEnabled() && src.includes(`/${storage.bucket}/`)) {
        const key = storage.keyFromUrl(src);
        if (key) storage.deleteObject(key).catch(() => {});
        return;
    }

    const marker = "/uploads/";
    const idx = src.indexOf(marker);
    if (idx === -1) return;
    const name = path.basename(src.slice(idx + marker.length).split("?")[0]);
    if (name) fs.promises.unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
};

export { deleteUploadByUrl };
