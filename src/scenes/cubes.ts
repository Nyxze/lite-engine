import * as THREE from 'three'
import { Component } from '../SceneManager';
import {Context} from "@needle-tools/engine"
export class CubeScene extends Component {

    private cubes: any[]
    private geometry
    private light

    constructor() {
        super()

        const scene = new THREE.Scene()
        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const cubes = [
            createCube(geometry, new THREE.Color(0x44aa88), 0),
            createCube(geometry, new THREE.Color(0x8844aa), 2),
            createCube(geometry, new THREE.Color(0xaa8844), -2)
        ]
        const color = 0xFFFFFF;
        const intensity = 3;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);

        scene.add(light);
        scene.add(...cubes)

        this.geometry = geometry
        this.light = light
        this.cubes = cubes
    }

    start(): void { }


    update(ts: number): void {
        this.cubes.forEach((cube) => {
            cube.rotation.x = ts
            cube.rotation.y = ts
        })
    }

    dispose(): void {
        this.geometry.dispose()
        this.light.dispose()
    }
}

function createCube(geometry: THREE.BufferGeometry, color: THREE.Color, x: number) {
    const mat = new THREE.MeshPhongMaterial({ color })
    let mesh = new THREE.Mesh(geometry, mat)
    mesh.position.x = x
    return mesh
}