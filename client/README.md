# Client Deployment (Vercel)

This frontend is configured for Vercel deployment with React Router SPA rewrites.

## 1) Required environment variable

Create a `.env` from `.env.example` for local development, and set the same variable in Vercel Project Settings:

- `VITE_API_URL`: backend URL used by the frontend

How it works:

- set as origin (recommended): `https://api.yourdomain.com`
- if you set `https://api.yourdomain.com/api`, the app auto-normalizes it
- frontend constant `API_BASE_URL` is internal and is always derived as `${VITE_API_URL}/api`

Examples:

- local: `http://localhost:5002`
- production: `https://api.yourdomain.com`

## 2) Vercel project settings

When importing the repository in Vercel:

- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

`vercel.json` already includes SPA rewrites so direct route refreshes work.

## 3) Backend CORS

Your backend must allow the Vercel frontend domain. In server env:

- `CLIENT_URL=https://your-frontend.vercel.app`
- `CORS_ORIGINS=https://your-frontend.vercel.app,https://www.yourdomain.com`

The server now reads these values for both Express CORS and Socket.io CORS.
