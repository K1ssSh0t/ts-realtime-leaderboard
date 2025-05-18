# workspace

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.13. [Bun](https://bun.sh)
is a fast all-in-one JavaScript runtime.

## API Endpoints

### Authentication

*   **POST /auth/register**: Registers a new user. Requires `username` and `password`.
*   **POST /auth/login**: Logs in an existing user. Requires `username` and `password`. Returns a JWT token.

### Leaderboard

*   **POST /leaderboard/submit**: Submits a score for a game. Requires authentication (JWT token). Requires `game` (string) and `score` (number) in the request body.
*   **GET /leaderboard/:game**: Retrieves the leaderboard for a specific game.  Accepts an optional `top` query parameter to limit the number of results (default is 10).
*   **GET /leaderboard/rank/:game/:username**: Retrieves the rank and score of a specific user in a game.
*   **GET /leaderboard/top/:game/:from/:to**: Retrieves the top users for a game within a specified date range (from and to are timestamps).

### Middleware

*   **Authentication**:  All `/leaderboard/submit` route requires a valid JWT token in the `Authorization` header (Bearer scheme).

### Redis Client

*   The application uses a Redis client for data storage.
