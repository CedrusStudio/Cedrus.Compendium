"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SimulationWorkerRequest, SimulationWorkerResponse } from "@/application/combat-lab/worker/simulationMessages";
import type { RawResult, SimulationSummary } from "@/domain/combat-lab/simulation/RawResult";

export type SimulationProgress = { completed: number; total: number };
export type SimulationOutcome = { summary: SimulationSummary; results: RawResult[] };
export type SimulationStatus = "idle" | "running" | "succeeded" | "cancelled" | "failed";
export type UseSimulationState = {
  status: SimulationStatus;
  progress: SimulationProgress | null;
  summary: SimulationSummary | null;
  results: RawResult[] | null;
  error: string | null;
};

type ActiveRun = {
  id: number;
  reject: (error: Error) => void;
  dispose: () => void;
};

const initialState: UseSimulationState = {
  status: "idle", progress: null, summary: null, results: null, error: null,
};

/** Each invocation owns its worker and settles once, including on cancellation. */
export function useSimulation() {
  const activeRef = useRef<ActiveRun | null>(null);
  const nextId = useRef(0);
  const mountedRef = useRef(true);
  const [state, setState] = useState<UseSimulationState>(initialState);

  const abort = useCallback((updateState: boolean) => {
    const active = activeRef.current;
    if (!active) return;
    activeRef.current = null;
    active.dispose();
    active.reject(new DOMException("Simulation cancelled.", "AbortError"));
    if (updateState && mountedRef.current) {
      setState(prev => ({ ...prev, status: "cancelled", summary: null, results: null, error: null }));
    }
  }, []);

  const cancel = useCallback(() => abort(true), [abort]);

  const run = useCallback((request: SimulationWorkerRequest): Promise<SimulationOutcome> => {
    abort(false);
    return new Promise((resolve, reject) => {
      if (!mountedRef.current) {
        reject(new DOMException("Simulation component is no longer mounted.", "AbortError"));
        return;
      }
      const active: ActiveRun = { id: ++nextId.current, reject, dispose: () => {} };
      activeRef.current = active;
      setState({ ...initialState, status: "running", progress: { completed: 0, total: request.count } });

      const fail = (reason: unknown) => {
        if (activeRef.current !== active) return;
        activeRef.current = null;
        active.dispose();
        const error = reason instanceof Error ? reason : new Error(String(reason));
        if (mountedRef.current) setState(prev => ({ ...prev, status: "failed", error: error.message }));
        reject(error);
      };

      try {
        if (typeof Worker === "undefined") throw new Error("Web Workers are not available in this environment.");
        const worker = new Worker(new URL("../worker/simulation.worker.ts", import.meta.url));

        const onMessage = (event: MessageEvent<SimulationWorkerResponse>) => {
          if (activeRef.current !== active) return;
          const message = event.data;
          if (message.type === "progress") {
            setState(prev => ({ ...prev, progress: {
              completed: Math.max(prev.progress?.completed ?? 0, Math.min(request.count, message.completed)),
              total: request.count,
            } }));
            return;
          }
          if (message.type === "error") {
            fail(new Error(message.message));
            return;
          }
          activeRef.current = null;
          active.dispose();
          const outcome = { summary: message.summary, results: message.results };
          if (mountedRef.current) setState({
            ...initialState, status: "succeeded", ...outcome,
            progress: { completed: request.count, total: request.count },
          });
          resolve(outcome);
        };
        const onError = (event: ErrorEvent) => fail(new Error(event.message || "Simulation worker failed."));
        const onMessageError = () => fail(new Error("Unable to read the simulation worker response."));
        active.dispose = () => {
          worker.removeEventListener("message", onMessage);
          worker.removeEventListener("error", onError);
          worker.removeEventListener("messageerror", onMessageError);
          worker.terminate();
        };
        worker.addEventListener("message", onMessage);
        worker.addEventListener("error", onError);
        worker.addEventListener("messageerror", onMessageError);
        worker.postMessage(request);
      } catch (error) {
        fail(error);
      }
    });
  }, [abort]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abort(false);
    };
  }, [abort]);

  return { ...state, isRunning: state.status === "running", run, cancel };
}
