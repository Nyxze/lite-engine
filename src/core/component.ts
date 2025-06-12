import { Object3D, Vector3 } from "three";
import { Context } from "./context";
import { EventBus } from "./event_bus";

interface ComponentEvents {
    'component:enabled': { id: string };
    'component:disabled': { id: string };
    'component:destroyed': { id: string };
}

/**
 * Base component class for the engine.
 * Components are the building blocks for game functionality.
 * Each component can be attached to game objects and provides specific behaviors.
 * 
 * @example
 * ```ts
 * class PlayerController extends Component {
 *     start() {
 *         this.object3D = new Object3D();
 *         this.scene.add(this.object3D);
 *     }
 * 
 *     update(dt: number) {
 *         if (this.isEnabled) {
 *             this.object3D.rotation.y += dt;
 *         }
 *     }
 * 
 *     onCollision(other: Component) {
 *         if (other.tag === 'enemy') {
 *             this.emit('player:hit', { damage: 10 });
 *         }
 *     }
 * }
 * ```
 */
export abstract class Component {
    private _ctx?: Context;
    private _enabled: boolean = true;
    private _object3D?: Object3D;
    private _tag: string = '';
    private _id: string;
    private _eventBus: EventBus<ComponentEvents>;
    private _components: Set<Component> = new Set();
    private _parent?: Component;

    constructor() {
        this._id = Math.random().toString(36).substr(2, 9);
        this._eventBus = new EventBus<ComponentEvents>();
    }

    /**
     * Access to the scene for convenience
     */
    public get scene() {
        return this.ctx.scene;
    }

    /**
     * The context this component belongs to
     */
    public get ctx(): Context {
        if (!this._ctx) {
            throw new Error("Context has not been set.");
        }
        return this._ctx;
    }

    public set ctx(value) {
        if (this._ctx) {
            throw new Error("Context has already been set");
        }
        this._ctx = value;
    }

    /**
     * The Three.js Object3D associated with this component
     */
    public get object3D(): Object3D | undefined {
        return this._object3D;
    }

    public set object3D(value: Object3D | undefined) {
        this._object3D = value;
    }

    /**
     * Whether the component is enabled and receiving updates
     */
    public get isEnabled(): boolean {
        return this._enabled;
    }

    /**
     * Enable or disable the component
     */
    public set isEnabled(value: boolean) {
        if (this._enabled !== value) {
            this._enabled = value;
            this._eventBus.emit(value ? 'component:enabled' : 'component:disabled', { id: this._id });
        }
    }

    /**
     * The tag used for identifying the component type
     */
    public get tag(): string {
        return this._tag;
    }

    public set tag(value: string) {
        this._tag = value;
    }

    /**
     * Unique identifier for the component
     */
    public get id(): string {
        return this._id;
    }

    /**
     * Get the world position of the component's Object3D
     */
    public get worldPosition(): Vector3 {
        return this._object3D?.getWorldPosition(new Vector3()) ?? new Vector3();
    }

    /**
     * Add a child component
     */
    public addComponent<T extends Component>(component: T): T;
    public addComponent<T extends Component>(ComponentClass: { new(...args: any[]): T }, ...args: any[]): T;
    public addComponent(arg: any, ...args: any[]) {
        this.ctx.addComponent(arg, ...args);
    }

    /**
     * Remove a child component
     */
    public removeComponent(component: Component): void {
        if (component._parent !== this) {
            throw new Error("Component is not a child of this component");
        }
        component._parent = undefined;
        this._components.delete(component);
        // Context will handle the actual removal and cleanup
    }

    /**
     * Get all child components
     */
    public getComponents(): Component[] {
        return Array.from(this._components);
    }

    /**
     * Find child components by tag
     */
    public getComponentsByTag(tag: string): Component[] {
        return Array.from(this._components).filter(c => c.tag === tag);
    }

    /**
     * Subscribe to component events
     */
    public on<K extends keyof ComponentEvents>(
        event: K,
        handler: (data: ComponentEvents[K]) => void
    ): () => void {
        return this._eventBus.on(event, handler);
    }

    /**
     * Emit a component event
     */
    protected emit<K extends keyof ComponentEvents>(
        event: K,
        data: ComponentEvents[K]
    ): void {
        this._eventBus.emit(event, data);
    }

    /**
     * Called when the component is initialized.
     * Can be synchronous or asynchronous.
     */
    start?(): void | Promise<void>;

    /**
     * Called every frame with the delta time in seconds
     */
    update?(dt: number): void;

    /**
     * Called when cleaning up the component
     */
    dispose?(): void;

    /**
     * Called when a collision occurs (if physics is enabled)
     */
    onCollision?(other: Component): void;

    /**
     * Called when the component becomes enabled
     */
    onEnable?(): void;

    /**
     * Called when the component becomes disabled
     */
    onDisable?(): void;

    /**
     * Called when the component receives a message
     */
    onMessage?(message: string, data?: any): void;
}