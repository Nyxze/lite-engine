import { Context } from "../core/context"
import { Component } from "../core/component"

type SceneContext = {
    ctx: Context,
    route: string,
    params?: Record<string, string>,
    data?: any,
};

type NextFn = () => Promise<void>;

type SceneMiddleware = (ctx: SceneContext, next: NextFn) => Promise<void>;

// A function that receives the Context and returns a Component to be added for the route
export type RouteHandler = (ctx: Context) => Component

function compose(middleware: SceneMiddleware[]): SceneMiddleware {
    return async (ctx, next) => {
        let index = -1;
        async function dispatch(i: number): Promise<void> {
            if (i <= index) {
                throw new Error("next() called multiple times");
            }
            index = i;
            const fn = middleware[i] ?? next;
            if (fn) {
                await fn(ctx, () => dispatch(i + 1));
            }
        }
        await dispatch(0);
    };
}

export class SceneRouter extends Component {
    private globalMiddleware: SceneMiddleware[];
    private routes: Map<string, SceneMiddleware>;
    constructor(...globalMiddleware: SceneMiddleware[]) {
        super();
        this.globalMiddleware = globalMiddleware;
        this.routes = new Map();
    }

    add(route: string, ...handlers: SceneMiddleware[]) {
        const fullChain = [...this.globalMiddleware, ...handlers];
        this.routes.set(route, compose(fullChain));
    }

    async navigate(route: string) {
        const handler = this.routes.get(route);
        if (!handler) {
            throw new Error(`Route not found: ${route}`);
        }
        const ctx: SceneContext = { ctx: this.ctx!, route };
        await handler(ctx, async () => { });
    }
}
