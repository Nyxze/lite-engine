import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { EventBus } from '../event_bus';

interface TestEvents {
    'test:basic': { value: number };
    'test:string': { message: string };
}

describe('EventBus', () => {
    let bus: EventBus<TestEvents>;

    beforeEach(() => {
        bus = new EventBus<TestEvents>();
    });

    describe('on()', () => {
        it('should subscribe to events and receive data', () => {
            const handler = jest.fn();
            bus.on('test:basic', handler);
            
            const testData = { value: 42 };
            bus.emit('test:basic', testData);
            
            expect(handler).toHaveBeenCalledWith(testData);
            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('should allow multiple handlers for the same event', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            
            bus.on('test:basic', handler1);
            bus.on('test:basic', handler2);
            
            const testData = { value: 123 };
            bus.emit('test:basic', testData);
            
            expect(handler1).toHaveBeenCalledWith(testData);
            expect(handler2).toHaveBeenCalledWith(testData);
        });

        it('should return dispose function that removes the handler', () => {
            const handler = jest.fn();
            const dispose = bus.on('test:basic', handler);
            
            dispose();
            bus.emit('test:basic', { value: 42 });
            
            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('once()', () => {
        it('should only trigger handler once', () => {
            const handler = jest.fn();
            bus.once('test:basic', handler);
            
            bus.emit('test:basic', { value: 1 });
            bus.emit('test:basic', { value: 2 });
            
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith({ value: 1 });
        });

        it('should return dispose function that removes the handler before execution', () => {
            const handler = jest.fn();
            const dispose = bus.once('test:basic', handler);
            
            dispose();
            bus.emit('test:basic', { value: 42 });
            
            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('emit()', () => {
        it('should handle errors in event handlers gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const errorHandler = () => { throw new Error('Test error'); };
            const normalHandler = jest.fn();
            
            bus.on('test:basic', errorHandler);
            bus.on('test:basic', normalHandler);
            
            bus.emit('test:basic', { value: 42 });
            
            expect(consoleSpy).toHaveBeenCalled();
            expect(normalHandler).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        it('should do nothing when emitting to non-existent event', () => {
            expect(() => {
                bus.emit('test:basic', { value: 42 });
            }).not.toThrow();
        });
    });

    describe('clear()', () => {
        it('should clear all handlers for specific event', () => {
            const basicHandler = jest.fn();
            const stringHandler = jest.fn();
            
            bus.on('test:basic', basicHandler);
            bus.on('test:string', stringHandler);
            
            bus.clear('test:basic');
            
            bus.emit('test:basic', { value: 1 });
            bus.emit('test:string', { message: 'test' });
            
            expect(basicHandler).not.toHaveBeenCalled();
            expect(stringHandler).toHaveBeenCalled();
        });

        it('should clear all handlers when no event specified', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            
            bus.on('test:basic', handler1);
            bus.on('test:string', handler2);
            
            bus.clear();
            
            bus.emit('test:basic', { value: 1 });
            bus.emit('test:string', { message: 'test' });
            
            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).not.toHaveBeenCalled();
        });
    });

    describe('listenerCount()', () => {
        it('should return correct number of listeners', () => {
            expect(bus.listenerCount('test:basic')).toBe(0);
            
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            
            bus.on('test:basic', handler1);
            expect(bus.listenerCount('test:basic')).toBe(1);
            
            bus.on('test:basic', handler2);
            expect(bus.listenerCount('test:basic')).toBe(2);
            
            const dispose = bus.on('test:basic', jest.fn());
            expect(bus.listenerCount('test:basic')).toBe(3);
            
            dispose();
            expect(bus.listenerCount('test:basic')).toBe(2);
        });

        it('should return 0 for non-existent events', () => {
            expect(bus.listenerCount('test:basic')).toBe(0);
        });
    });
}); 