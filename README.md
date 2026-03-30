# ⚡ QuizRush — Real-Time Multiplayer Quiz Platform

<div align="center">

![QuizRush](https://img.shields.io/badge/QuizRush-Live%20Quiz%20Platform-2563EB?style=for-the-badge&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![Axum](https://img.shields.io/badge/Axum-orange?style=for-the-badge&logo=rust&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=black)

**A blazing-fast, real-time multiplayer quiz platform — built to be faster, more beautiful, and more powerful than Kahoot. Free. Forever.**

[Live Demo](#) · [Report Bug](#) · [Request Feature](#)

</div>

---

## 📋 Table of Contents

- [About The Project](#-about-the-project)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [How It Works](#-how-it-works)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the App](#running-the-app)
- [API & WebSocket Documentation](#-api--websocket-documentation)
- [SEO Configuration](#-seo-configuration)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 About The Project

**QuizRush** is a production-grade, real-time multiplayer quiz platform built for classrooms, events, conferences, and teams. It replaces expensive tools like Kahoot with a fully open, self-hostable, and beautifully designed alternative.

Players join from their own devices using a room code or QR code. Questions appear simultaneously on everyone's screen. The faster you answer correctly, the more points you earn. Live leaderboards keep everyone on the edge of their seat.

> *"Built with Rust for speed. Built with React for beauty. Built to be the best."*

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React.js** (Vite) | UI framework |
| **TailwindCSS** | Utility-first styling |
| **Framer Motion** | Animations & page transitions |
| **React Router v6** | Client-side routing & protected routes |
| **Zustand** | Global state management |
| **React Hook Form + Zod** | Form handling & validation |
| **Axios** | HTTP API client |
| **Native WebSocket API** | Real-time game communication |
| **react-qr-code** | Room QR code generation |
| **canvas-confetti** | Celebration animations |
| **Lucide React** | Icons |
| **React Helmet Async** | Dynamic SEO meta tags |

### Backend
| Technology | Purpose |
|---|---|
| **Rust** | Programming language |
| **Axum** | Web framework |
| **Tokio** | Async runtime |
| **SQLx** | Async PostgreSQL with compile-time query verification |
| **WebSockets (Axum)** | Real-time game engine |
| **jsonwebtoken** | JWT authentication |
| **bcrypt** | Password hashing |
| **serde / serde_json** | Serialization |
| **uuid** | UUID v4 primary keys |
| **tower-http** | CORS + Gzip/Brotli compression |
| **tracing** | Structured logging |
| **validator** | Input validation |
| **dotenvy** | Environment config |

### Database & Infrastructure
| Technology | Purpose |
|---|---|
| **PostgreSQL** | Relational database |
| **Neon** | Serverless hosted PostgreSQL |
| **SQLx Migrations** | Version-controlled schema management |

---

## ✨ Features

### 🎮 Game Experience
- [x] Real-time multiplayer — everyone plays simultaneously on their own device
- [x] 6-character room codes + scannable QR codes to join instantly
- [x] Speed-based scoring — faster correct answers earn more points (max 1000 per question)
- [x] Live countdown timer per question
- [x] Live leaderboard updates after every question
- [x] Confetti animations on correct answers and final winner screen
- [x] Graceful disconnection handling — players can rejoin and resume
- [x] Player avatars and nicknames in the waiting lobby

### 🏠 Host Controls
- [x] Create and manage quiz sets from a clean dashboard
- [x] Quiz builder — add questions, set timers, upload images per question
- [x] Generate room code + QR code for players to join
- [x] Live lobby — see players joining in real time before game starts
- [x] In-game host view — live answer stats bar chart per question
- [x] Skip question, pause, or end game at any time
- [x] Export final results as CSV

### 🔒 Authentication
- [x] Host registration and login with JWT
- [x] Protected dashboard and quiz builder routes
- [x] Players join as guests — no account needed ever

### 🔍 SEO
- [x] Dynamic meta tags per page with React Helmet Async
- [x] Open Graph tags for WhatsApp, Twitter, LinkedIn previews
- [x] JSON-LD WebApplication structured data on landing page
- [x] Auto-generated sitemap.xml and robots.txt
- [x] Lighthouse score target: 95+ on all metrics

---

## 🎯 How It Works

```
HOST                               PLAYERS
 │                                    │
 │   Create Quiz + Start Room         │
 │──────────────────────────────────► │  Join via Room Code or QR Scan
 │                                    │
 │   Game Lobby (watching live)  ◄────│  Players appear in real time
 │                                    │
 │   Press Start ────────────────►    │  Question appears on all screens
 │                                    │
 │   See live answer stats       ◄────│  Players tap their answer
 │                                    │
 │   Next Question ──────────────►    │  Score popup + leaderboard
 │                                    │
 │   Final Leaderboard ──────────►    │  Winner screen + confetti 🎉
```

All communication happens via **WebSockets** — zero polling, zero lag, pure real-time.

---

## 📁 Project Structure

```
quizrush/
│
├── frontend/                        # React.js application (Vite)
│   ├── public/
│   │   ├── sitemap.xml
│   │   ├── robots.txt
│   │   └── og-image.png             # 1200x630 OG share banner
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Route-level screens
│   │   │   ├── Landing.jsx          # Public landing page
│   │   │   ├── Join.jsx             # Player join screen
│   │   │   ├── PlayerLobby.jsx      # Waiting room
│   │   │   ├── PlayerGame.jsx       # Player game screen
│   │   │   ├── PlayerResults.jsx    # Final score screen
│   │   │   ├── auth/                # Login + Register
│   │   │   ├── dashboard/           # Host dashboard
│   │   │   ├── quiz/                # Quiz builder
│   │   │   └── game/                # Host game screens
│   │   ├── hooks/                   # useWebSocket, useGame, useTimer
│   │   ├── services/                # Axios API functions
│   │   ├── store/                   # Zustand state slices
│   │   ├── animations/              # Framer Motion variants
│   │   └── utils/                   # Helper functions
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                         # Rust + Axum API server
│   ├── src/
│   │   ├── main.rs                  # Server entry + router setup
│   │   ├── routes/                  # Route definitions per feature
│   │   ├── handlers/
│   │   │   ├── auth.rs              # Login, register handlers
│   │   │   ├── quiz.rs              # Quiz CRUD handlers
│   │   │   ├── game.rs              # Room creation, joining
│   │   │   └── websocket.rs         # WebSocket game engine
│   │   ├── game/
│   │   │   ├── engine.rs            # Question timer + scoring logic
│   │   │   ├── room.rs              # Room state management
│   │   │   └── player.rs            # Player state
│   │   ├── models/                  # DB structs + serde models
│   │   ├── middleware/              # JWT extractor, CORS
│   │   ├── db/                      # SQLx connection pool
│   │   ├── errors/                  # Custom AppError type
│   │   └── config/                  # Env config loader
│   ├── migrations/                  # SQLx versioned migration files
│   ├── Cargo.toml
│   ├── Dockerfile
│   └── .env.example
│
└── README.md
```

---

## 🏁 Getting Started

### Prerequisites

Make sure you have these installed before starting:

- [Node.js](https://nodejs.org/) v18+
- [npm](https://npmjs.com) or [yarn](https://yarnpkg.com)
- [Rust](https://rustup.rs/) latest stable
- [SQLx CLI](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli)
- A [Neon](https://neon.tech) account with a PostgreSQL database created

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install SQLx CLI
cargo install sqlx-cli --no-default-features --features postgres
```

---

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/quizrush.git

# 2. Enter the project directory
cd quizrush

# 3. Install frontend dependencies
cd frontend && npm install

# 4. Build the Rust backend
cd ../backend && cargo build
```

---

### Environment Variables

#### Backend — `backend/.env`

```bash
cp backend/.env.example backend/.env
```

```env
# Neon PostgreSQL — copy from your neon.tech dashboard
DATABASE_URL=postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/quizrush?sslmode=require

# JWT
JWT_SECRET=your_super_long_random_secret_key_here
JWT_EXPIRY_HOURS=24

# Server
HOST=0.0.0.0
PORT=8080

# Frontend origin for CORS
FRONTEND_URL=http://localhost:5173
```

#### Frontend — `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080/ws
VITE_APP_NAME=QuizRush
```

---

### Database Setup

```bash
cd backend

# Run all migrations — sets up the full database schema
sqlx migrate run

# Check migration status
sqlx migrate info

# Revert last migration if needed
sqlx migrate revert
```

> ⚠️ Make sure `DATABASE_URL` in your `.env` is set to your Neon connection string before running migrations.

---

### Running the App

#### Start the Backend (Rust + Axum)
```bash
cd backend
cargo run
```
> API server: `http://localhost:8080`
> WebSocket server: `ws://localhost:8080/ws`

#### Start the Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
> Frontend: `http://localhost:5173`

#### Run Both at Once
```bash
# Terminal 1
cd backend && cargo run

# Terminal 2
cd frontend && npm run dev
```

---

## 📡 API & WebSocket Documentation

### Standard API Response Format

```json
// Success
{ "success": true, "data": {}, "message": "Operation successful" }

// Error
{ "success": false, "error": "ERROR_CODE", "message": "Human readable message" }
```

### REST Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None | Register a host account |
| `POST` | `/api/v1/auth/login` | None | Login and receive JWT |
| `GET` | `/api/v1/quizzes` | JWT | Get all quizzes for the host |
| `POST` | `/api/v1/quizzes` | JWT | Create a new quiz |
| `PUT` | `/api/v1/quizzes/:id` | JWT | Update an existing quiz |
| `DELETE` | `/api/v1/quizzes/:id` | JWT | Delete a quiz |
| `POST` | `/api/v1/games` | JWT | Create a new game room |
| `GET` | `/api/v1/games/:room_code` | None | Get room info for joining |
| `GET` | `/api/v1/games/:id/results` | JWT | Get final game results |
| `GET` | `/api/v1/games/:id/export` | JWT | Export results as CSV |

### WebSocket Events

#### Client → Server
```json
{ "event": "join_room", "room_code": "ABC123", "nickname": "Player1" }
{ "event": "submit_answer", "question_id": "uuid", "answer_id": "uuid" }
{ "event": "host_start_game" }
{ "event": "host_next_question" }
{ "event": "host_end_game" }
```

#### Server → Client
```json
{ "event": "player_joined", "data": { "players": [] } }
{ "event": "game_started", "data": { "question": {}, "timer": 20 } }
{ "event": "answer_received", "data": { "correct": true, "points": 850 } }
{ "event": "leaderboard_update", "data": { "leaderboard": [] } }
{ "event": "game_ended", "data": { "winner": {}, "final_leaderboard": [] } }
```

---

## 🔍 SEO Configuration

Every page is fully configured with:

- Unique `<title>` and `<meta name="description">` per route
- Open Graph tags for rich previews on WhatsApp, Twitter, LinkedIn
- Twitter Card tags
- JSON-LD `WebApplication` structured data on the landing page
- Canonical URL tags on all pages
- `sitemap.xml` listing all public routes
- `robots.txt` blocking `/dashboard` and all protected routes

**Target keywords:** `free kahoot alternative`, `multiplayer quiz game`, `real-time quiz platform`, `online quiz for teams`

---

## 🚀 Deployment

### Frontend — Vercel
```bash
cd frontend
npm install -g vercel
vercel --prod
```
Add all `VITE_*` environment variables in **Vercel Dashboard → Settings → Environment Variables.**

### Backend — Railway or Fly.io

#### Build with Docker
```bash
cd backend
docker build -t quizrush-api .
docker run -p 8080:8080 --env-file .env quizrush-api
```

#### Deploy to Railway
1. Push this repo to GitHub
2. Connect repo on [Railway](https://railway.app)
3. Set root directory to `backend/`
4. Add all environment variables from `.env`
5. Railway auto-detects the Dockerfile and deploys automatically

#### Deploy to Fly.io
```bash
cd backend
flyctl launch
flyctl deploy
```

### Database — Neon
1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project and copy the connection string
3. Set it as `DATABASE_URL` in your backend environment
4. Run `sqlx migrate run` to initialize the full schema

---

## 🤝 Contributing

Contributions are always welcome! Here is how to get started:

1. Fork this repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

Please make sure your code:
- Passes `cargo clippy` with zero warnings on the backend
- Passes `npm run lint` on the frontend
- Includes clear comments and updated documentation

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Built with ❤️ — Faster than Kahoot. Prettier than Quizizz. Free forever.

**⭐ If this project helped you, please give it a star!**

</div>
