import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeSnapshot } from '@/domain/combat-lab/engine/__tests__/engineFixtures';
import type { SimulationWorkerRequest, SimulationWorkerResponse } from './simulationMessages';

let receive: (event: MessageEvent<SimulationWorkerRequest>) => void;
let messages: SimulationWorkerResponse[];
beforeEach(() => {
  vi.resetModules();
  messages = [];
  vi.stubGlobal('self', {
    addEventListener: (_type: string, handler: typeof receive) => { receive = handler; },
    postMessage: (message: SimulationWorkerResponse) => messages.push(message),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('simulation worker with the real engine', () => {
  it('sends actual progress and an optional-summary-only outcome', async () => {
    await import('./simulation.worker');
    receive(new MessageEvent('message', { data: {
      a: makeSnapshot('a'), b: makeSnapshot('b'), count: 501, seedStart: 11, maxRounds: 1, includeResults: false,
    } }));
    expect(messages.slice(0, 2)).toEqual([
      { type: 'progress', completed: 500, total: 501 },
      { type: 'progress', completed: 501, total: 501 },
    ]);
    expect(messages[2]).toMatchObject({ type: 'done', summary: { count: 501 }, results: [] });
  });

  it('transports a computation failure as an error response', async () => {
    await import('./simulation.worker');
    receive(new MessageEvent('message', { data: { a: makeSnapshot('a'), b: makeSnapshot('b'), count: 1.5 } }));
    expect(messages).toEqual([{ type: 'error', message: 'Simulation count must be a non-negative safe integer.' }]);
  });
});
