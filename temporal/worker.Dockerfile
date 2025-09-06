FROM node:20-slim as base
WORKDIR /app

# Install dependencies first for better caching
COPY package.json package-lock.json* ./
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/* \
    && npm ci --only=production

# Copy source
COPY . .

ENV NODE_ENV=production

# Configure Temporal address and namespace via env at deploy time
# ENV TEMPORAL_ADDRESS=temporalite:7233
# ENV TEMPORAL_NAMESPACE=default
# ENV TEMPORAL_TLS=false

CMD ["npx", "tsx", "temporal/workers/chat-worker.ts"]
