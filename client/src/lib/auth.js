import { createInternalNeonAuth } from "@neondatabase/auth";

const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL;

export const neonAuth = createInternalNeonAuth(NEON_AUTH_URL);
export const authClient = neonAuth.adapter;
export const getJWTToken = neonAuth.getJWTToken;

export default authClient;
