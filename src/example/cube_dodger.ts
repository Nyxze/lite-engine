import * as THREE from 'three';
import { Context } from '../core/context';
import { Component } from '../core/component';

/******************************
 * Simple "Cube-Dodger" mini-game
 * Demonstrates Component life-cycle, inter-component communication
 ******************************/

/* -------------------------------------------------------------
   Tiny keyboard helper
----------------------------------------------------------------*/
class Keyboard {
  private static keys = new Set<string>();
  static init() {
    window.addEventListener('keydown', (e) => Keyboard.keys.add(e.code));
    window.addEventListener('keyup', (e) => Keyboard.keys.delete(e.code));
  }
  static isDown(code: string) {
    return Keyboard.keys.has(code);
  }
}

/* -------------------------------------------------------------
   Player cube that can move left/right
----------------------------------------------------------------*/
class PlayerComponent extends Component {
  private mesh!: THREE.Mesh;
  private speed = 8; // units per second
  private readonly halfTrack = 4;

  start() {
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshPhongMaterial({ color: 0x00ff00 })
    );
    this.mesh.position.set(0, 0.5, 5);
    this.scene.add(this.mesh);
  }

  update(dt: number) {
    const input = (Keyboard.isDown('KeyA') ? -1 : 0) +
                  (Keyboard.isDown('KeyD') ? 1 : 0);
    this.mesh.position.x = THREE.MathUtils.clamp(
      this.mesh.position.x + input * this.speed * dt,
      -this.halfTrack,
      this.halfTrack
    );
  }

  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.scene.remove(this.mesh);
  }

  getMesh() { return this.mesh; }
}

/* -------------------------------------------------------------
   Obstacles rushing toward the player
----------------------------------------------------------------*/
class ObstacleComponent extends Component {
  private mesh!: THREE.Mesh;
  private speed = 10;
  private manager: GameManagerComponent;

  constructor(manager: GameManagerComponent) {
    super();
    this.manager = manager;
  }

  start() {
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    // random lane between -4, 0, 4
    const lanes = [-4, 0, 4];
    this.mesh.position.set(lanes[Math.floor(Math.random() * lanes.length)], 0.75, -50);
    this.scene.add(this.mesh);
    this.manager.registerObstacle(this);
  }

  update(dt: number) {
    this.mesh.position.z += this.speed * dt;
    if (this.mesh.position.z > 6) {
      this.manager.unregisterObstacle(this);
    }
  }

  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.scene.remove(this.mesh);
  }

  getMesh() { return this.mesh; }
}

/* -------------------------------------------------------------
   Periodically spawns new obstacles
----------------------------------------------------------------*/
class ObstacleSpawnerComponent extends Component {
  private elapsed = 0;
  private interval = 1.2; // seconds between spawns
  private manager: GameManagerComponent;

  constructor(manager: GameManagerComponent) {
    super();
    this.manager = manager;
  }

  update(dt: number) {
    if (this.manager.isGameOver()) return;
    this.elapsed += dt;
    if (this.elapsed >= this.interval) {
      this.elapsed = 0;
      this.addComponent(ObstacleComponent, this.manager);
    }
  }
}

/* -------------------------------------------------------------
   Oversees game state, score, collision detection
----------------------------------------------------------------*/
class GameManagerComponent extends Component {
  private obstacles = new Set<ObstacleComponent>();
  private player!: PlayerComponent;
  private score = 0;
  private best = 0;
  private gameOver = false;
  private overlay!: HTMLDivElement;

  start() {
    // Simple lighting
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(-1, 2, 4);
    this.scene.add(light);

    // Player
    this.player = this.ctx.addComponent(PlayerComponent);

    // Spawner
    this.ctx.addComponent(ObstacleSpawnerComponent, this);

    // Score overlay
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '10px',
      left: '10px',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '24px'
    });
    document.body.appendChild(this.overlay);
  }

  update(dt: number) {
    if (!this.gameOver) {
      this.score += dt;
      this.overlay.textContent = `Score: ${Math.floor(this.score)}  Best: ${Math.floor(this.best)}`;
      // Collision detection
      for (const obs of this.obstacles) {
        if (this.intersects(this.player.getMesh(), obs.getMesh())) {
          this.triggerGameOver();
          break;
        }
      }
    } else {
      // Wait for Space to restart
      if (Keyboard.isDown('Space')) {
        this.restart();
      }
    }
  }

  private triggerGameOver() {
    this.gameOver = true;
    this.best = Math.max(this.best, this.score);
    this.overlay.textContent += '   GAME OVER – press SPACE to restart';
    this.player.isEnabled = false;
    // Disable existing obstacles
    this.obstacles.forEach(o => o.isEnabled = false);
  }

  private restart() {
    // Remove all obstacles
    this.obstacles.forEach(o => this.ctx.removeComponent(o));
    this.obstacles.clear();
    // Reset player
    this.player.isEnabled = true;
    this.player.getMesh().position.set(0, 0.5, 5);
    // Reset state
    this.score = 0;
    this.gameOver = false;
  }

  /* ---------- helpers ---------- */
  isGameOver() { return this.gameOver; }

  registerObstacle(o: ObstacleComponent) { this.obstacles.add(o); }
  unregisterObstacle(o: ObstacleComponent) { this.obstacles.delete(o); }

  private intersects(a: THREE.Mesh, b: THREE.Mesh) {
    const ax = a.position.x, az = a.position.z;
    const bx = b.position.x, bz = b.position.z;
    return Math.abs(ax - bx) < 1.25 && Math.abs(az - bz) < 1.25;
  }

  dispose() {
    document.body.removeChild(this.overlay);
  }
}

/* -------------------------------------------------------------
   Boot-strapper
----------------------------------------------------------------*/
export function startCubeDodger() {
  Keyboard.init();

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  document.body.appendChild(canvas);

  const ctx = new Context({ domElement: canvas, displayStats: true });
  // Move camera a bit higher looking down the track
  ctx.mainCamera.position.set(0, 8, 10);
  ctx.mainCamera.lookAt(0, 0, 0);

  ctx.addComponent(new GameManagerComponent());
}

// If someone runs this file directly via Vite dev server (like /src/example/cube_dodger.ts)
// auto-start so the sample works without extra glue.
if ((import.meta as any)?.hot || (typeof window !== 'undefined' && document.readyState !== undefined)) {
  // Delay until DOM ready
  window.addEventListener('load', () => startCubeDodger());
} 