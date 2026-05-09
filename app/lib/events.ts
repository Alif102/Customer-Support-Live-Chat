type Handler<T = any> = (payload: T) => void;

const channels = new Map<string, Set<Handler<any>>>();

export function publish<T = any>(channel: string, payload: T) {
  const handlers = channels.get(channel);
  if (!handlers) return;

  for (const handler of handlers) {
    handler(payload);
  }
}

export function subscribe<T = any>(
  channel: string,
  handler: Handler<T>
) {
  if (!channels.has(channel)) {
    channels.set(channel, new Set());
  }

  channels.get(channel)!.add(handler as Handler<any>);

  return () => {
    const handlers = channels.get(channel);
    if (!handlers) return;

    handlers.delete(handler as Handler<any>);

    if (handlers.size === 0) {
      channels.delete(channel);
    }
  };
}