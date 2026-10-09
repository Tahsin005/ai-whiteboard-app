import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveUserFromToken } from "../utils/resolveUser.js";

const requireAuth = asyncHandler(async (req, _res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer") ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized("Missing authentication token");

    try {
        req.user = await resolveUserFromToken(token);
    } catch (error) {
        if (error.isApiError) throw error;

        throw ApiError.unauthorized("Invalid or expired token");
    }

    next();
});

export { requireAuth };