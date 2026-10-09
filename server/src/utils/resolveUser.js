import { query } from "../config/db.js";
import { verify } from "../config/neonAuth.js";
import ApiError from "./ApiError.js";

const resolveUserFromToken = async (token) => {
    let claims;
    try {
        claims = await verify(token);
    } catch (error) {
        throw ApiError.unauthorized("Invalid or expired token");
    }

    const email = String(claims.email || "").toLowerCase();
    const name = String(claims.name || claims.email || "User").trim();

    if (!email) {
        throw ApiError.unauthorized("Neon auth session has no email");
    }

    const { rows } = await query(
        `INSERT INTO users (name, email)
        VALUES ($1, $2)
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, email, name`, [name, email]
    );

    return {
        id: rows[0].id,
        email: rows[0].email,
        name: rows[0].name,
    };
};

export { resolveUserFromToken };