# MovieFlix

MovieFlix is a movie and TV web app built with Next.js App Router and TypeScript.
It includes authentication, watchlist management, TMDB-powered browsing, and detailed media pages.

## Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Bootstrap 5
- Prisma 5 + SQLite
- JWT session cookies (`jose`)

## Main Features

- Auth: register, login, logout, and current-user session endpoint
- Browse: trending, popular movies, and popular TV shows
- Search: TMDB multi-search with suggestions
- Media details page: cast, trailer, and similar titles
- Watchlist: add/remove and view personal saved titles
- Personalization APIs: preferences, ratings, history, recommendations

## Project Routes

### Pages

- `/`
- `/login`
- `/register`
- `/my-list`
- `/details/[mediaType]/[id]`

### API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/watchlist`
- `POST /api/watchlist`
- `GET /api/personalization/preferences`
- `PUT /api/personalization/preferences`
- `GET /api/personalization/history`
- `GET /api/personalization/view-history`
- `GET /api/personalization/ratings`
- `POST /api/personalization/ratings`
- `GET /api/personalization/recommendations`

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Create `.env.local` with:

```bash
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
SESSION_SECRET=your_long_random_secret_min_32_chars
DATABASE_URL="file:./dev.db"
```

### 3. Run Prisma migration

```bash
npx prisma migrate dev --name init
```

### 4. Start development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quality Checks Before Push

```bash
npm run lint
npm run build
```

If both commands pass, the project is ready to push.
