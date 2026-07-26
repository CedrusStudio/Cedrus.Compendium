"use client";

/** React hook around the meta Web Worker (fire / progress / cancel / report). */

import { useCallback, useEffect, useRef, useState } from "react";
import type { MetaWorkerRequest, MetaWorkerResponse } from "@/application/combat-lab/worker/metaMessages";
import type { MetaReport } from "@/domain/combat-lab/analysis/meta";

export type UseMetaState =
{
  isRunning: boolean;
  progress: { completed: number; total: number } | null;
  report: MetaReport | null;
  error: string | null;
};

export function useMeta()
{
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<UseMetaState>({ isRunning: false, progress: null, report: null, error: null });

  const terminate = useCallback(() =>
  {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const run = useCallback((request: MetaWorkerRequest): Promise<MetaReport> =>
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

      const worker = new Worker(new URL("../worker/meta.worker.ts", import.meta.url));
      workerRef.current = worker;

      worker.addEventListener("message", (event: MessageEvent<MetaWorkerResponse>) =>
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

  return { ...state, run };
}
