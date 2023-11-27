// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
const { withSentryConfig } = require("@sentry/nextjs")

const path = require("path")
const { randomBytes } = require("crypto")
const { version, homepage } = require("./package.json")

const nonce = randomBytes(8).toString("base64")
process.env.NONCE = nonce

const sentryDomain = process.env.SENTRY_DOMAIN || ""

const ContentSecurityPolicy =
  process.env.NODE_ENV === "production"
    ? `
      default-src 'self';
      object-src 'none';
      base-uri 'none';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: authjs.dev;
      script-src 'nonce-${nonce}';
      connect-src 'self' ${sentryDomain};
    `
    : `
      default-src 'self';
      object-src 'none';
      base-uri 'none';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: authjs.dev;
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      connect-src 'self' ${sentryDomain};
    `

const securityHeaders = [
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
  },
]

module.exports = {
  swcMinify: true,
  optimizeFonts: false,
  reactStrictMode: true,
  sentry: {
    hideSourceMaps: true,
    disableClientWebpackPlugin: true,
    disableServerWebpackPlugin: true,
  },
  output: "standalone",
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_APP_REPOSITORY_URL: homepage,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = withSentryConfig(module.exports, { silent: true })
