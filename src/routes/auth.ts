import {   JWT_SECRET } from '../index';
import app from '../index';
// import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import{ redis} from '../db/client';

app.post('/register', async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) {
    return c.json({ error: 'Username and password required' }, 400);
  }
  const userKey = `user:${username}`;
  const exists = await redis.exists(userKey);
  if (exists) {
    return c.json({ error: 'User already exists' }, 409);
  }
  const hashed = await Bun.password.hash(password,{
    algorithm: 'bcrypt',
    cost: 10,
  })
  //bcrypt.hash(password, 10);
  await redis.set(userKey, JSON.stringify({ username, password: hashed }));
  return c.json({ message: 'User registered' });
});

app.post('/login', async (c) => {
  const { username, password } = await c.req.json();
  const userKey = `user:${username}`;
  const userStr = await redis.get(userKey);
  if (!userStr) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  const user = JSON.parse(userStr);
  const valid = await Bun.password.verify(password, user.password,)
  
  //bcrypt.compare(password, user.password);
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1d' });
  return c.json({ token });
});

export const auth = async (c: any, next: any) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader) return c.json({ error: 'No token' }, 401);
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
};
