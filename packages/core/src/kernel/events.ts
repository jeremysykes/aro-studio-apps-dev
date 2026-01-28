export type Unsubscribe = () => void;

export function createSubscription<T>(): {
  subscribe: (handler: (value: T) => void) => Unsubscribe;
  emit: (value: T) => void;
} {
  const handlers = new Set<(value: T) => void>();
  return {
    subscribe(handler: (value: T) => void): Unsubscribe {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    emit(value: T) {
      for (const h of handlers) h(value);
    },
  };
}
