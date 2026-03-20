# Server Deployment (Vercel)

This backend is configured to deploy on Vercel as a Node.js serverless function.

## Vercel Project Settings

- Root Directory: `server`
- Framework Preset: `Other`
- Build Command: leave empty
- Output Directory: leave empty

`vercel.json` routes all paths to `api/index.js`.

## Required Environment Variables

Set these in Vercel Project Settings for the server project:

- `PORT=5002` (optional on Vercel, kept for local parity)
- `MONGO_URI=...`
- `JWT_SECRET=...`
- `STRIPE_SECRET=...`
- `RAZORPAY_KEY_ID=...`
- `RAZORPAY_KEY_SECRET=...`
- `GOOGLE_AI_API_KEY=...`
- `EMAIL_USER=...`
- `EMAIL_PASSWORD=...`
- `CLOUDINARY_CLOUD_NAME=...`
- `CLOUDINARY_API_KEY=...`
- `CLOUDINARY_API_SECRET=...`
- `CLIENT_URL=https://<your-frontend>.vercel.app`
- `CORS_ORIGINS=https://<your-frontend>.vercel.app,https://<your-custom-domain>`

## Important Notes

- Socket.IO real-time server is enabled only in local Node server mode.
- On Vercel serverless, HTTP API routes work; persistent WebSocket behavior is not guaranteed.
- Local `uploads/` filesystem is ephemeral on serverless platforms. Prefer Cloudinary URLs for persisted assets.
