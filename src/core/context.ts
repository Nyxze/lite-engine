import { OrthographicCamera } from "three";
import { Clock, Mesh, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three"
import { Component } from "./component";
import { AssetDatabase } from "./assets_db";
import { PerfStats } from "../components/stats";
import { LifeCycleEvent, type LifeCycleCallback } from "./life_cycle_event";
import { EventBus } from "./event_bus";

/** Represents either a perspective or orthographic camera */
export type Camera = PerspectiveCamera | OrthographicCamera

/** Configuration options for initializing a Context */
export type ContextArgs = {
    /** Whether to display performance statistics */
    displayStats: boolean,
    /** The DOM element where the renderer will be attached */
    domElement: HTMLElement
}

/**
 * Core context class that manages the 3D scene, rendering, and component lifecycle.
 * Provides centralized control over the scene graph, rendering pipeline, and component system.
 * 
 * @example
 * ```ts
 * const canvas = document.querySelector('canvas');
 * const context = new Context({ 
 *   displayStats: true,
 *   domElement: canvas 
 * });
 * 
 * // Add components
 * context.addComponent(new MyCustomComponent());
 * 
 * // Set custom camera
 * context.setCamera(new PerspectiveCamera(75, window.innerWidth / window.innerHeight));
 * ```
 */
export class Context {
    /** Reference to the currently active context */
    static Current: Context;
    
    /** Reference to the main application */
    app: any;
    
    /** The WebGL renderer instance */
    renderer: WebGLRenderer
    
    /** The active camera used for rendering */
    mainCamera: Camera;
    
    /** The main scene graph */
    scene: Scene;
    
    /** Asset management system */
    assetDb: AssetDatabase
    
    /** Time elapsed since last frame in seconds */
    private deltaTime: number = 0
    
    /** Internal clock for tracking time */
    private clock: Clock;
    
    /** Map of lifecycle callbacks organized by event type */
    private callbacks: Map<LifeCycleEvent, Set<LifeCycleCallback>> = new Map([
        [LifeCycleEvent.Start, new Set()],
        [LifeCycleEvent.Update, new Set()],
        [LifeCycleEvent.Destroy, new Set()],
    ]);

    /**
     * Creates a default perspective camera with standard settings.
     * @returns {Camera} A new perspective camera with 75° FOV and standard near/far planes
     */
    defaultCamera(): Camera {
        return new PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
    }

    /**
     * Creates a new Context instance.
     * @param {ContextArgs} args - Configuration options for the context
     */
    constructor(args: ContextArgs) {
        this.clock = new Clock();
        this.renderer = new WebGLRenderer({ canvas: args.domElement })
        this.assetDb = new AssetDatabase()
        this.scene = new Scene()
        this.mainCamera = this.defaultCamera()

        if (args.displayStats) {
            this.addComponent(new PerfStats())
        }
        this.renderer.setAnimationLoop(() => this.update())
    }

    /**
     * Main update loop called every frame.
     * Handles time management, pre-render operations, and component updates.
     */
    update() {
        // Snapshot time
        this.deltaTime = this.clock.getDelta();
        // clamp delta time because if tab is not active clock.getDelta can get pretty big
        this.deltaTime = Math.min(.1, this.deltaTime);
        this._onPreRender()
        this.renderer.render(this.scene, this.mainCamera)
        this.invoke(LifeCycleEvent.Update)
    }

    /**
     * Sets the active camera used for rendering.
     * @param {Camera} camera - The camera to use for rendering
     */
    setCamera(camera: Camera) {
        this.mainCamera = camera;
    }

    /**
     * Adds a component to the context and sets up its lifecycle hooks.
     * @param {Component} cp - The component to add
     */
    addComponent(cp: Component) {
        cp.ctx = this
        // Register lifecycle callbacks
        if (cp.start) {
            this.registerCallback(cp.start.bind(cp), LifeCycleEvent.Start);
            cp.start();
        }

        if (cp.update) {
            const update = cp.update.bind(cp)
            this.registerCallback((_) => update(this.deltaTime), LifeCycleEvent.Update);
        }

        if (cp.dispose) {
            this.registerCallback(cp.dispose.bind(cp), LifeCycleEvent.Destroy);
        }
    }

    /**
     * Cleans up the scene by disposing of geometries and materials.
     * This helps prevent memory leaks by properly releasing WebGL resources.
     * @private
     */
    #cleanScene() {
        let scene = this.scene
        let disposedGeometries = 0;
        let disposedMaterials = 0;
        let warned = false;

        scene.traverse((obj: Object3D) => {
            const mesh = obj as Mesh;

            // Dispose geometry
            if (mesh.geometry) {
                if (typeof mesh.geometry.dispose === "function") {
                    mesh.geometry.dispose();
                    disposedGeometries++;
                } else {
                    console.warn("Geometry missing dispose():", mesh.geometry);
                    warned = true;
                }
            }

            // Dispose material(s)
            if (mesh.material) {
                const material = mesh.material;
                if (Array.isArray(material)) {
                    for (const mat of material) {
                        if (typeof mat.dispose === "function") {
                            mat.dispose();
                            disposedMaterials++;
                        } else {
                            console.warn("Material in array missing dispose():", mat);
                            warned = true;
                        }
                    }
                } else {
                    if (typeof material.dispose === "function") {
                        material.dispose();
                        disposedMaterials++;
                    } else {
                        console.warn("Material missing dispose():", material);
                        warned = true;
                    }
                }
            }
        });

        // Clear children from the scene
        scene.children.length = 0;

        // Warn if any children still remain
        if (scene.children.length > 0) {
            console.warn("Scene still has children after cleanup:", scene.children);
            warned = true;
        }

        console.log(`Disposed ${disposedGeometries} geometries, ${disposedMaterials} materials.`);
        if (!warned) {
            console.log("✅ Scene cleaned up with no leftover resources.");
        }
    }

    /**
     * Clears the context, disposing of all components and cleaning up the scene.
     * This should be called when you want to reset the context or clean up before destruction.
     */
    clear() {
        this.invoke(LifeCycleEvent.Destroy)
        this.callbacks.clear();
        this.#cleanScene()
    }

    /**
     * Invokes all callbacks registered for a specific lifecycle event.
     * @param {LifeCycleEvent} evt - The lifecycle event to trigger
     */
    invoke(evt: LifeCycleEvent) {
        const funcs = this.callbacks.get(evt)
        if (!funcs) {
            return
        }
        for (const fn of funcs) {
            fn(this)
        }
    }

    /**
     * Registers a callback for a specific lifecycle event.
     * @param {LifeCycleCallback} cb - The callback function to register
     * @param {LifeCycleEvent} type - The lifecycle event type
     */
    registerCallback(cb: LifeCycleCallback, type: LifeCycleEvent) {
        const funcs = this.callbacks.get(type)
        if (!funcs) {
            this.callbacks.set(type, new Set())
        }
        this.callbacks.get(type)?.add(cb);
    }

    /**
     * Removes a callback from a specific lifecycle event.
     * @param {LifeCycleCallback} cb - The callback function to remove
     * @param {LifeCycleEvent} type - The lifecycle event type
     */
    removeCallback(cb: LifeCycleCallback, type: LifeCycleEvent) {
        this.callbacks.get(type)?.delete(cb);
    }

    /**
     * Handles pre-render operations including canvas resize and camera aspect ratio updates.
     * @private
     */
    _onPreRender() {
        const canvas = this.renderer.domElement
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        if (width == canvas.width && canvas.height == height) {
            return
        }
        this.renderer.setSize(width, height, false)
        if (this.mainCamera instanceof PerspectiveCamera) {
            this.mainCamera.aspect = width / height
            this.mainCamera.updateProjectionMatrix()
        }
    }
}
