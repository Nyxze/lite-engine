import { Loader, LoadingManager, TextureLoader } from "three";
import { FBXLoader, GLTFLoader } from "three/examples/jsm/Addons.js";

export class AssetDatabase extends Loader {
    root = "assets"
    fbxLoader: FBXLoader
    textureLoader: TextureLoader
    glbLoader: GLTFLoader
    constructor() {
        super(new LoadingManager())
        this.fbxLoader = new FBXLoader(this.manager)
        this.textureLoader = new TextureLoader(this.manager)
        this.glbLoader = new GLTFLoader(this.manager)
    }

    // Path to the assets
    // Default to fbx type
    loadAsync(path: string): Promise<any> {
        const normalized = this.normalizePath(path);
        let finalPath = normalized;
        let extension = "";

        // Extract extension (if any)
        const parts = normalized.split(".");
        if (parts.length <= 1) {
            // No extension: assume `.fbx`
            extension = "fbx";
            finalPath += ".fbx";
        } else {
            extension = parts.pop()!.toLowerCase();
        }

        const fullPath = `/${this.root}/${finalPath}`;
        console.log("Loading asset:", fullPath);

        switch (extension) {
            case "fbx":
                return this.fbxLoader.loadAsync(fullPath);

            case "png":
                return this.textureLoader.loadAsync(fullPath);

            case "glb":
            case "gltf":
                return this.glbLoader.loadAsync(fullPath);

            default:
                return Promise.reject(new Error(`File format '${extension}' not supported`));
        }
    }

    normalizePath(path: string): string {
        if (!path) {
            throw new Error("Invalid path");
        }

        // Remove any leading slash
        if (path.startsWith("/")) {
            path = path.slice(1);
        }

        // Remove leading 'assets/' or 'assets'
        if (path.startsWith(this.root + "/")) {
            path = path.slice(this.root.length + 1);
        } else if (path === this.root) {
            path = "";
        }

        // Remove trailing slash (optional, depends on use case)
        if (path.endsWith("/")) {
            path = path.slice(0, -1);
        }

        return path;
    }
}