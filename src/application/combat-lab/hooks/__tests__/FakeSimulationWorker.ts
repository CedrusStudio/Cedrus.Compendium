import { vi } from 'vitest';
import type { SimulationWorkerRequest, SimulationWorkerResponse } from '../../worker/simulationMessages';

export class FakeSimulationWorker {
  static instances: FakeSimulationWorker[] = [];
  static constructionError: Error | null = null;
  static postError: Error | null = null;
  readonly listeners = new Map<string, Set<EventListener>>();
  readonly capturedMessageHandlers: EventListener[] = [];
  readonly terminate = vi.fn();
  readonly postMessage = vi.fn((_request: SimulationWorkerRequest) => {
    if (FakeSimulationWorker.postError) throw FakeSimulationWorker.postError;
  });

  constructor() {
    if (FakeSimulationWorker.constructionError) throw FakeSimulationWorker.constructionError;
    FakeSimulationWorker.instances.push(this);
  }
  addEventListener(type: string, listener: EventListener) {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
    if (type === 'message') this.capturedMessageHandlers.push(listener);
  }
  removeEventListener(type: string, listener: EventListener) { this.listeners.get(type)?.delete(listener); }
  emit(message: SimulationWorkerResponse) { this.emitEvent('message', new MessageEvent('message', { data: message })); }
  emitEvent(type: string, event: Event) { for (const listener of this.listeners.get(type) ?? []) listener(event); }
  emitStale(message: SimulationWorkerResponse) {
    for (const listener of this.capturedMessageHandlers) listener(new MessageEvent('message', { data: message }));
  }
  static reset() {
    FakeSimulationWorker.instances = [];
    FakeSimulationWorker.constructionError = null;
    FakeSimulationWorker.postError = null;
    vi.stubGlobal('Worker', FakeSimulationWorker);
  }
  static last() { return FakeSimulationWorker.instances[FakeSimulationWorker.instances.length - 1]!; }
}
