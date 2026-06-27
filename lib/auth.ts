import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export interface JWTPayload {
  userId: string;
  email: string;
}

const SECRET = process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production";

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, SECRET) as JWTPayload;
}

export function getAuthUser(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.cookies.get("token")?.value;

  if (!token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function requireAuth(
  req: NextRequest
): { user: JWTPayload } | { error: Response } {
  const user = getAuthUser(req);
  if (!user) {
    return {
      error: Response.json({ error: "Não autenticado." }, { status: 401 }),
    };
  }
  return { user };
}
