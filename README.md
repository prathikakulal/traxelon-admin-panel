# Traxelon Admin

Monorepo with separate **frontend** and **backend** directories for independent deployment.

```
Admin/
├── frontend/   ← React + Vite admin panel (deploy to Vercel / Netlify)
└── backend/    ← Express.js API server  (deploy to Railway / Render / Cloud Run)
```

---

## Frontend

### Local development
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### Build for production
```bash
cd frontend
npm run build        # output → frontend/dist/
```

### Environment variables (`frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

---

## Backend

### Local development
```bash
cd backend
npm install
cp .env.example .env   # fill in your values
node server.js         # http://localhost:5000
```

### Environment variables (`backend/.env`)
See [`backend/.env.example`](backend/.env.example) for all required variables.

### Endpoints
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `GET` | `/api/admin/status` | Service info |

---

## Deployment

| Part | Recommended Platform |
|---|---|
| Frontend | Vercel / Netlify |
| Backend | Railway / Render / Google Cloud Run |

> **Never commit** `backend/serviceAccountKey.json` — add it as an environment variable on your hosting platform instead.
