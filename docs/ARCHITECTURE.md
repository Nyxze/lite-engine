# Lite Engine Architecture

This document provides a detailed overview of the core building blocks that make up the Lite Engine architecture.

## Core Systems Overview

### 1. Context System (`context.ts`)

The Context system is the central nervous system of the engine, managing the overall state and lifecycle of the application.

#### Key Components:
- **Renderer Management**: Handles WebGL rendering setup and configuration
- **Scene Management**: Maintains the current scene graph
- **Camera System**: Manages both perspective and orthographic cameras
- **Asset Database**: Centralized asset management
- **Lifecycle Management**: Coordinates component lifecycle events

```typescript
export class Context {
    renderer: WebGLRenderer;
    mainCamera: Camera;
    scene: Scene;
    assetDb: AssetDatabase;
}
```

#### Key Features:
- **Singleton Pattern**: Accessible via `Context.Current`
- **Automatic Resize Handling**: Manages canvas and camera aspect ratio
- **Resource Management**: Automatic cleanup of 3D resources
- **Performance Monitoring**: Optional stats display

### 2. Component System (`component.ts`)

The Component system provides the foundation for building modular, reusable functionality.

#### Component Lifecycle:
```typescript
export abstract class Component {
    start?(): void;      // Called when component is initialized
    update?(dt: number): void;  // Called every frame
    dispose?(): void;    // Called when component is destroyed
}
```

#### Key Features:
- **Context Awareness**: Components have access to the global context
- **Automatic Lifecycle Management**: Handled by the context system
- **Scene Access**: Direct access to the scene graph
- **Type Safety**: Full TypeScript support

### 3. Lifecycle Events (`life_cycle_event.ts`)

The event system manages the flow of component lifecycles and system events.

#### Event Types:
- `Start`: Initialization phase
- `Update`: Per-frame update
- `Destroy`: Cleanup phase

#### Implementation:
```typescript
enum LifeCycleEvent {
    Start,
    Update,
    Destroy
}
```

### 4. Asset Management (`assets_db.ts`)

The asset management system handles resource loading, caching, and memory management.

#### Features:
- Resource loading and unloading
- Asset caching
- Memory management
- Resource pooling

### 5. Scene Router (`scene_router.ts`)

Handles scene management and transitions between different states of the application.

#### Responsibilities:
- Scene loading/unloading
- State transitions
- Route management
- Scene lifecycle

## Component Architecture

### Base Component Structure

```typescript
class MyComponent extends Component {
    // Initialization
    start() {
        // Setup code
    }

    // Per-frame update
    update(deltaTime: number) {
        // Update logic
    }

    // Cleanup
    dispose() {
        // Cleanup code
    }
}
```

### Component Communication

Components can communicate through several mechanisms:

1. **Direct Reference**: Components can hold references to other components
2. **Scene Graph**: Components can traverse the scene graph
3. **Context**: Shared state through the context system

## Best Practices

### 1. Resource Management

```typescript
// Always clean up resources in dispose
dispose() {
    // Dispose geometries
    this.geometry?.dispose();
    
    // Dispose materials
    if (Array.isArray(this.material)) {
        this.material.forEach(m => m.dispose());
    } else {
        this.material?.dispose();
    }
}
```

### 2. Component Creation

```typescript
// Add component to context
const component = new MyComponent();
context.addComponent(component);
```

### 3. Scene Management

```typescript
// Clean up scene before switching
context.clear();  // This will trigger dispose on all components
```

## Performance Considerations

1. **Resource Cleanup**
   - Always implement dispose methods
   - Use the context's cleanup utilities
   - Monitor memory usage with stats

2. **Update Loop Optimization**
   - Keep update methods lightweight
   - Use deltaTime for frame-rate independent updates
   - Implement object pooling for frequent creation/destruction

3. **Asset Management**
   - Use the asset database for resource caching
   - Implement proper loading/unloading strategies
   - Consider asset preloading for critical resources

## Example Usage

```typescript
class GameComponent extends Component {
    private mesh: Mesh;

    start() {
        // Setup
        const geometry = new BoxGeometry(1, 1, 1);
        const material = new MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new Mesh(geometry, material);
        this.scene.add(this.mesh);
    }

    update(dt: number) {
        // Per-frame update
        this.mesh.rotation.x += dt;
    }

    dispose() {
        // Cleanup
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.scene.remove(this.mesh);
    }
}
```

## Debugging and Development

1. **Performance Monitoring**
   - Enable stats display: `new Context({ displayStats: true })`
   - Monitor frame time and memory usage
   - Use browser dev tools for profiling

2. **Resource Tracking**
   - Watch for memory leaks
   - Monitor disposed resources
   - Check scene graph for orphaned objects

3. **Development Tools**
   - TypeScript for type safety
   - ESLint for code quality
   - Vite for fast development 