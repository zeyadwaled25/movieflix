<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&amp;color=gradient&amp;customColorList=6,12,20&amp;height=200&amp;section=header&amp;text=MovieFlix&amp;fontSize=70&amp;fontAlignY=38&amp;animation=fadeIn&amp;fontColor=ffffff&amp;desc=Your%20Personal%20Movie%20and%20TV%20Universe&amp;descAlignY=58&amp;descSize=20" alt="MovieFlix Banner" width="100%"/>
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&amp;size=22&amp;duration=3000&amp;pause=800&amp;color=E50914&amp;center=true&amp;vCenter=true&amp;multiline=false&amp;width=600&amp;lines=Discover+Movies+and+TV+Shows+🎬;Build+Your+Personal+Watchlist+📋;Powered+by+TMDB+API+🔥;Built+with+Next.js+15+%2B+TypeScript+⚡" alt="Animated Typing"/>
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&amp;logo=nextdotjs&amp;logoColor=white" alt="Next.js"/></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&amp;logo=react&amp;logoColor=black" alt="React"/></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&amp;logo=typescript&amp;logoColor=white" alt="TypeScript"/></a>
  <a href="https://getbootstrap.com/"><img src="https://img.shields.io/badge/Bootstrap-5-7952B3?style=for-the-badge&amp;logo=bootstrap&amp;logoColor=white" alt="Bootstrap"/></a>
  <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&amp;logo=prisma&amp;logoColor=white" alt="Prisma"/></a>
  <a href="https://www.sqlite.org/"><img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&amp;logo=sqlite&amp;logoColor=white" alt="SQLite"/></a>
</p>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 Authentication

- User registration & login
- Secure JWT session cookies via `jose`
- Password hashing with `bcryptjs`
- Persistent session management

### 🎬 Browse & Discover

- Trending titles updated daily
- Popular movies & TV shows
- Detailed pages with cast, synopsis & runtime
- Embedded YouTube trailer modal

</td>
<td width="50%">

### 🔍 Smart Search

- TMDB multi-search (movies, shows, actors)
- Live search suggestions as you type

### 📋 Watchlist & Personalization

- Add / remove titles from your watchlist
- Rate media 1–5 stars
- Browsing history tracking
- Preference settings (theme, pagination)
- Personalized recommendations engine

</td>
</tr>
</table>

---

## 🏗️ Project Structure

```
movieflix/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Home — Trending / Movies / TV sliders
│   ├── layout.tsx                # Root layout
│   ├── login/page.tsx            # Login page
│   ├── register/page.tsx         # Registration page
│   ├── my-list/page.tsx          # Personal watchlist
│   ├── details/[mediaType]/[id]/ # Movie / TV details
│   └── api/
│       ├── auth/                 # register · login · logout · me
│       ├── watchlist/            # Add · remove · list
│       └── personalization/      # preferences · history · ratings · recommendations
│
├── components/                   # Reusable React components
│   ├── UIComponents.tsx          # Loaders, skeletons, banners, toasts
│   ├── LazyTrailerModal.tsx      # Lazy-loaded trailer modal
│   ├── InfiniteScroll.tsx        # Infinite scroll
│   └── Pagination.tsx            # Page navigation
│
├── lib/                          # Utility modules
│   ├── tmdb.ts                   # TMDB API client + in-memory cache
│   ├── auth.ts                   # Auth helpers
│   ├── watchlist.ts              # Watchlist CRUD
│   ├── personalization.ts        # Preferences & recommendations
│   └── server/
│       ├── session.ts            # JWT cookie management
│       └── prisma.ts             # Prisma client
│
├── prisma/
│   └── schema.prisma             # DB models: User · WatchlistItem · Rating · …
│
└── public/                       # Static assets (PWA manifest, robots.txt)
```

---

## 🗺️ Routes

### Pages

| Path                        | Description              |
| --------------------------- | ------------------------ |
| `/`                         | Home — browsing sliders  |
| `/login`                    | User login               |
| `/register`                 | New account creation     |
| `/my-list`                  | Personal watchlist       |
| `/details/[mediaType]/[id]` | Movie or TV show details |

### API Endpoints

| Method | Endpoint                               | Description                           |
| ------ | -------------------------------------- | ------------------------------------- |
| `POST` | `/api/auth/register`                   | Create a new account                  |
| `POST` | `/api/auth/login`                      | Login and receive session cookie      |
| `POST` | `/api/auth/logout`                     | Clear session cookie                  |
| `GET`  | `/api/auth/me`                         | Return current user                   |
| `GET`  | `/api/watchlist`                       | Retrieve watchlist                    |
| `POST` | `/api/watchlist`                       | Add / remove a title                  |
| `GET`  | `/api/personalization/preferences`     | Get user preferences                  |
| `PUT`  | `/api/personalization/preferences`     | Update user preferences               |
| `GET`  | `/api/personalization/history`         | Browsing history                      |
| `GET`  | `/api/personalization/view-history`    | View-history tracking                 |
| `GET`  | `/api/personalization/ratings`         | Get ratings                           |
| `POST` | `/api/personalization/ratings`         | Submit a rating                       |
| `GET`  | `/api/personalization/recommendations` | Personalised recommendations          |
| `POST` | `/api/contact`                         | Send contact message to support inbox |

---

## 🚀 Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
SESSION_SECRET=your_long_random_secret_min_32_chars
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require"
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
CONTACT_TO_EMAIL=support@yourdomain.com
CONTACT_FROM_EMAIL="MovieFlix Contact <onboarding@resend.dev>"
```

> 💡 Get a free TMDB API key at [themoviedb.org](https://www.themoviedb.org/settings/api).
>
> 💡 Contact form real delivery requires Resend setup:
>
> - `RESEND_API_KEY`: API key from Resend dashboard
> - `CONTACT_TO_EMAIL`: inbox that receives messages
> - `CONTACT_FROM_EMAIL`: verified sender in Resend (or `onboarding@resend.dev` for testing)

### 3. Run Prisma migration

```bash
npx prisma migrate dev --name init
```

If you are using a hosted database (recommended), use a PostgreSQL URL:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require"
```

### 4. Deployment notes (important)

To keep auth and watchlist APIs working after deploy, make sure these environment variables are set in your hosting provider:

- `NEXT_PUBLIC_TMDB_API_KEY`
- `SESSION_SECRET`
- `DATABASE_URL` (must be `postgresql://` or `postgres://`)
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`

This project runs `prisma migrate deploy` during Vercel build through `npm run vercel-build`.

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ✅ Quality Checks

Run the following before pushing:

```bash
npm run lint   # ESLint — Next.js Core Web Vitals rules
npm run build  # Production build check
```

Both commands must pass before the project is ready to push.

---

## 🛠️ Tech Stack

| Technology                                       | Version | Role                                    |
| ------------------------------------------------ | ------- | --------------------------------------- |
| [Next.js](https://nextjs.org/)                   | 15      | Full-stack React framework (App Router) |
| [React](https://react.dev/)                      | 19      | UI library                              |
| [TypeScript](https://www.typescriptlang.org/)    | 5.8     | Type-safe JavaScript                    |
| [Bootstrap](https://getbootstrap.com/)           | 5       | Responsive CSS framework                |
| [Prisma](https://www.prisma.io/)                 | 5       | ORM & database migrations               |
| [PostgreSQL](https://www.postgresql.org/)        | —       | Relational database                     |
| [jose](https://github.com/panva/jose)            | 6.1     | JWT session management                  |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 3.0     | Secure password hashing                 |
| [TMDB API](https://developer.themoviedb.org/)    | v3      | Movie & TV data source                  |

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&amp;color=gradient&amp;customColorList=6,12,20&amp;height=100&amp;section=footer&amp;animation=fadeIn" alt="Footer Wave" width="100%"/>
</p>
