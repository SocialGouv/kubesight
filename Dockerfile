FROM node:20-alpine@sha256:73753e08a8755a0838696135be60a5f1e33c6cf92a15bc4e71465f3d0fda6422 as base
RUN apk add --no-cache libc6-compat curl

# renovate: datasource=github-tags depName=kubernetes/kubectl extractVersion=^kubernetes-(?<version>.+)$
ARG KUBECTL_VERSION=1.27.1
ENV KUBECTL_VERSION=$KUBECTL_VERSION
RUN curl --fail -sL https://dl.k8s.io/release/v${KUBECTL_VERSION}/bin/linux/amd64/kubectl > /usr/local/bin/kubectl \
  && chmod +x /usr/local/bin/kubectl

WORKDIR /app

# Rebuild the source code only when needed
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED 1

# install deps
COPY yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN yarn fetch

# build
COPY . .
RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nextjs

COPY entrypoint.sh .

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER 1001
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
