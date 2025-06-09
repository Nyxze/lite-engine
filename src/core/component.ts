import { Context } from "./context"

export abstract class Component {
    public ctx: Context
    // Short hands
    public get scene() {
        return this.ctx.scene
    }
    start?(): void;
    update?(dt: number): void;
    dispose?(): void;
}