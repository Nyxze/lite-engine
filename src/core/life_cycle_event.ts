import type { Context } from "./context";

export type LifeCycleCallback = (ctx: Context) => void;
export enum LifeCycleEvent {
    Start = "start",
    Update = "update",
    Destroy = "Destroy"
}