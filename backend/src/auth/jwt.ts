import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export const signToken = (userId: string): string =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

export const verifyToken = (token: string): { userId: string } =>
  jwt.verify(token, JWT_SECRET) as { userId: string };
