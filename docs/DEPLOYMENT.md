# Deployment Guide

This covers deploying SVBBS for real, beyond local dev. The stack is a standard MERN split: a Node/Express API, a static-built React frontend, and MongoDB Atlas (which you're likely already using for local dev too).

## 1. Database — MongoDB Atlas

You're probably already using this for local development. For production:

1. In your Atlas cluster, create a **separate database** for production (e.g. `svbbs-prod`) rather than reusing your dev database — keeps demo/test data from ever mixing with real data.
2. Under **Network Access**, add the specific outbound IP of wherever you deploy the backend (not `0.0.0.0/0` — that's fine for local dev convenience, not for a real deployment).
3. Under **Database Access**, create a dedicated production database user with a strong, unique password — don't reuse your local dev credentials.

## 2. Backend — a Node host (Render, Railway, Fly.io, or similar)

This app is a standard Express server (`server.js`), no special build step beyond `npm install`. Any Node-capable host works. Using Render as the concrete example since it has a straightforward free tier for a project like this:

1. Push this repo to GitHub (or GitLab).
2. Create a new **Web Service** on Render, pointing at the `server` folder specifically (set the **Root Directory** to `server`).
3. Build command: `npm install`. Start command: `npm start` (this runs `node server.js`, not the `--watch` dev script).
4. Set every variable from `server/.env.example` in Render's environment variable settings — **never commit real `.env` values to the repo**. At minimum:
   - `NODE_ENV=production`
   - `MONGO_URI` — your production Atlas connection string, full database name included
   - `CLIENT_URL` — the real URL your frontend will be deployed at (this matters: it's what the CORS check validates against)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — generate fresh ones for production, don't reuse your local dev secrets (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` for each)
   - `ENCRYPTION_KEY` — exactly 32 characters, also fresh for production
   - Leave `MOCK_AI=true` and `MOCK_PAYMENTS=true` unless you have real Gemini/Razorpay credentials — there's no shame in a portfolio project running honestly in mock mode; the README already documents this directly
5. Once deployed, note the backend's public URL (e.g. `https://svbbs-api.onrender.com`).

## 3. Frontend — a static host (Vercel, Netlify, or similar)

The client is a standard Vite build producing static files — `npm run build` outputs to `client/dist`.

1. Create a new project on Vercel (or Netlify), pointing at the `client` folder (**Root Directory**: `client`).
2. Build command: `npm run build`. Output directory: `dist`.
3. Set `VITE_API_URL` to your deployed backend's URL **plus** `/api` (e.g. `https://svbbs-api.onrender.com/api`). This is the one case where the cross-port-URL caution in the README's Troubleshooting section doesn't apply — that warning is specifically about local dev, where the Vite proxy handles same-origin routing for you. In a real deployment, frontend and backend genuinely live on different domains, so an absolute `VITE_API_URL` is correct and necessary here, not a bug.
4. Once deployed, go back to your backend's environment variables and update `CLIENT_URL` to this frontend's real deployed URL, then redeploy the backend — CORS will reject requests from any origin that doesn't match exactly.

## 4. Seed the production database (once)

You generally don't want fake demo accounts in a real production database. If you do want the same demo accounts available for an interview/portfolio walkthrough on the deployed version (a reasonable choice for this specific use case), SSH into the backend host or run the seed script locally pointed at the production `MONGO_URI`:

```bash
cd server
MONGO_URI="<your production connection string>" npm run seed
```

Be deliberate about this — `npm run seed` performs a full wipe-and-reset of the books/users/transactions collections (by design, documented in the main README), so never run it against a database with real, non-demo user data in it.

## 5. Verify

- Visit the deployed frontend URL, confirm the landing page loads
- Try logging in with a demo account (if seeded) — confirms the frontend can actually reach the backend and CORS is configured correctly
- Check the backend's `/api/health` endpoint directly — should return `200` with no database dependency, useful as an uptime check target if your host supports one

## Notes on what's deliberately not covered here

- **CI/CD: tests and build verification are automated** (`.github/workflows/ci.yml`, see the main README), but **auto-deploy on push is still manual.** The pipeline verifies every change is genuinely safe to deploy — it deliberately doesn't deploy anything itself, since wiring that up would mean either committing real hosting credentials to GitHub Secrets for a host you may not have chosen yet, or claiming automation that isn't actually configured. Adding a deploy step once you've picked a specific host (Render, Railway, etc.) is a natural next step from here, not attempted prematurely.
- **Custom domain + HTTPS** — both Render and Vercel handle this for you on their free tiers with minimal extra configuration; not duplicated here since their own docs cover it well.
- **Horizontal scaling / load balancing** — out of scope for a portfolio-scale deployment; the architecture (stateless Express + MongoDB) doesn't prevent it later, but nothing here has been tested under real load.
