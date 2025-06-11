import { Context } from "./core/context";
import { SceneRouter } from "./core/scene_router";

export class App {
  public sceneManager:SceneRouter;
  public root: HTMLElement;
  public context: Context | undefined
  constructor(root: HTMLElement) {
    this.root = root;
    this.sceneManager = new SceneRouter();
  }

  start() {
    const canvas = document.createElement("canvas")
    this.context = new Context({ domElement: canvas, displayStats:false })
  }
}
