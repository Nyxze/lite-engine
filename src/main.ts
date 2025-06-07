import './style.css'
import * as THREE from "three"


class App {
  public canvas: HTMLCanvasElement
  public camera: any
  public currentScene: any
  private renderer: THREE.WebGLRenderer
  constructor(root: HTMLElement) {
    this.canvas = root.querySelector("#render") as HTMLCanvasElement
    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.canvas })
  }

  start() {

    // Create camera
    const fov = 75;
    const aspect = this.canvas.width / this.canvas.height;
    const near = 0.1;
    const far = 5;

    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.z = 2
    this.updateLoop()
  }

  updateCanvasSize() {

    const pixelRatio = window.devicePixelRatio;
    const width = Math.floor(this.canvas.clientWidth * pixelRatio);
    const height = Math.floor(this.canvas.clientHeight * pixelRatio);
    if (this.canvas.width == width && this.canvas.height == height) {
      return
    }
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  updateLoop() {
    const loop = (time: number) => {
      if (this.currentScene) {
        time *= 0.001;  // convert time to seconds
        this.updateCanvasSize()
        this.renderer.render(this.currentScene, this.camera);
      }
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop);
  }
}
// const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth)

// let cubes = [
//   createCube(geometry, new THREE.Color(0x44aa88), 0),
//   createCube(geometry, new THREE.Color(0x8844aa), 2),
//   createCube(geometry, new THREE.Color(0xaa8844), -2)
// ]
// function createCube(geometry: THREE.BufferGeometry, color: THREE.Color, x: number) {
//   const mat = new THREE.MeshPhongMaterial({ color })
//   let mesh = new THREE.Mesh(geometry, mat)
//   mesh.position.x = x
//   scene.add(mesh)
//   return mesh
// }

const root = document.getElementById("#app") as HTMLElement
const app = new App(root)
app.start()