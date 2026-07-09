# Universal Downloader — API

Express + yt-dlp backend for the Universal Video Downloader frontend.

## Structure

```
server/
├── server.js              # Entry — express app + middleware
├── routes/index.js        # /api router
├── controllers/           # HTTP layer (validation + response shaping)
├── services/ytdlp.js      # yt-dlp process wrapper
├── Dockerfile             # Node 20 + yt-dlp + ffmpeg
├── railway.json           # Railway deploy config
└── .env.example           # Copy to .env for local dev
```

## Endpoints

- `GET  /health` → `{ ok: true }`
- `POST /api/info`  body `{ url }` → metadata + formats
- `GET  /api/download?url=...&format=<format_id>` → streams file

## Local dev

Requires `yt-dlp` and `ffmpeg` on PATH.

```bash
cd server
cp .env.example .env
npm install
npm run start        # → http://localhost:8787
```

Then in the frontend project root:

```
VITE_API_URL=http://localhost:8787
```

## Deploy to Railway

1. Push this repo to GitHub.
2. On Railway → **New Project → Deploy from GitHub repo**.
3. Set the **Root Directory** to `server`. Railway auto-detects `railway.json`
   and builds from the Dockerfile (which includes yt-dlp + ffmpeg).
4. Set env vars:
   - `CORS_ORIGIN` — your frontend origin(s), comma-separated
   - `RATE_LIMIT_MAX` — (optional) requests/min per IP, default 30
5. Deploy. Railway assigns a public URL, e.g. `https://your-app.up.railway.app`.
6. In the frontend, set `VITE_API_URL` to that URL and redeploy.

## Notes

- Keep `yt-dlp` up to date — rebuild the image periodically.
- Rate limit defaults to 30 req/min per IP.
- `CORS_ORIGIN=*` is fine for testing; lock it down in production.
