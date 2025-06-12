import { OrthographicCamera } from "three";
import { Clock, Mesh, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three"
import { Component } from "./component";
import { AssetDatabase } from "./assets_db";
import { PerfStats } from "../components/stats";
import { LifeCycleEvent, type LifeCycleCallback } from "./life_cycle_event";
import { EventBus } from "./event_bus";

export type Camera = PerspectiveCamera | OrthographicCamera
export type ContextArgs = {
    displayStats: boolean,
    domElement: HTMLElement
}

export class Context {
    static Current: Context;
    app: any;
    renderer: WebGLRenderer
    mainCamera: Camera;
    scene: Scene;
    assetDb: AssetDatabase
    private deltaTime: number = 0
    private clock: Clock;
    private callbacks: Map<LifeCycleEvent, Set<LifeCycleCallback>> = new Map([
        [LifeCycleEvent.Start, new Set()],
        [LifeCycleEvent.Update, new Set()],
        [LifeCycleEvent.Destroy, new Set()],
    ]);


    defaultCamera(): Camera {
        return new PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
    }
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

    update() {
        // Snapshot time
        this.deltaTime = this.clock.getDelta();
        // clamp delta time because if tab is not active clock.getDelta can get pretty big
        this.deltaTime = Math.min(.1, this.deltaTime);
        this._onPreRender()
        this.renderer.render(this.scene, this.mainCamera)
        this.invoke(LifeCycleEvent.Update)
    }

    // Update camera with proper typing
    setCamera(camera: Camera) {
        this.mainCamera = camera;
    }
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
    clear() {
        this.invoke(LifeCycleEvent.Destroy)
        this.callbacks.clear();
        this.#cleanScene()
    }

    invoke(evt: LifeCycleEvent) {
        // console.log("Dispatching Event" + evt)
        const funcs = this.callbacks.get(evt)
        if (!funcs) {
            return
        }
        for (const fn of funcs) {
            fn(this)
        }
    }
    registerCallback(cb: LifeCycleCallback, type: LifeCycleEvent) {
        const funcs = this.callbacks.get(type)
        if (!funcs) {
            this.callbacks.set(type, new Set())
        }
        this.callbacks.get(type)?.add(cb);
    }

    removeCallback(cb: LifeCycleCallback, type: LifeCycleEvent) {
        this.callbacks.get(type)?.delete(cb);
    }
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
