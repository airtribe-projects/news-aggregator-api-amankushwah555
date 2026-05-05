[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=23825990&assignment_repo_type=AssignmentRepo)

# News Aggregator API

A RESTful news aggregator built with Node.js, Express, bcrypt, and JWT. Users register with topic preferences, log in to receive a JWT, and fetch headlines from [NewsAPI](https://newsapi.org/) tailored to those preferences. Articles can be marked as read or favorite, searched by keyword, and the cache refreshes itself in the background.

## Stack

- **Express 4** — HTTP framework
- **bcrypt** — password hashing
- **jsonwebtoken** — token-based auth
- **axios** — external NewsAPI calls
- **joi** — input validation
- **dotenv** — env config
- **tap + supertest** — tests

## Project layout

```
app.js                  # Express setup, routes, error handler
config.js               # env-driven configuration
middleware/auth.js      # JWT verification
routes/users.js         # signup, login, preferences
routes/news.js          # news, read/favorite, search
services/newsService.js # NewsAPI client + cache + background refresh
data/store.js           # in-memory user + article store
test/server.test.js     # tap test suite
```

## Setup

```bash
npm install
cp .env.example .env    # then put your NewsAPI key into .env
npm start || node app.js
```

`.env` keys:

| Key | Purpose |
|-----|---------|
| `NEWS_API_KEY` | NewsAPI.org API key |
| `JWT_SECRET` | secret used to sign JWTs |
| `PORT` | port to listen on (default `3000`) |

If `NEWS_API_KEY` is unset, `/news` returns an empty array rather than failing.

## Running tests

```bash
npm test
```

The suite uses `tap` and `supertest` and exercises every Step 2–4 contract.

## API reference

All authenticated routes require an `Authorization: Bearer <token>` header.

### Auth

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/users/signup` (alias `/register`) | `{ name, email, password, preferences[] }` | `200 { message }` / `400` validation / `409` duplicate |
| POST | `/users/login` (alias `/login`) | `{ email, password }` | `200 { token }` / `401` bad creds |

### Preferences (auth required)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/users/preferences` (alias `/preferences`) | — | `200 { preferences }` |
| PUT | `/users/preferences` (alias `/preferences`) | `{ preferences[] }` | `200 { preferences }` |

### News (auth required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/news` | Top headlines filtered by user preferences (cached 5 min per preference set) |
| GET | `/news/search/:keyword` | Search NewsAPI's `everything` endpoint |
| POST | `/news/:id/read` | Mark an article (returned by `/news`) as read |
| POST | `/news/:id/favorite` | Mark an article as a favorite |
| GET | `/news/read` | List articles the current user has marked as read |
| GET | `/news/favorites` | List articles the current user has marked as favorite |

Article `id` is a stable MD5 of the article URL — it's added to every article in `/news` and `/news/search/:keyword` responses, so the client can echo it back to the read/favorite endpoints.

## Quick curl walkthrough

```bash
# register
curl -X POST localhost:3000/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Clark","email":"c@k.com","password":"secret123","preferences":["technology"]}'

# login
TOKEN=$(curl -s -X POST localhost:3000/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"c@k.com","password":"secret123"}' | jq -r .token)

# fetch news
curl localhost:3000/news -H "Authorization: Bearer $TOKEN"

# search
curl localhost:3000/news/search/ai -H "Authorization: Bearer $TOKEN"

# mark first article as read (replace <id>)
curl -X POST localhost:3000/news/<id>/read -H "Authorization: Bearer $TOKEN"

# read history
curl localhost:3000/news/read -H "Authorization: Bearer $TOKEN"
```

## Caching & background refresh

- Top-headline results are cached per sorted-preferences key for 5 minutes (`newsCacheTtlMs` in [config.js](config.js)).
- When the server is started directly (`node app.js`), a 10-minute interval refreshes every cached preference set in the background, so cache hits stay fresh without user-triggered traffic.
- The interval is `unref()`'d and is not started when the app is `require()`'d (so it does not interfere with tests).

## Validation & error handling

- Joi schemas validate signup, login, and preferences payloads ([routes/users.js](routes/users.js)).
- The auth middleware rejects requests without a valid bearer token with `401`.
- News-API failures are caught and degraded to the previous cache (or an empty list) instead of bubbling up.
- A central error handler in [app.js](app.js) returns `500 { error: "Internal server error" }` for unexpected failures.

## Notes & limitations

- All state (users, articles, read/favorite sets) is in-memory; restarting the server clears it. Swap [data/store.js](data/store.js) for a real DB if persistence is needed.
- `bcrypt` is the native binding (per the assignment brief). On platforms where it can't compile, switch to `bcryptjs` — the API is identical.
- `.env` is gitignored; copy [.env.example](.env.example) and fill in your own keys.
