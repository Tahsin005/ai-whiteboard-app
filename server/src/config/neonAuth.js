import { createRemoteJWKSet, jwtVerify } from "jose";
import { query } from "./db.js";

const base = process.env.NEON_AUTH_URL ? process.env.NEON_AUTH_URL.replace(/\/$/, "") : null;
const jwksUrl = base ? `${base}/.well-known/jwks.json` : null;
if (!base) {
    console.warn("NEON_AUTH_URL is not set - protected routes will reject every request.");
}

const jwks = base ? createRemoteJWKSet(new URL(jwksUrl)) : null;
if (base) console.log(`Neon Auth enabled - JWKS: ${jwksUrl}`);

const verify = async (token) => {
    if (String(token).split(".").length === 3) {
        const { payload } = await jwtVerify(token, jwks);
        return { email: payload.email, name: payload.name, sub: payload.sub || payload.id };
    }

    try {
        const { rows } = await query(
            `SELECT u.id, u.name, u.email
             FROM neon_auth.session s
             JOIN neon_auth.user u ON s."userId" = u.id
             WHERE s.token = $1 AND s."expiresAt" > NOW()`,
            [token]
        );
        if (rows.length > 0) {
            return { email: rows[0].email, name: rows[0].name, sub: rows[0].id };
        }
    } catch (dbErr) {
        console.error("Session DB lookup error:", dbErr.message);
    }

    if (base) {
        const res = await fetch(`${base}/get-session`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            const user = data?.user;
            if (user?.email) {
                return { email: user.email, name: user.name, sub: user.id };
            }
        }
    }

    throw new Error("Invalid or expired token");
};

export { verify };