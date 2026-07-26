"use client";

/** React hook around the synergy Web Worker (fire / progress / cancel / result). */

import { useCallback, useEffect, useRef, useState } from "react";
import type { SynergyWorkerRequest, SynergyWorkerResponse } from "@/application/combat-lab/worker/synergyMessages";
import type { SynergyReport } from "@/domain/combat-lab/analysis/synergy";

export type UseSynergyState =
{
  isRunning: boolean;
  progress: { completed: number; total: number } | null;
  report: SynergyReport | null;
  error: string | null;
};

export function useSynergy()
{
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<UseSynergyState>({ isRunning: false, progress: null, report: null, error: null });

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

  const run = useCallback((request: SynergyWorkerRequest): Promise<SynergyReport> =>
  {
    return new Promise((resolve, reject) =>
    {
      if (typeof Worker === "undefined")
      {
        reject(new Error("Web Workers are not available in this environment."));
        return;
      }

      terminate();
      setState({ isRunning: true, progress: { completed: 0, total: 0 }, report: null, error: null });

      const worker = new Worker(new URL("../worker/synergy.worker.ts", import.meta.url));
      workerRef.current = worker;

      worker.addEventListener("message", (event: MessageEvent<SynergyWorkerResponse>) =>
      {
        const message = event.data;
        if (message.type === "progress")
        {
          setState(prev => ({ ...prev, progress: { completed: message.completed, total: message.total } }));
        }
        else if (message.type === "done")
        {
          setState(prev => ({ ...prev, isRunning: false, report: message.report }));
          terminate();
          resolve(message.report);
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
