/**
 * Generic, type-safe event bus.
 * Provide your own event map interface when instantiating:
 * ```ts
 * interface MyEvents {
 *   'user:login': { id: string };
 *   'scene:loaded': { name: string };
 * }
 * const bus = new EventBus<MyEvents>();
 * ```
 */
export class EventBus<M extends Record<string, any> = Record<string, any>> {
    private listeners: Map<keyof M, Set<(data: M[keyof M]) => void>> = new Map();

    /** Subscribe to an event */
    on<K extends keyof M>(event: K, handler: (data: M[K]) => void): () => void {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        (set as Set<(d: M[K]) => void>).add(handler);
        return () => {
            (set as Set<(d: M[K]) => void>).delete(handler);
            if ((set as Set<(d: M[K]) => void>).size === 0) this.listeners.delete(event);
        };
    }

    /** Subscribe once */
    once<K extends keyof M>(event: K, handler: (data: M[K]) => void): () => void {
        const dispose = this.on(event, (d) => {
            dispose();
            handler(d);
        });
        return dispose;
    }

    /** Emit an event */
    emit<K extends keyof M>(event: K, data: M[K]): void {
        const set = this.listeners.get(event) as Set<(d: M[K]) => void> | undefined;
        if (!set) return;
        set.forEach((h) => {
            try {
                h(data);
            } catch (err) {
                console.error(`Error in handler for ${String(event)}:`, err);
            }
        });
    }

    /** Clear listeners */
    clear(event?: keyof M): void {
        if (event) this.listeners.delete(event);
        else this.listeners.clear();
    }

    listenerCount(event: keyof M): number {
        return this.listeners.get(event)?.size ?? 0;
    }
}