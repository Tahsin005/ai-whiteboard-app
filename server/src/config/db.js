import dotenv from "dotenv";
dotenv.config();
import { Pool } from "pg";

const isProduction = process.env.NODE_ENV === "production";
const useSsl = isProduction || process.env.DATABASE_URL?.includes("sslmode=require") || process.env.DATABASE_URL?.includes("neon.tech");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ...(useSsl && {
        ssl: {
            rejectUnauthorized: false,
        },
    }),
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL pool error", err);
    process.exit(1);
});

const query = (text, params) => pool.query(text, params);

const withTransaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

export { pool, query, withTransaction };