<div align="center">

<img src="public/opulent-logo_light.png" alt="Opulent OS" width="64" height="64">


# Opulent OS

**The new standard in operating systems**


*Multi-provider AI Chat - access Claude, ChatGPT, Gemini, and Grok with advanced features, open-source and production-ready.*

[**Try Sparka AI**](https://sparka.ai)


</div>

![sparka_gif_demo](https://github.com/user-attachments/assets/34a03eed-58fa-4b1e-b453-384351b1c08c)

Access every major AI assistant Claude, GPT-4, Gemini, Grok, and 20+ models through one interface. Get capabilities like document analysis, image generation, code execution, and research tools without managing multiple subscriptions. Try instantly, no signup required.


## ✨ Features

- **🤖 Multi-Model Chat** - Access 90+ AI models including Claude, GPT-5, Gemini, and Grok in one interface.

- **🔐 Authentication & Sync** - Secure authentication with chat history sync across all devices.

- **🎯 Easy to Try** - Try the interface and some features without creating an account.

- **📎 Attachment Support** - Upload and analyze images, PDFs, and documents in conversations.

- **🎨 AI-Powered Image Generation** - Generate and edit images with advanced AI models.

- **💻 Syntax Highlighting** - Beautiful code formatting and highlighting for all programming languages.

- **🔄 Resumable Streams** - Continue AI generations after page refreshes or interruptions.

- **🌳 Chat Branching** - Create alternative conversation paths without losing your original thread.

- **🔗 Chat Sharing** - Share conversations with others and collaborate on AI-assisted projects.

- **🔭 Deep Research** - Comprehensive research with real-time web search, source analysis, and cited findings.

- **⚡ Code Execution** - Run Python, JavaScript, and more in secure sandboxes.

- **📄 Document Creation** - Generate and edit documents, spreadsheets, and presentations.


## 🛠️ Tech Stack

Sparka AI is built with modern technologies for scalability and performance:

### **Frontend**
- **Next.js 15**: App Router with React Server Components
- **TypeScript**: Full type safety and developer experience
- **Tailwind CSS**: Responsive, utility-first styling
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations and transitions
- **Zustand**: Lightweight state management

### **Backend**
- **Vercel AI SDK**: Unified AI provider integration
- **tRPC**: End-to-end typesafe APIs
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Robust data persistence
- **Redis**: Caching and real-time features

### **AI Integration**
- **AI SDK v5**: Latest Vercel AI SDK for unified provider integration
- **AI SDK Gateway**: Models from various AI providers with automatic fallbacks


## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ or Bun
- PostgreSQL database
- Redis (optional, for scaling)

### **Quick Start**

1. **Clone and Install**
   ```bash
   git clone https://github.com/franciscomoretti/sparka.git
   cd sparka
   bun install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

3. **Database Setup**
   ```bash
   bun run db:migrate
   ```

4. **Development Server**
   ```bash
   bun dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to start using Sparka AI locally.


## ⏱ Temporal Integration

The app optionally integrates with Temporal for durable chat workflows, tool orchestration, and approvals.

- Env vars: set `TEMPORAL_ADDRESS` and `TEMPORAL_NAMESPACE` (see `.env.example`).
- Start a worker locally:
  ```bash
  bun run temporal:worker:chat
  ```
- API routes used by the UI:
  - `POST /api/temporal/start-chat` → starts `chatWorkflow`, returns `{ workflowId }`.
  - `POST /api/temporal/update-model` → signals model updates to a chat workflow.
  - `POST /api/temporal/approvals/request` → signals an approval request; returns an `approvalWorkflowId`.
  - `GET /api/temporal/approvals/pending?approvalWorkflowId=...` → lists pending approvals.
  - `POST /api/temporal/approvals/approve` → approve/deny a pending request.

Using Temporal CLI locally:
- Start a dev server: `temporal server start-dev --namespace default`
- List open workflows: `temporal workflow list --open`
- Describe a workflow: `temporal workflow describe --workflow-id <id>`
- Query a workflow (example current model):
  `temporal workflow query --type getCurrentModel --workflow-id <id>`
- Signal a workflow (example update model):
  `temporal workflow signal --signal updateModel --workflow-id <id> --input '{"model":"gpt-4o-mini","provider":"openai"}'`

Feature flags:
- `NEXT_PUBLIC_USE_TEXTMORPH_SELECTOR=true` enables the animated model selector.
- `NEXT_PUBLIC_USE_ENHANCED_SELECTOR=true` enables an approval-aware selector variant.


## 🙏 Acknowledgements

## Vercel Deployment

- Set environment variables in Vercel Project Settings → Environment Variables:
  - `AUTH_SECRET` (required for Auth.js). Generate with:
    - macOS/Linux: `openssl rand -base64 32`
    - Node: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
  - Provider keys as needed (e.g. `OPENAI_API_KEY`, `FIRECRAWL_API_KEY`, `TAVILY_API_KEY`).
  - Optional Temporal envs (`TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`) if using serverless APIs to talk to Temporal.

- Connect the repo to Vercel and deploy. The Next.js app runs on Vercel.
- Temporal Worker: run separately (e.g., a server, Fly.io, Render, or a background process) using:
  - `bun run temporal:worker:chat`
  - Point it at your Temporal service via `TEMPORAL_ADDRESS`/`TEMPORAL_NAMESPACE`.

## Railway Deployment (Temporal)

Use Railway for the Temporal service and the worker; deploy the Next.js frontend to Vercel.

1) Temporal service (Temporalite on Railway)
- Create a new Railway service using the official Temporalite image:
  - Service name: `temporalite`
  - Image: `temporalio/temporalite:latest`
  - Start command:
    ```bash
    temporalite start --namespace default --port 0.0.0.0:7233
    ```
- Expose TCP 7233. Railway will provide a TCP endpoint (host:port). Note it as `TEMPORAL_ADDRESS`.

2) Temporal Worker service (this repo)
- Add a service in the same Railway project using the included Dockerfile:
  - Dockerfile: `temporal/worker.Dockerfile`
  - Start command: inherited (`bun run temporal:worker:chat`)
  - Env vars:
    - `TEMPORAL_ADDRESS`: set to the Temporalite TCP endpoint host:port
    - `TEMPORAL_NAMESPACE=default`
    - `TEMPORAL_TLS=false` (Temporalite does not use TLS)
    - Provider keys as needed for tools (OPENAI_API_KEY, etc.)

3) Vercel (frontend + API routes)
- In Vercel Project Settings → Environment Variables set:
  - `TEMPORAL_ADDRESS`: same Railway Temporalite TCP endpoint (host:port)
  - `TEMPORAL_NAMESPACE=default`
  - `TEMPORAL_TLS=false`
  - `AUTH_SECRET` and provider keys
- The API routes will connect to Railway’s Temporalite using these envs.

Notes
- For Temporal Cloud or a TLS-enabled server, set `TEMPORAL_TLS=true` and supply the appropriate certificates per Temporal docs.
- You can also use the Temporal CLI locally to inspect workflows while developing.

Sparka AI was built on the shoulders of giants. We're deeply grateful to these outstanding open source projects:

- **[Vercel AI Chatbot](https://github.com/vercel/ai-chatbot)** - Core architecture and AI SDK integration patterns
- **[Scira](https://github.com/zaidmukaddam/scira)** - AI-powered search engine
