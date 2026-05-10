import { EventEmitter } from "events"

// Ensure the emitter is a singleton across hot-reloads
const globalForEvents = global as typeof globalThis & {
  ee?: EventEmitter
}

const ee = globalForEvents.ee || new EventEmitter()
if (process.env.NODE_ENV !== "production") globalForEvents.ee = ee

export function publish(channel: string, payload: unknown) {
  console.log(`[Events] Publish to ${channel}:`, payload)
  ee.emit(channel, payload)
}

export function subscribe(channel: string, handler: (payload: unknown) => void) {
  console.log(`[Events] Subscribed to ${channel}`)
  ee.on(channel, handler)
  
  return () => {
    console.log(`[Events] Unsubscribed from ${channel}`)
    ee.off(channel, handler)
  }
}
