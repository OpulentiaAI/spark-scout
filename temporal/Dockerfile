FROM oven/bun:1.1
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

ENV NODE_ENV=production

# Configure via env at deploy time
# ENV TEMPORAL_ADDRESS=
# ENV TEMPORAL_NAMESPACE=default
# ENV TEMPORAL_TLS=false

CMD ["bun", "run", "temporal:worker:chat"]

