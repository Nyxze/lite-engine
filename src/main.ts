import './style.css'
import { App } from "./app"
import { CubeScene } from './scenes/cubes'
import type { RouteHandler } from './SceneManager'

import { onStart, onUpdate } from '@needle-tools/engine'

import { SceneSwitcher } from '@needle-tools/engine'
onUpdate(cb => {
    cb.isPaused = true
    console.log("dsa")
})
// const root = document.getElementById("app") as HTMLElement
// const app = new App(root)


// type Route = {
//     path: string;
//     func: RouteHandler;
//     name: string;
// };
// const routes: Route[] = [
//     {
//         path: "/cubes",
//         func: () => new CubeScene(),
//         name: "Cubes"
//     }
// ]

// // Create nav bar
// let nav = document.createElement("nav")
// nav.style.display = "flex"
// nav.style.gap = "10px"
// nav.style.marginBottom = "20px"

// // Create a link for each route
// routes.forEach((route) => {
//     app.sceneManager.add(route.path, route.func)

//     const link = document.createElement("a")
//     link.href = route.path
//     link.textContent = route.name
//     link.style.textDecoration = "none"
//     link.style.color = "blue"
//     link.addEventListener("click", (e) => {
//         e.preventDefault()
//         app.sceneManager.load(route.path)
//     })

//     nav.appendChild(link)
// })

// // Add nav bar to the top of the app
// root.prepend(nav)

// app.start()
