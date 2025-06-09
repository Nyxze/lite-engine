import { EventDispatcher, Object3D} from "three";

export type RouteHandler = (ctx:Context) => void
export class Component extends Object3D {
    start() { }
    update(ts: number) { }
    dispose() { }
}

export class SceneManager extends EventDispatcher<any> {
    private scenes: Record<string, RouteHandler> = {};
    constructor() {
        super(); 
        const handler = () => {
            this.dispatchEvent({ type: "scene_unload" });
            const url = window.location.hash.slice(1) || "/";
            const fn = this.scenes[url];
            if (!fn) {
                console.error(`No route found for: ${url}`);
                return;
            }
            
            try {
                this.dispatchEvent({ type: "scene_load", scene: fn() });
            } catch (e) {
                console.error(`Error loading route ${url}`, e);
            }
        }

        // Bind callback to window related events
        window.addEventListener('load', handler);
        window.addEventListener('hashchange', handler);
    }

    public add(path: string, factory: () => Component): void {
        this.scenes[path] = factory;
    }

    public load(path: string) {
        const fn = this.scenes[path];
        if (!fn) {
            console.error(`No route found for: ${path}`);
            return;
        }
        window.location.href = '#' + path
    }
}
