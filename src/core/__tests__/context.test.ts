import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Context } from '../context';
import { Component } from '../component';
import { Object3D } from 'three';

// Mock DOM element
const createMockCanvas = () => {
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: 800 });
    Object.defineProperty(canvas, 'clientHeight', { value: 600 });
    return canvas;
};

// Test component implementations
class TestComponent extends Component {
    public startCalled = false;
    public updateCalled = false;
    public disposeCalled = false;
    public updateCount = 0;

    start() {
        this.startCalled = true;
    }

    update(_dt: number) {
        this.updateCalled = true;
        this.updateCount++;
    }

    dispose() {
        this.disposeCalled = true;
    }
}

class AsyncTestComponent extends Component {
    public startCalled = false;
    public updateCalled = false;
    public disposeCalled = false;
    public updateCount = 0;
    private resolveStart: (() => void) | null = null;

    start(): Promise<void> {
        this.startCalled = true;
        return new Promise((resolve) => {
            this.resolveStart = resolve;
        });
    }

    // Method to resolve the async start
    resolveStartMethod() {
        if (this.resolveStart) {
            this.resolveStart();
        }
    }

    update(_dt: number) {
        this.updateCalled = true;
        this.updateCount++;
    }

    dispose() {
        this.disposeCalled = true;
    }
}

class FailingAsyncComponent extends Component {
    public startCalled = false;
    public updateCalled = false;
    public disposeCalled = false;

    start(): Promise<void> {
        this.startCalled = true;
        return Promise.reject(new Error('Async start failed'));
    }

    update(_dt: number) {
        this.updateCalled = true;
    }

    dispose() {
        this.disposeCalled = true;
    }
}

class ComponentWithObject3D extends Component {
    private _meshObject!: Object3D;

    start() {
        this._meshObject = new Object3D();
        this.scene.add(this._meshObject);
    }

    dispose() {
        if (this._meshObject) {
            this.scene.remove(this._meshObject);
        }
    }

    get meshObject() {
        return this._meshObject;
    }
}

class ComponentWithoutStart extends Component {
    updateCalled = false;
    update(_dt: number) {
        this.updateCalled = true;
    }
}

class ComponentWithoutUpdate extends Component {
    startCalled = false;
    start() {
        this.startCalled = true;
    }
}

class ComponentWithStartError extends Component {
    start() {
        throw new Error('Start failed');
    }
}

class ComponentWithUpdateError extends Component {
    start() {}
    update(_dt: number) {
        throw new Error('Update failed');
    }
}

class ComponentWithDisposeError extends Component {
    dispose() {
        throw new Error('Dispose failed');
    }
}

class ComponentWithDeltaTime extends Component {
    deltaTimes: number[] = [];
    update(_dt: number) {
        this.deltaTimes.push(_dt);
    }
}

class ComponentWithMaxDeltaTime extends Component {
    maxDeltaTime = 0;
    update(_dt: number) {
        this.maxDeltaTime = Math.max(this.maxDeltaTime, _dt);
    }
}

describe('Context', () => {
    let context: Context;
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        canvas = createMockCanvas();
        context = new Context({
            displayStats: false,
            domElement: canvas
        });
    });

    afterEach(() => {
        context.clear();
    });

    describe('Component Lifecycle', () => {
        it('should initialize synchronous components correctly', () => {
            const component = new TestComponent();
            context.addComponent(component);

            // Trigger update to process pending operations
            context.update();

            expect(component.startCalled).toBe(true);
            expect(component.updateCalled).toBe(true);
            expect(component.updateCount).toBe(1);
        });

        it('should handle async components correctly', async () => {
            const component = new AsyncTestComponent();
            context.addComponent(component);

            // First update - component should be added but not initialized
            context.update();
            expect(component.startCalled).toBe(true);
            expect(component.updateCalled).toBe(false);

            // Resolve the async start
            component.resolveStartMethod();

            // Wait for next frame
            await new Promise(resolve => setTimeout(resolve, 0));

            // Second update - component should now be initialized and updating
            context.update();
            expect(component.updateCalled).toBe(true);
            expect(component.updateCount).toBe(1);
        });

        it('should handle failing async components', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const component = new FailingAsyncComponent();
            context.addComponent(component);

            // First update - component should be added
            context.update();
            expect(component.startCalled).toBe(true);

            // Wait for async operation to fail
            await new Promise(resolve => setTimeout(resolve, 0));

            // Second update - component should be removed due to failure
            context.update();
            expect(component.disposeCalled).toBe(false); // Should not dispose failed components
            expect(consoleSpy).toHaveBeenCalledWith(
                'Error in async initialization of component:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        it('should not update disabled components', () => {
            const component = new TestComponent();
            context.addComponent(component);
            context.update();

            // Disable component
            component.isEnabled = false;
            context.update();

            expect(component.updateCount).toBe(1); // Should not increase
        });

        it('should handle component removal correctly', () => {
            const component = new TestComponent();
            context.addComponent(component);
            context.update();

            // Remove component
            context.removeComponent(component);
            context.update();

            expect(component.disposeCalled).toBe(true);
        });

        it('should handle hierarchical component removal', () => {
            const parent = new TestComponent();
            const child = new TestComponent();
            
            context.addComponent(parent);
            parent.addComponent(child);
            context.update();

            // Remove parent
            context.removeComponent(parent);
            context.update();

            expect(parent.disposeCalled).toBe(true);
            expect(child.disposeCalled).toBe(true);
        });
    });

    describe('Component State Management', () => {
        it('should prevent duplicate component addition', () => {
            const component = new TestComponent();
            context.addComponent(component);

            expect(() => {
                context.addComponent(component);
            }).toThrow('Component already added to context');
        });

        it('should handle components without start method', () => {
            const component = new ComponentWithoutStart();
            context.addComponent(component);
            context.update();

            expect(component.updateCalled).toBe(true);
        });

        it('should handle components without update method', () => {
            const component = new ComponentWithoutUpdate();
            context.addComponent(component);
            context.update();

            expect(component.startCalled).toBe(true);
            // Should not throw error when component has no update method
            expect(() => context.update()).not.toThrow();
        });
    });

    describe('Error Handling', () => {
        it('should handle errors in start method', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const component = new ComponentWithStartError();

            context.addComponent(component);
            context.update();

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error initializing component:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        it('should handle errors in update method', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const component = new ComponentWithUpdateError();

            context.addComponent(component);
            context.update(); // First update - start
            context.update(); // Second update - should disable component on error

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error updating component:',
                expect.any(Error)
            );
            expect(component.isEnabled).toBe(false);

            consoleSpy.mockRestore();
        });

        it('should handle errors in dispose method', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const component = new ComponentWithDisposeError();

            context.addComponent(component);
            context.update();
            context.removeComponent(component);
            context.update();

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error disposing component:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Scene Management', () => {
        it('should properly add and remove Object3D from scene', () => {
            const component = new ComponentWithObject3D();
            context.addComponent(component);
            context.update();

            expect(context.scene.children).toContain(component.meshObject);

            context.removeComponent(component);
            context.update();

            expect(context.scene.children).not.toContain(component.meshObject);
        });

        it('should clear scene properly', () => {
            const component1 = new ComponentWithObject3D();
            const component2 = new ComponentWithObject3D();

            context.addComponent(component1);
            context.addComponent(component2);
            context.update();

            expect(context.scene.children.length).toBe(2);

            context.clear();

            expect(context.scene.children.length).toBe(0);
        });
    });

    describe('Update Loop', () => {
        it('should maintain consistent delta time', () => {
            const component = new ComponentWithDeltaTime();

            context.addComponent(component);
            context.update();
            context.update();

            expect(component.deltaTimes.length).toBe(2);
            expect(component.deltaTimes[0]).toBeGreaterThan(0);
            expect(component.deltaTimes[1]).toBeGreaterThan(0);
        });

        it('should clamp delta time to prevent large jumps', () => {
            const component = new ComponentWithMaxDeltaTime();

            context.addComponent(component);
            context.update();

            expect(component.maxDeltaTime).toBeLessThanOrEqual(0.1);
        });
    });
}); 