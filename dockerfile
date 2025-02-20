# Base
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app
RUN yarn global add pnpm
RUN yarn global add turbo

# Builder
FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
RUN turbo build 

# Runner
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 user
USER user

COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/fdm-app /app/fdm-app
COPY --from=builder --chown=nodejs:user /app/fdm-app /app/fdm-app

WORKDIR /app/fdm-app

ARG PORT=8080
ENV PORT=${PORT}
ENV NODE_ENV=production
EXPOSE ${PORT}

CMD ["pnpm", "start"]