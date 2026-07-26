"use client";

/** React hook around the combo Web Worker (fire / progress / cancel / graph). */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ComboWorkerRequest, ComboWorkerResponse } from "@/application/combat-lab/worker/comboMessages";
import type { ComboGraph } from "@/domain/combat-lab/analysis/combo";

export type UseComboState =
{
  isRunning: boolean;
  progress: { completed: number; total: number } | null;
  graph: ComboGraph | null;
  error: string | null;
};

export function useCombo()
{
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<UseComboState>({ isRunning: false, progress: null, graph: null, error: null });

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

  const run = useCallback((request: ComboWorkerRequest): Promise<ComboGraph> =>
  {
    return new Promise((resolve, reject) =>
    {
      if (typeof Worker === "undefined")
      {
        reject(new Error("Web Workers are not available in this environment."));
        return;
      }

      terminate();
      setState({ isRunning: true, progress: { completed: 0, total: request.count }, graph: null, error: null });

      const worker = new Worker(new URL("../worker/combo.worker.ts", import.meta.url));
      workerRef.current = worker;

      worker.addEventListener("message", (event: MessageEvent<ComboWorkerResponse>) =>
      {
        const message = event.data;
        if (message.type === "progress")
        {
          setState(prev => ({ ...prev, progress: { completed: message.completed, total: message.total } }));
        }
        else if (message.type === "done")
        {
          setState(prev => ({ ...prev, isRunning: false, graph: message.graph }));
          terminate();
          resolve(message.graph);
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
