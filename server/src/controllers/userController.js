import { query } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const searchUsers = asyncHandler(async(req, res) => {
    const q = (req.query.q || "").trim();
    if (q.length < 2) return res.json({
        user: []
    });

    const { rows } = await query(
        `SELECT id, name, email, avatar_url
        FROM users
        WHERE name ILIKE $1 OR email ILIKE $1
        ORDER BY name ASC
        LIMIT 10`, [`%${q}%`]
    );
    res.json({
        users: rows
    });
});

export { searchUsers };