import { StrictMode, type PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeSnapshot } from '@/domain/combat-lab/engine/__tests__/engineFixtures';
import { aggregateResults } from '@/domain/combat-lab/simulation/aggregateResults';
import { useSimulation, type SimulationOutcome } from './useSimulation';
import { FakeSimulationWorker as WorkerDouble } from './__tests__/FakeSimulationWorker';

const request = () => ({ a: makeSnapshot('a'), b: makeSnapshot('b'), count: 10 });
const outcome: SimulationOutcome = { summary: aggregateResults([]), results: [] };
const done = { type: 'done' as const, ...outcome };

beforeEach(() => WorkerDouble.reset());
afterEach(() => vi.unstubAllGlobals());

describe('simulation worker lifecycle', () => {
  it('starts idle and completes with exactly one paired result', async () => {
    const { result } = renderHook(() => useSimulation());
    expect(result.current.status).toBe('idle');
    let pending!: Promise<SimulationOutcome>;
    act(() => { pending = result.current.run(request()); });
    const worker = WorkerDouble.last();
    expect(worker.postMessage).toHaveBeenCalledWith(request());
    expect(result.current.isRunning).toBe(true);
    act(() => { worker.emit(done); });
    await expect(pending).resolves.toEqual(outcome);
    expect(result.current.status).toBe('succeeded');
    expect(result.current.progress).toEqual({ completed: 10, total: 10 });
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect([...worker.listeners.values()].every(listeners => listeners.size === 0)).toBe(true);
    act(() => { worker.emitStale({ type: 'error', message: 'late' }); });
    expect(result.current.status).toBe('succeeded');
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('settles cancellation as AbortError and ignores late progress/completion', async () => {
    const { result } = renderHook(() => useSimulation());
    let pending!: Promise<SimulationOutcome>;
    act(() => { pending = result.current.run(request()); });
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    const worker = WorkerDouble.last();
    act(() => { result.current.cancel(); result.current.cancel(); });
    await rejected;
    act(() => { worker.emitStale(done); });
    expect(result.current.status).toBe('cancelled');
    expect(result.current.summary).toBeNull();
    expect(result.current.error).toBeNull();
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('settles a superseded run without allowing its callbacks to affect the next one', async () => {
    const { result } = renderHook(() => useSimulation());
    let first!: Promise<SimulationOutcome>, second!: Promise<SimulationOutcome>;
    act(() => { first = result.current.run(request()); });
    const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' });
    const oldWorker = WorkerDouble.last();
    act(() => { second = result.current.run({ ...request(), count: 20 }); });
    await rejected;
    const currentWorker = WorkerDouble.last();
    act(() => { oldWorker.emitStale(done); oldWorker.emitStale({ type: 'progress', completed: 10, total: 10 }); });
    expect(result.current.isRunning).toBe(true);
    expect(result.current.progress).toEqual({ completed: 0, total: 20 });
    expect(currentWorker.terminate).not.toHaveBeenCalled();
    act(() => { currentWorker.emit(done); });
    await expect(second).resolves.toEqual(outcome);
  });

  it('releases the worker and settles the promise on unmount', async () => {
    const { result, unmount } = renderHook(() => useSimulation());
    let pending!: Promise<SimulationOutcome>;
    act(() => { pending = result.current.run(request()); });
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    const worker = WorkerDouble.last();
    unmount();
    await rejected;
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('keeps progress monotonic within the active request', async () => {
    const { result } = renderHook(() => useSimulation());
    let pending!: Promise<SimulationOutcome>;
    act(() => { pending = result.current.run(request()); });
    const worker = WorkerDouble.last();
    act(() => {
      worker.emit({ type: 'progress', completed: 5, total: 10 });
      worker.emit({ type: 'progress', completed: 2, total: 10 });
    });
    expect(result.current.progress).toEqual({ completed: 5, total: 10 });
    act(() => { worker.emit(done); });
    await pending;
  });

  it.each(['unavailable', 'construction', 'postMessage'] as const)('reports %s startup failures and permits retry', async kind => {
    if (kind === 'unavailable') vi.stubGlobal('Worker', undefined);
    if (kind === 'construction') WorkerDouble.constructionError = new Error('constructor failed');
    if (kind === 'postMessage') WorkerDouble.postError = new Error('clone failed');
    const { result } = renderHook(() => useSimulation());
    await act(async () => { await expect(result.current.run(request())).rejects.toBeInstanceOf(Error); });
    expect(result.current.status).toBe('failed');
    expect(result.current.isRunning).toBe(false);
    if (kind === 'postMessage') expect(WorkerDouble.last().terminate).toHaveBeenCalledOnce();
    WorkerDouble.reset();
    let pending!: Promise<SimulationOutcome>;
    act(() => { pending = result.current.run(request()); });
    act(() => { WorkerDouble.last().emit(done); });
    await expect(pending).resolves.toEqual(outcome);
  });

  it.each(['error-response', 'error-event', 'messageerror'] as const)('settles %s failures and disposes resources', async kind => {
    const { result } = renderHook(() => useSimulation());
    let pending!: Promise<SimulationOutcome>;
    act(() => { pending = result.current.run(request()); });
    const rejected = expect(pending).rejects.toBeInstanceOf(Error);
    const worker = WorkerDouble.last();
    act(() => {
      if (kind === 'error-response') worker.emit({ type: 'error', message: 'worker failed' });
      if (kind === 'error-event') worker.emitEvent('error', new ErrorEvent('error', { message: 'worker failed' }));
      if (kind === 'messageerror') worker.emitEvent('messageerror', new Event('messageerror'));
    });
    await rejected;
    expect(result.current.status).toBe('failed');
    expect(result.current.error).toBeTruthy();
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('works after React StrictMode effect cleanup and replay', async () => {
    const wrapper = ({ children }: PropsWithChildren) => <StrictMode>{children}</StrictMode>;
    const { result } = renderHook(() => useSimulation(), { wrapper });
    let pending!: Promise<SimulationOutcome>;
    act(() => { pending = result.current.run(request()); });
    act(() => { WorkerDouble.last().emit(done); });
    await expect(pending).resolves.toEqual(outcome);
  });
});
