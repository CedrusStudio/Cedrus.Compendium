"use client";

/** React hook around the tuning Web Worker (fire / result / cancel). */

import { useCallback, useEffect, useRef, useState } from "react";
import type { TuningWorkerRequest, TuningWorkerResponse } from "@/application/combat-lab/worker/tuningMessages";
import type { TuningResult } from "@/domain/combat-lab/tuning/parameters";

export type UseTuningState =
{
  isRunning: boolean;
  result: TuningResult | null;
  error: string | null;
};

export function useTuning()
{
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<UseTuningState>({ isRunning: false, result: null, error: null });

  const terminate = useCallback(() =>
  {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const run = useCallback((request: TuningWorkerRequest): Promise<TuningResult> =>
  {
    return new Promise((resolve, reject) =>
    {
      if (typeof Worker === "undefined")
      {
        reject(new Error("Web Workers are not available in this environment."));
        return;
      }

      terminate();
      setState({ isRunning: true, result: null, error: null });

      const worker = new Worker(new URL("../worker/tuning.worker.ts", import.meta.url));
      workerRef.current = worker;

      worker.addEventListener("message", (event: MessageEvent<TuningWorkerResponse>) =>
      {
        const message = event.data;
        if (message.type === "done")
        {
          setState({ isRunning: false, result: message.result, error: null });
          terminate();
          resolve(message.result);
        }
        else
        {
          setState({ isRunning: false, result: null, error: message.message });
          terminate();
          reject(new Error(message.message));
        }
      });

      worker.addEventListener("error", (event) =>
      {
        setState({ isRunning: false, result: null, error: event.message });
        terminate();
        reject(new Error(event.message));
      });

      worker.postMessage(request);
    });
  }, [terminate]);

  useEffect(() => terminate, [terminate]);

  return { ...state, run };
}
