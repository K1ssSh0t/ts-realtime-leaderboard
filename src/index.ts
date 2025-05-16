import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import leaderboard from './routes/leaderboard';
export const JWT_SECRET = 'your_jwt_secret'; // Replace with env var in production

const app = new Hono();


app.use(logger());
app.use(prettyJSON());
app.get('/', (c) => c.text('Leaderboard API is running!'));
app.route('/auth', leaderboard);

export default app;