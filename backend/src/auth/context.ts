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

export const getUserFromToken = async (
  authorizationHeader?: string | string[]
): Promise<AuthUser | null> => {
  const header = Array.isArray(authorizationHeader)
    ? authorizationHeader[0] || ""
    : authorizationHeader || "";

  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  try {
    const { userId } = verifyToken(token);
    const user = await User.findById(userId).lean();
    if (!user) return null;
    return {
      id: String(user._id),
      username: user.username,
      email: user.email,
    };
  } catch {
    return null;
  }
};

export const buildContext = async ({ req }: { req: any }): Promise<Context> => ({
  user: await getUserFromToken(req.headers.authorization),
});
