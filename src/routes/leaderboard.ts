import { redis } from "../db/client";
import { Hono } from "hono";
import { auth } from "../middleware/auth";
import { z } from "zod"; // Agrega Zod para validación

type UserContext = {
  Variables: {
    user: { username: string };
  };
};

const app = new Hono<UserContext>();

// function getUserFromContext(c: any): { username: string } {
//   // @ts-ignore
//   return c.var.user || c.user || (c.get ? c.get('user') : undefined);
// }

// Esquema de validación para submit
const submitSchema = z.object({
  game: z.string().min(1),
  score: z.number(),
});

app.post("/submit", auth, async (c) => {
  const body = await c.req.json();
  const parse = submitSchema.safeParse(body);
  if (!parse.success) {
    return c.json({
      error: "Game and numeric score required",
      details: parse.error.errors,
    }, 400);
  }
  const { game, score } = parse.data;
  const user = c.get("user");
  //getUserFromContext(c);
  if (!user || !user.username) {
    return c.json({ error: "User not found in context" }, 401);
  }
  const username = user.username;
  const leaderboardKey = `leaderboard:${game}`;
  await redis.zadd(leaderboardKey, score, username);
  await redis.lpush(
    `history:${username}:${game}`,
    JSON.stringify({ score, date: Date.now() }),
  );
  return c.json({ message: "Score submitted" });
});

app.get("/:game", async (c) => {
  const game = c.req.param("game");
  const top = Number(c.req.query("top") || 10);
  const leaderboardKey = `leaderboard:${game}`;
  const users = await redis.zrevrange(leaderboardKey, 0, top - 1, "WITHSCORES");
  const result = [];
  for (let i = 0; i < users.length; i += 2) {
    result.push({ username: users[i], score: Number(users[i + 1]) });
  }
  return c.json(result);
});

app.get("/rank/:game/:username", async (c) => {
  const { game, username } = c.req.param();
  const leaderboardKey = `leaderboard:${game}`;
  const rank = await redis.zrevrank(leaderboardKey, username);
  const score = await redis.zscore(leaderboardKey, username);
  if (rank === null) return c.json({ error: "User not found" }, 404);
  return c.json({ username, rank: rank + 1, score: Number(score) });
});

app.get("/top/:game/:from/:to", async (c) => {
  const { game, from, to } = c.req.param();
  const leaderboardKey = `leaderboard:${game}`;
  const users = await redis.zrevrange(leaderboardKey, 0, -1, "WITHSCORES");
  const result = [];
  for (let i = 0; i < users.length; i += 2) {
    const username = users[i];
    const history = await redis.lrange(`history:${username}:${game}`, 0, -1);
    const filtered = history
      .map((h: string) => JSON.parse(h))
      .filter((h: any) => h.date >= Number(from) && h.date <= Number(to));
    if (filtered.length > 0) {
      result.push({ username, scores: filtered });
    }
  }
  return c.json(result);
});

export default app;
