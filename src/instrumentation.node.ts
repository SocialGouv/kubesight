import { NodeSDK } from "@opentelemetry/sdk-node"

import { Resource } from "@opentelemetry/resources"
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions"
import {
  SentrySpanProcessor,
  SentryPropagator,
} from "@sentry/opentelemetry-node"
import { startWatchingKube } from "./lib/node-kube"
// import { startCron } from "./lib/cron"

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "next-app",
  }),
  // Sentry config
  spanProcessor: new SentrySpanProcessor(),
  textMapPropagator: new SentryPropagator(),
})

sdk.start()

// startCron()
startWatchingKube()
