import { JWT_SECRET } from "../index";

// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken'
import { redis } from "../db/client";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { z } from "zod";

const app = new Hono();

// Esquema de validación para el registro
const registerSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
});

app.post("/register", async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) {
    return c.json({ error: "Username and password required" }, 400);
  }
  const userKey = `user:${username}`;
  const exists = await redis.exists(userKey);
  if (exists) {
    return c.json({ error: "User already exists" }, 409);
  }
  const hashed = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });
  //bcrypt.hash(password, 10);
  await redis.set(userKey, JSON.stringify({ username, password: hashed }));
  return c.json({ message: "User registered" });
});

// Esquema de validación para el login
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
});

app.post("/login", async (c) => {
  const { username, password } = await c.req.json();
  const userKey = `user:${username}`;
  const userStr = await redis.get(userKey);
  if (!userStr) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  const user = JSON.parse(userStr);
  const valid = await Bun.password.verify(password, user.password);

  //bcrypt.compare(password, user.password);
  if (!valid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  const token = await sign({
    username,
    //1d expires in 1 day
    //exp: Date.now() + 86400
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
    //exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24

    //exp: Date.now() + 86400
  }, JWT_SECRET);
  return c.json({ token });
});

export default app;
