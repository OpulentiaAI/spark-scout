FROM oven/bun:1.1 as base
WORKDIR /app

# Install dependencies first for better caching
COPY package.json bun.lock* ./
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/* \
    && bun install --no-frozen-lockfile

# Copy source
COPY . .

ENV NODE_ENV=production

# Configure Temporal address and namespace via env at deploy time
# ENV TEMPORAL_ADDRESS=temporalite:7233
# ENV TEMPORAL_NAMESPACE=default
# ENV TEMPORAL_TLS=false

CMD ["bun", "run", "temporal:worker:chat"]
