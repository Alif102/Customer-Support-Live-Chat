import { EventEmitter } from "events"
import { logger } from "@/lib/logger"

// Ensure the emitter is a singleton across hot-reloads
const globalForEvents = global as typeof globalThis & {
  ee?: EventEmitter
}

const ee = globalForEvents.ee || new EventEmitter()
if (process.env.NODE_ENV !== "production") globalForEvents.ee = ee

export function publish(channel: string, payload: unknown) {
  logger.info({ channel, payload }, "[Events] Publish")
  ee.emit(channel, payload)
}

export function subscribe(channel: string, handler: (payload: unknown) => void) {
  logger.info({ channel }, "[Events] Subscribed")
  ee.on(channel, handler)
  
  return () => {
    logger.info({ channel }, "[Events] Unsubscribed")
    ee.off(channel, handler)
  }
}
