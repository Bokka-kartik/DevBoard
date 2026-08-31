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

export const buildContext = async ({ req }: { req: any }): Promise<Context> => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return { user: null };

  try {
    const { userId } = verifyToken(token);
    const user = await User.findById(userId).lean();
    if (!user) return { user: null };
    return {
      user: { id: String(user._id), username: user.username, email: user.email },
    };
  } catch {
    return { user: null };
  }
};
