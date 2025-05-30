import { JWT_SECRET } from "../index";
import { verify } from "hono/jwt";
import { type MiddlewareHandler } from "hono";

/**
 * @description Authentication middleware.
 * @param c Hono context
 * @param next Next middleware
 * @returns Promise<Response>
 */
export const auth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.text("Unauthorized", 401);
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return c.text("Unauthorized", 401);
  }
  try {
    const payload = await verify(token, JWT_SECRET) as unknown as {
      username: string;
      exp: number;
    };
    c.set("user", payload);
    await next();
  } catch {
    return c.text("Invalid or expired token", 401);
  }
};
