import { OrthographicCamera } from "three";
import { Clock, Mesh, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three"
import { Component } from "./component";
import { AssetDatabase } from "./assets_db";
import { PerfStats } from "../components/stats";
import { LifeCycleEvent, type LifeCycleCallback } from "./life_cycle_event";

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
 * Represents the initialization state of a component
 */
interface ComponentState {
    component: Component;
    initializationPromise?: Promise<void>;
    isInitialized: boolean;
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

    
    /** Active components in the context */
    private activeComponents: Map<Component, ComponentState> = new Map();

    /** Components pending initialization */
    private pendingStart: Set<Component> = new Set();

    /** Components pending removal */
    private pendingRemoval: Set<Component> = new Set();
    
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
     * Processes pending component operations and updates active components.
     */
    update() {
        // Process pending operations - this is now async
        this.processPendingOperations().catch(error => {
            console.error("Error processing pending operations:", error);
        });

        // Update time
        this.deltaTime = this.clock.getDelta();
        this.deltaTime = Math.min(.1, this.deltaTime);

        // Pre-render operations
        this._onPreRender();

        // Update components
        this.updateComponents();

        // Render
        this.renderer.render(this.scene, this.mainCamera);
    }

    /**
     * Process components pending start or removal
     */
    private async processPendingOperations() {
        // Initialize pending components
        const startPromises: Promise<void>[] = [];

        for (const component of this.pendingStart) {
            const state: ComponentState = {
                component,
                isInitialized: false
            };

            if (component.start) {
                try {
                    const startResult = component.start();
                    // Check if start returns a Promise
                    if (startResult instanceof Promise) {
                        state.initializationPromise = startResult;
                        startPromises.push(
                            startResult
                                .then(() => {
                                    state.isInitialized = true;
                                })
                                .catch(error => {
                                    console.error(`Error in async initialization of component:`, error);
                                    this.pendingRemoval.add(component);
                                })
                        );
                    } else {
                        // Synchronous start
                        state.isInitialized = true;
                    }
                } catch (error) {
                    console.error(`Error initializing component:`, error);
                    this.pendingRemoval.add(component);
                    continue;
                }
            } else {
                // No start method, consider it initialized
                state.isInitialized = true;
            }

            this.activeComponents.set(component, state);
        }
        this.pendingStart.clear();

        // Wait for all async initializations to complete
        if (startPromises.length > 0) {
            await Promise.all(startPromises);
        }

        // Remove pending components
        for (const component of this.pendingRemoval) {
            this.removeComponentInternal(component);
        }
        this.pendingRemoval.clear();
    }

    /**
     * Update all active and initialized components
     */
    private updateComponents() {
        for (const [component, state] of this.activeComponents) {
            // Only update if component is enabled and fully initialized
            if (component.isEnabled && state.isInitialized && component.update) {
                try {
                    component.update(this.deltaTime);
                } catch (error) {
                    console.error(`Error updating component:`, error);
                    component.isEnabled = false;
                }
            }
        }
    }

    /**
     * Sets the active camera used for rendering.
     * @param {Camera} camera - The camera to use for rendering
     */
    setCamera(camera: Camera) {
        this.mainCamera = camera;
    }

    /**
     * Adds a component to the context.
     * The component will be initialized on the next frame.
     */
    addComponent(component: Component) {
        if (this.activeComponents.has(component) || this.pendingStart.has(component)) {
            throw new Error("Component already added to context");
        }

        component.ctx = this;
        this.pendingStart.add(component);
    }

    /**
     * Removes a component from the context.
     * The component will be disposed of on the next frame.
     */
    removeComponent(component: Component) {
        if (!this.activeComponents.has(component)) {
            return;
        }

        this.pendingRemoval.add(component);
    }

    /**
     * Internal method to remove and cleanup a component
     */
    private removeComponentInternal(component: Component) {
        if (component.dispose) {
            try {
                component.dispose();
            } catch (error) {
                console.error(`Error disposing component:`, error);
            }
        }

        // Remove from active components
        this.activeComponents.delete(component);

        // Remove any child components
        for (const child of component.getComponents()) {
            this.removeComponent(child);
        }
    }

    /**
     * Cleans up the context, disposing of all components and cleaning up the scene.
     * This should be called when you want to reset the context or clean up before destruction.
     */
    clear() {
        // Dispose all components
        for (const [component] of this.activeComponents) {
            this.removeComponent(component);
        }

        // Process removals immediately
        this.processPendingOperations().catch(error => {
            console.error("Error during context clear:", error);
        });

        // Clear all callbacks
        this.callbacks.clear();

        // Clean up scene
        this.#cleanScene();
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
