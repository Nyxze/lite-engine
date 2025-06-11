import { Context } from "./context"

export abstract class Component {
    private _ctx?: Context
    // Short hands
    public get scene() {
        return this.ctx.scene
    }
    public get ctx(): Context {
        if (!this._ctx) {
            throw new Error("Context has not been set.");
        }
        return this._ctx;
    }
    public set ctx(value) {
        if (this.ctx) {
            throw new Error("Context has already been set");
        }
        this._ctx = value
    }
    start?(): void;
    update?(dt: number): void;
    dispose?(): void;
}