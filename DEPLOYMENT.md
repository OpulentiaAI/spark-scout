Deployment Guide: Vercel (Frontend) + Railway (Temporal)

Overview
- Frontend + API routes: Vercel
- Temporal Service (Temporalite or Temporal Cloud) + Worker: Railway (or any host)

Requirements
- Vercel CLI logged in and project linked
- Railway CLI logged in

1) Temporal on Railway

Option A — Temporalite (dev/staging)
- Create service from image `temporalio/temporalite:latest`
- Expose TCP port 7233
- Start command:
  temporalite start --namespace default --port 0.0.0.0:7233
- Copy the TCP endpoint Railway assigns (host:port)

Option B — Temporal Cloud (production)
- Get Namespace endpoint (region-specific) from Temporal Cloud
- Generate an API key in Temporal Cloud

2) Worker on Railway
- Use the included Dockerfile `temporal/worker.Dockerfile`
- Env vars (Temporalite):
  - TEMPORAL_ADDRESS: <temporalite host:port>
  - TEMPORAL_NAMESPACE: default
  - TEMPORAL_TLS: false
- Env vars (Temporal Cloud):
  - TEMPORAL_ADDRESS: <namespace-endpoint:7233>
  - TEMPORAL_NAMESPACE: <your-namespace>
  - TEMPORAL_TLS: true
  - TEMPORAL_API_KEY: <temporal cloud API key>
- Provider keys as needed (OPENAI_API_KEY, FIRECRAWL_API_KEY, etc.)

Troubleshooting: Docker build context
- If your build fails with an error like "/package.json": not found at a `COPY package.json bun.lock ./` step, the platform likely detected and used `temporal/Dockerfile` with the `temporal/` folder as the build context. That context does not include the repo root where `package.json` and `bun.lock` live, and the worker also imports code from `lib/` at the repo root.
- Fix: explicitly set the Dockerfile path to `temporal/worker.Dockerfile` and ensure the build context/root directory is the repository root (`./`). Avoid using auto-detected `temporal/Dockerfile`.
- Local test: `docker build -f temporal/worker.Dockerfile . -t temporal-worker:dev` then run with your env vars: `docker run --rm -e TEMPORAL_ADDRESS=host:port -e TEMPORAL_NAMESPACE=default -e TEMPORAL_TLS=false temporal-worker:dev`.

3) Vercel (Frontend)
- Set env vars in Project Settings → Environment Variables:
  - AUTH_GOOGLE_ID (required for Google OAuth)
  - AUTH_GOOGLE_SECRET (required for Google OAuth)
  - AUTH_SECRET (required for NextAuth.js)
  - AUTH_REDIRECT_PROXY_URL (optional but recommended for preview deployments)
  - AUTH_TRUST_HOST (optional but recommended for Vercel deployments)
  - TEMPORAL_ADDRESS
  - TEMPORAL_NAMESPACE
  - TEMPORAL_TLS (true/false)
  - Optional: TEMPORAL_API_KEY (if using Temporal Cloud)
  - Provider/tool keys (OPENAI_API_KEY, FIRECRAWL_API_KEY, TAVILY_API_KEY, ...)
- Deploy via the UI or CLI

4) Sanity Checks
- New chat starts a Temporal workflow (first user message)
- Model selector change signals updateModel when a workflow exists
- Enhanced selector shows Pending approvals and Approve/Deny
- Google OAuth sign-in works without redirect_uri_mismatch errors

CLI Quick Reference
- Railway
  - railway init -n spark-scout-temporal
  - railway add --image temporalio/temporalite:latest --service temporalite --variables RAILWAY_TCP_PROXY_PORTS=7233
  - railway add --service temporal-worker --variables "RAILWAY_RUN_COMMAND=bun run temporal:worker:chat"
  - In the service settings, set Build type to Dockerfile, Dockerfile path to `temporal/worker.Dockerfile`, and Root Directory to the repo root (`./`).
  - railway service temporal-worker
  - railway variables --set "TEMPORAL_ADDRESS=<host:port>" --set "TEMPORAL_NAMESPACE=default" --set "TEMPORAL_TLS=false"
  - railway up --service temporal-worker --detach
- Vercel
  - vercel login
  - vercel env add AUTH_GOOGLE_ID production
  - vercel env add AUTH_GOOGLE_SECRET production
  - vercel env add AUTH_SECRET production
  - vercel env add AUTH_REDIRECT_PROXY_URL production
  - vercel env add AUTH_TRUST_HOST production
  - vercel env add TEMPORAL_ADDRESS production
  - vercel env add TEMPORAL_NAMESPACE production
  - vercel env add TEMPORAL_TLS production
  - vercel deploy

Security Notes
- Do not commit secrets to the repository.
- Rotate any credentials that were shared in plaintext or committed accidentally.
- Your Google OAuth client credentials should never be exposed publicly.
