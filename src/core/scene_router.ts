import { EventDispatcher } from "three"
import { Component } from "./component"

type RouteHandler = () => Component

interface RouteMap {
    "load": { routeId: string, handler: RouteHandler }
    "unload": { routeId: string }
}
export class SceneRouter extends EventDispatcher<RouteMap> {
    public routes: Record<string, RouteHandler> = {}
    public current: string
    constructor() {
        super()
        this.current = ""
        const handler = () => {
            const route = window.location.hash.slice(1) || "/"
            if (!route) {
                console.log("Invalid route")
                return
            }
            if (!this.routes[route]) {
                console.log(`${route} is not valid`)
                return
            }
            if (this.current === route) {
                // Already loaded
                // Avoid re-entrance load -> hashchange
                console.log(`${route} is already loaded`)
                return
            }
            if (this.current) {
                this.dispatchEvent({ type: "unload", routeId: route })
            }
            this.current = route
            this.dispatchEvent({ type: "load", routeId: route, handler: this.routes[route] });
        }
        window.addEventListener('hashchange', handler)
        window.addEventListener('load', handler)
    }

    add(path: string, cb: RouteHandler) {
        let handler = this.routes[path]
        if (!handler) {
            this.routes[path] = cb
            return
        }
        console.log(`${path} already added`)
    }

    navigate(path: string) {
        let handler = this.routes[path]
        if (!handler) {
            console.log(`${path} doesn't exsist`)
            return
        }
        window.location.href = '#' + path
    }
}
