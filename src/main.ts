import './style.css'
import * as THREE from "three"

const canvas = document.querySelector("#render") as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas })

const fov = 75;
const aspect = 2;  // the canvas default
const near = 0.1;
const far = 5;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2


const scene = new THREE.Scene()
// Box
const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;

const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth)

let cubes = [
  createCube(geometry, new THREE.Color(0x44aa88), 0),
  createCube(geometry, new THREE.Color(0x8844aa), 2),
  createCube(geometry, new THREE.Color(0xaa8844), -2)
]
function createCube(geometry: THREE.BufferGeometry, color: THREE.Color, x: number) {
  const mat = new THREE.MeshPhongMaterial({ color })
  let mesh = new THREE.Mesh(geometry, mat)
  mesh.position.x = x
  scene.add(mesh)
  return mesh
}

const color = 0xFFFFFF;
const intensity = 3;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(-1, 2, 4);
scene.add(light);

// renderer.setPixelRatio(window.devicePixelRatio);
function updateCanvas() {
  const pixelRatio = window.devicePixelRatio;
  const width = Math.floor(canvas.clientWidth * pixelRatio);
  const height = Math.floor(canvas.clientHeight * pixelRatio);
  if (canvas.width == width && canvas.height == height) {
    return
  }
  console.log(renderer.domElement)
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}
function render(time: number) {
  time *= 0.001;  // convert time to seconds

  updateCanvas()
  for (let index = 0; index < cubes.length; index++) {
    const element = cubes[index];
    const speed = 1 + index * .1;
    const rot = time * speed;
    element.rotation.x = rot
    element.rotation.y = rot;
  }

  renderer.render(scene, camera);

  requestAnimationFrame(render);
}


// Main Loop
requestAnimationFrame(render);