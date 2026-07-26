"use client";

/**
 * React hook wrapping the simulation Web Worker: fire a run, watch progress,
 * cancel mid-flight, and read back the summary/results. The heavy work never
 * touches the render thread.
 *
 * Falls back gracefully if `Worker` is unavailable (e.g. SSR): `run()` rejects
 * with a clear error rather than blocking.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SimulationWorkerRequest,
  SimulationWorkerResponse,
} from "@/application/combat-lab/worker/simulationMessages";
import type { RawResult, SimulationSummary } from "@/domain/combat-lab/simulation/RawResult";

export type SimulationProgress =
{
  completed: number;
  total: number;
};

export type UseSimulationState =
{
  isRunning: boolean;
  progress: SimulationProgress | null;
  summary: SimulationSummary | null;
  results: RawResult[] | null;
  error: string | null;
};

export function useSimulation()
{
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<UseSimulationState>({
    isRunning: false,
    progress: null,
    summary: null,
    results: null,
    error: null,
  });

  const terminate = useCallback(() =>
  {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const cancel = useCallback(() =>
  {
    terminate();
    setState(prev => ({ ...prev, isRunning: false }));
  }, [terminate]);

  const run = useCallback((request: SimulationWorkerRequest): Promise<SimulationSummary> =>
  {
    return new Promise((resolve, reject) =>
    {
      if (typeof Worker === "undefined")
      {
        reject(new Error("Web Workers are not available in this environment."));
        return;
      }

      terminate();
      setState({ isRunning: true, progress: { completed: 0, total: request.count }, summary: null, results: null, error: null });

      const worker = new Worker(new URL("../worker/simulation.worker.ts", import.meta.url));
      workerRef.current = worker;

      worker.addEventListener("message", (event: MessageEvent<SimulationWorkerResponse>) =>
      {
        const message = event.data;

        if (message.type === "progress")
        {
          setState(prev => ({ ...prev, progress: { completed: message.completed, total: message.total } }));
        }
        else if (message.type === "done")
        {
          setState(prev => ({ ...prev, isRunning: false, summary: message.summary, results: message.results }));
          terminate();
          resolve(message.summary);
        }
        else
        {
          setState(prev => ({ ...prev, isRunning: false, error: message.message }));
          terminate();
          reject(new Error(message.message));
        }
      });

      worker.addEventListener("error", (event) =>
      {
        setState(prev => ({ ...prev, isRunning: false, error: event.message }));
        terminate();
        reject(new Error(event.message));
      });

      worker.postMessage(request);
    });
  }, [terminate]);

  useEffect(() => terminate, [terminate]);

  return { ...state, run, cancel };
}
