import { EventEmitter } from "events"

const ee = new EventEmitter()

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
