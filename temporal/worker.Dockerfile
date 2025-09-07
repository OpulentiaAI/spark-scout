# Use Node.js base image that supports bun
FROM oven/bun:1-slim as base
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lock ./

# Install dependencies with bun
RUN bun install --production --verbose

# Copy source code
COPY . .

# Set environment
ENV NODE_ENV=production

# Configure Temporal address and namespace via env at deploy time
# ENV TEMPORAL_ADDRESS=temporalite:7233
# ENV TEMPORAL_NAMESPACE=default
# ENV TEMPORAL_TLS=false

# Use bun to run the worker
CMD ["bun", "run", "temporal:worker:chat"]
