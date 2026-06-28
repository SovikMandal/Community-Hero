// Authentication & authorization middleware.
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import { verifyToken } from "../utils/token.js";
import asyncHandler from "../utils/asyncHandler.js";

// Requires a valid Bearer token; attaches req.user.
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) throw ApiError.unauthorized("Authentication token missing");

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      latitude: true,
      longitude: true,
      avatar: true,
    },
  });

  if (!user) throw ApiError.unauthorized("User no longer exists");

  req.user = user;
  next();
});

// Restricts a route to one or more roles. Use after `authenticate`.
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("Insufficient permissions"));
    }
    next();
  };
}

// Optional auth: attaches req.user when a valid token is present, but never blocks.
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, departmentId: true, avatar: true },
    });
    if (user) req.user = user;
  } catch {
    // ignore invalid token for optional auth
  }
  next();
});
