import * as THREE from "three";
import { SceneManager } from "./SceneManager";

export class Context {
  renderer: THREE.WebGLRenderer;
  scene: any
  mainCamera: any
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas
    });
    this.scene = new THREE.Scene()
    this.mainCamera = new THREE.PerspectiveCamera()

    this.renderer.setAnimationLoop((timestamp, frame) => {
      this.update(timestamp)
    })
  }

  update(time: number) {
    if (this._onBeforeRender(time))
      return;
    this._onRender()
    this._onAfterRender()
  }
  _onBeforeRender(time: number): boolean {
    return true
  }
  _onRender() {

  }
  _onAfterRender() {

  }
}
export class App {
  public sceneManager: SceneManager;
  public root: HTMLElement;
  public context: Context | undefined
  constructor(root: HTMLElement) {
    this.root = root;
    this.sceneManager = new SceneManager();
  }

  start() {
    const canvas = document.createElement("canvas")
    this.context = new Context(canvas)
  }
}
