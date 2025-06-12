import * as THREE from 'three'
import { Component } from '../core/component'
import { BoxGeometry, DirectionalLight } from 'three'
export class CubeGroup extends Component {

    private cubes: any[] = []
    private geometry: BoxGeometry | null = null
    private light: DirectionalLight | null = null

    start(): void {
        const geometry = new BoxGeometry(1, 1, 1)
        const cubes = [
            createCube(geometry, new THREE.Color(0x44aa88), 0),
            createCube(geometry, new THREE.Color(0x8844aa), 2),
            createCube(geometry, new THREE.Color(0xaa8844), -2)
        ]
        const color = 0xFFFFFF;
        const intensity = 3;
        const light = new DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);

        this.scene.add(light);
        this.scene.add(...cubes)

        this.geometry = geometry
        this.light = light
        this.cubes = cubes
    }
    update(ts: number): void {
        this.cubes.forEach((cube) => {
            cube.rotation.x = ts
            cube.rotation.y = ts
        })
    }

    dispose(): void {
        this.geometry?.dispose()
        this.light?.dispose()
    }
}

function createCube(geometry: THREE.BufferGeometry, color: THREE.Color, x: number) {
    const mat = new THREE.MeshPhongMaterial({ color })
    let mesh = new THREE.Mesh(geometry, mat)
    mesh.position.x = x
    return mesh
}