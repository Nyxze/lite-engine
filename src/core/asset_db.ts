import { LoadingManager, Object3D } from "three";
import { FBXLoader, GLTFLoader } from "three/examples/jsm/Addons.js";

export class AssetDatabase {
    root = "assets"
    loadManager: any
    fbxLoader: FBXLoader
    glbLoader: GLTFLoader
    constructor() {
        this.loadManager = new LoadingManager()
        this.fbxLoader = new FBXLoader(this.loadManager)
        this.glbLoader = new GLTFLoader(this.loadManager)
    }
    // Path to the assets
    // Default to fbx type
    async load(path: string): Promise<any> {
        if (!path) {
            return Promise.reject(new Error("invalid path"));
        }
        const parts = path.split('.')
        // No extension detected
        if (parts.length <= 1) {
            path += ".fbx"
            parts.push('fbx')
        }

        let extension = parts.pop()!.toLocaleLowerCase()
        const fullPath = `/${this.root}/${path}`
        console.log("Loading asset : ", fullPath)
        switch (extension) {
            case "fbx": {
                return this.fbxLoader.loadAsync(fullPath)
            }
            case "glb":
            case "gltf": {
                return this.glbLoader.loadAsync(fullPath)
            }
            default:
                return Promise.reject(new Error(`File format '${extension}' not supported`));
        }
    }
}
