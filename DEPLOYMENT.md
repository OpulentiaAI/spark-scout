# Deployment Guide: Railway + Vercel

This guide provides step-by-step instructions for deploying Opulent OS using Railway for Temporal + Worker and Vercel for the frontend.

## Architecture Overview

- **Railway**: Hosts Temporalite service and Temporal worker
- **Vercel**: Hosts Next.js frontend and API routes
- **Communication**: Frontend API routes connect to Railway's Temporal service

## Railway Deployment (Temporal + Worker)

### 1. Temporalite Service

Create a Temporal service using the official Temporalite image:

**Service Configuration:**
- **Service name**: `temporalite`
- **Image**: `temporalio/temporalite:latest`
- **Start command**: 
  ```bash
  temporalite start --namespace default --port 0.0.0.0:7233
  ```
- **Port**: Expose TCP 7233

Railway will provide a TCP endpoint (host:port) - note this as your `TEMPORAL_ADDRESS`.

### 2. Temporal Worker Service

Create a worker service from this repository:

**Service Configuration:**
- **Source**: This repository
- **Dockerfile**: `temporal/worker.Dockerfile`
- **Start command**: `bun run temporal:worker:chat` (inherited from Dockerfile)

**Environment Variables:**
```bash
TEMPORAL_ADDRESS=<temporalite-tcp-endpoint-host:port>
TEMPORAL_NAMESPACE=default
TEMPORAL_TLS=false
```

**Provider API Keys (as needed):**
```bash
OPENAI_API_KEY=<your-openai-key>
FIRECRAWL_API_KEY=<your-firecrawl-key>
TAVILY_API_KEY=<your-tavily-key>
E2B_API_KEY=<your-e2b-key>
SANDBOX_TEMPLATE_ID=<your-sandbox-template>
```

### Railway CLI Commands

```bash
# Login to Railway
railway login

# Initialize/link project
railway init
# or
railway link

# Create temporalite service (use Railway UI for image-based services)
# 1. Go to Railway dashboard
# 2. Add service → Deploy from Docker image
# 3. Image: temporalio/temporalite:latest
# 4. Configure start command and expose port 7233

# Create worker service
railway add
# Select: Deploy from GitHub repo
# Configure with temporal/worker.Dockerfile

# Set environment variables for worker
railway variables set TEMPORAL_ADDRESS=<host:port> TEMPORAL_NAMESPACE=default TEMPORAL_TLS=false -s temporal-worker
railway variables set OPENAI_API_KEY=<key> -s temporal-worker
# Repeat for other required API keys

# Deploy
railway up
```

## Vercel Deployment (Frontend + API Routes)

### Environment Variables

Set these in Vercel Project Settings → Environment Variables:

**Required:**
```bash
AUTH_SECRET=<32-char-random-string>
```

Generate AUTH_SECRET:
```bash
# macOS/Linux
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Temporal Configuration:**
```bash
TEMPORAL_ADDRESS=<same-railway-temporalite-host:port>
TEMPORAL_NAMESPACE=default
TEMPORAL_TLS=false
```

**Provider API Keys (as needed):**
```bash
OPENAI_API_KEY=<your-openai-key>
FIRECRAWL_API_KEY=<your-firecrawl-key>
TAVILY_API_KEY=<your-tavily-key>
E2B_API_KEY=<your-e2b-key>
SANDBOX_TEMPLATE_ID=<your-sandbox-template>
```

### Vercel CLI Commands

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Deploy
vercel deploy

# Deploy to production
vercel deploy --prod
```

## Environment Configuration

### .env.example includes:
```bash
TEMPORAL_TLS=false
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
```

### Local Development:
```bash
# Copy example environment
cp .env.example .env.local

# Add your AUTH_SECRET and API keys to .env.local
```

## Verification Steps

### Frontend/API (Vercel)

1. **Start a new chat**: First message should auto-start a Temporal workflow
2. **Model change**: Should signal updateModel when workflow exists
3. **Enhanced selector**: Shows Pending approvals and Approve/Deny buttons

### Temporal via CLI

```bash
# List workflows
temporal workflow list --open

# Describe workflow
temporal workflow describe --workflow-id <id>

# Query workflow (example: current model)
temporal workflow query --type getCurrentModel --workflow-id <id>

# Signal workflow (example: update model)
temporal workflow signal --signal updateModel --workflow-id <id> --input '{"model":"gpt-4o-mini","provider":"openai"}'
```

## Feature Flags

Configure these in your environment:

```bash
# Enable animated model selector
NEXT_PUBLIC_USE_TEXTMORPH_SELECTOR=true

# Enable approval-aware selector variant
NEXT_PUBLIC_USE_ENHANCED_SELECTOR=true
```

## Code Configuration

### TLS Support
- `temporal/client/temporal-client.ts` honors `TEMPORAL_TLS` environment variable
- Works with Temporalite on Railway (non-TLS) and Temporal Cloud (TLS)

### Default Model
- Default chat model: `openai/gpt-5` (configured in `lib/ai/all-models.ts`)

### Compare Features
- Header includes "Featured Compare" link: `/compare/qwen/qwen3-max/openai/gpt-5`
- Default compare when no slug: `qwen/qwen3-max` vs `openai/gpt-5`

## Troubleshooting

### Common Issues

1. **Temporal connection failed**: Verify `TEMPORAL_ADDRESS` matches Railway's TCP endpoint
2. **Worker not processing**: Check worker logs in Railway dashboard
3. **Auth issues**: Ensure `AUTH_SECRET` is properly set in Vercel
4. **API timeouts**: Verify all required API keys are configured

### Debugging

```bash
# Check Temporal service health
curl http://<temporal-address>/health

# View Railway logs
railway logs -s temporalite
railway logs -s temporal-worker

# View Vercel function logs
vercel logs --follow
```

## Notes

- For Temporal Cloud or TLS-enabled servers, set `TEMPORAL_TLS=true`
- Supply appropriate certificates per Temporal documentation
- Use Temporal CLI locally to inspect workflows during development
- Railway provides automatic HTTPS for web services
- Vercel automatically handles SSL/TLS for the frontend
