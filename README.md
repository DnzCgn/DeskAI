# DESKA — AI Desktop Agent & Enterprise Monitoring Brain

Voice-activated desktop assistant with enterprise remote control, performance analytics, and self-service multi-tenant SaaS architecture.

## Project Structure

```
DeskaAıDeneme/
├── backend/          Node.js API (Express + MongoDB + WebSocket)
├── frontend/         React admin panel (Vite + Tailwind + ReactBits)
├── desktop/          Python desktop agent (pystray + audio pipeline)
├── .github/          CI/CD (GitHub Actions)
├── render.yaml       Render deployment blueprint
├── docker-compose.yml
└── README.md
```

## Quick Start — Local Development

### 1. Backend

```bash
cd backend
cp .env.example .env          # fill in JWT_SECRET (others optional for dev)
npm install
npm run dev                   # starts on :4000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                   # starts on :5173, proxies /api → :4000
```

### 3. Desktop

```bash
cd desktop
pip install -r requirements.txt
python main.py                # tray icon + audio pipeline
```

## Pre-Deploy Checklist

Complete these steps before deploying to production.

### ☐ 1. MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → **Create a free cluster**
2. Click **Connect** → **Drivers** → copy the connection string
3. Replace placeholders with your username, password, and cluster hostname:
   ```
   mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/deska?retryWrites=true&w=majority
   ```
4. Paste into `MONGODB_URI` in your env vars

### ☐ 2. JWT Secret

Generate a secure random secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Set `JWT_SECRET` to this value in your env vars.

### ☐ 3. AI Provider API Keys

| Provider | Sign Up | Env Var |
|---|---|---|
| DeepSeek | [platform.deepseek.com](https://platform.deepseek.com) | `DEEPSEEK_API_KEY` |
| Gemini | [aistudio.google.com](https://aistudio.google.com) | `GEMINI_API_KEY` |

Set `DEEPSEEK_BASE_URL` to `https://api.deepseek.com/v1` (default).

### ☐ 4. Stripe (Payments)

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Copy your **secret key** → `STRIPE_SECRET_KEY`
3. Create a webhook endpoint pointing to `https://your-domain.com/api/stripe/webhook`
   - Events needed: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the **webhook signing secret** → `STRIPE_WEBHOOK_SECRET`

### ☐ 5. CORS Origin

Set `CORS_ORIGIN` to your frontend domain (e.g., `https://app.deska.ai`).

### ☐ 6. Environment Variables — Final Check

Verify all 10 env vars are set:

| Var | Required | Default |
|---|---|---|
| `PORT` | No | `4000` |
| `CORS_ORIGIN` | **Yes (prod)** | `http://localhost:5173` |
| `MONGODB_URI` | **Yes (prod)** | `mongodb://localhost:27017/deska` |
| `JWT_SECRET` | **Yes** | — |
| `JWT_EXPIRES_IN` | No | `7d` |
| `DEEPSEEK_API_KEY` | **Yes** | — |
| `DEEPSEEK_BASE_URL` | No | `https://api.deepseek.com/v1` |
| `GEMINI_API_KEY` | **Yes** | — |
| `STRIPE_SECRET_KEY` | **Yes** | — |
| `STRIPE_WEBHOOK_SECRET` | **Yes** | — |

### ☐ 7. Frontend Production Build

```bash
cd frontend

# Set your deployed backend URL
# Edit .env.production to set your backend URL, then:
# VITE_API_URL=https://your-backend.com/api

# Build
npm run build        # output in dist/
```

### ☐ 8. Run Tests

```bash
cd backend
npm test             # E2E tests (mongodb-memory-server, no external DB needed)
```

### ☐ 9. CI Pipeline

The `.github/workflows/ci.yml` runs automatically on every push/PR:
- Backend E2E tests (in-memory MongoDB)
- Frontend production build
- Lint (backend syntax + frontend oxlint)

## Deploy

### Option A — Render (recommended)

1. Push this repo to GitHub
2. Connect on [dashboard.render.com](https://dashboard.render.com)
3. Render auto-detects `render.yaml` — deploys the Docker service
4. Set secrets in the Render dashboard (step ☐ 1–5 above)

### Option B — Docker

```bash
cp backend/.env.example backend/.env   # fill in all secrets
docker compose up --build
```

### Option C — Manual

```bash
cd backend && npm ci && npm start
```

Serves on `:4000` with WebSocket on `/ws` and health check at `/health`.

## API Endpoints

| Method | Path | Auth |
|---|---|---|
| `GET` | `/health` | Public |
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/auth/set-password` | Public |
| `GET` | `/api/auth/me` | Authenticated |
| `PUT` | `/api/auth/profile` | Authenticated |
| `GET` | `/api/auth/users` | Admin |
| `POST` | `/api/auth/invite` | Admin |
| `POST` | `/api/auth/offboard` | Admin |
| `POST` | `/api/auth/mfa/setup` | Authenticated |
| `POST` | `/api/auth/mfa/verify` | Authenticated |
| `POST` | `/api/auth/mfa/disable` | Authenticated |
| `GET` | `/api/org` | Authenticated |
| `PUT` | `/api/org` | Admin |
| `GET` | `/api/devices` | Authenticated |
| `POST` | `/api/devices/:id/command` | Admin |
| `GET` | `/api/plans` | Public |
| `POST` | `/api/stripe/checkout` | Authenticated |
| `POST` | `/api/speech/stt` | Authenticated |
| `POST` | `/api/speech/tts` | Authenticated |
| `POST` | `/api/reasoning` | Authenticated |

WebSocket: `ws://host/ws?token=<JWT>` (admin) or `ws://host/ws?token=<JWT>&deviceId=<id>` (device)

## Tech Stack

- **Backend:** Node.js 20, Express, MongoDB/Mongoose, WebSocket (ws), Stripe
- **Frontend:** React 19, Vite 8, Tailwind CSS 4, ReactBits, Framer Motion, Recharts
- **Desktop:** Python 3, pystray, pynput, sounddevice, cryptography, PyInstaller
