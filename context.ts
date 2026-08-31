import { verifyToken } from "./jwt";
import { User } from "../models/User";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export interface Context {
  user: AuthUser | null;
}

// Resolves a bearer token string to a user, or null when missing/invalid.
export const getUserFromToken = async (
  authHeader?: string | null
): Promise<AuthUser | null> => {
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const { userId } = verifyToken(token);
    const user = await User.findById(userId).lean();
    if (!user) return null;
    return { id: String(user._id), username: user.username, email: user.email };
  } catch {
    return null;
  }
};

export const buildContext = async ({ req }: { req: any }): Promise<Context> => {
  const user = await getUserFromToken(req.headers.authorization);
  return { user };
};
