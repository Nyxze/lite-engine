import { Component } from "../core/component";
import packageJson from "../../package.json"
export class PerfStats extends Component {

    stats: any = {}
    statsDiv: HTMLElement | null = null

    start(): void {
        this.stats = {
            lastTime: performance.now(),
            frames: 0,
            fps: 0
        };
        this.statsDiv = document.getElementById('render-stats') as HTMLElement;
    }

    update(dt: number): void {
        const now = performance.now();
        this.stats.frames++;

        const delta = now - this.stats.lastTime;
        if (delta >= 1000) {
            this.stats.fps = Math.round((this.stats.frames * 1000) / delta);
            this.stats.lastTime = now;
            this.stats.frames = 0;
        }

        if (this.statsDiv) {
            const info = this.ctx.renderer.info;
            this.statsDiv.textContent =
                `FPS: ${this.stats.fps}\n` +
                `Draw Calls: ${info.render.calls}\n` +
                `Triangles: ${info.render.triangles}\n` +
                `Lines : ${info.render.lines}\n` +
                `Points : ${info.render.points}\n` +
                `Textures : ${info.memory.textures}\n` +
                `Geometries : ${info.memory.geometries}\n`,
                `Version: ${packageJson.version}`;
        }
    }
}