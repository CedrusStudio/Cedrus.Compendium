"use client";

/**
 * React hook around the matchup Web Worker: fire a matrix computation, watch
 * progress, cancel, and read back the result.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { MatchupWorkerRequest, MatchupWorkerResponse } from "@/application/combat-lab/worker/matchupMessages";
import type { MatchupMatrix } from "@/domain/combat-lab/analysis/matchup";

export type UseMatchupState =
{
  isRunning: boolean;
  progress: { completed: number; total: number } | null;
  matrix: MatchupMatrix | null;
  error: string | null;
};

export function useMatchup()
{
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<UseMatchupState>({ isRunning: false, progress: null, matrix: null, error: null });

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

  const run = useCallback((request: MatchupWorkerRequest): Promise<MatchupMatrix> =>
  {
    return new Promise((resolve, reject) =>
    {
      if (typeof Worker === "undefined")
      {
        reject(new Error("Web Workers are not available in this environment."));
        return;
      }

      terminate();
      setState({ isRunning: true, progress: { completed: 0, total: 0 }, matrix: null, error: null });

      const worker = new Worker(new URL("../worker/matchup.worker.ts", import.meta.url));
      workerRef.current = worker;

      worker.addEventListener("message", (event: MessageEvent<MatchupWorkerResponse>) =>
      {
        const message = event.data;
        if (message.type === "progress")
        {
          setState(prev => ({ ...prev, progress: { completed: message.completed, total: message.total } }));
        }
        else if (message.type === "done")
        {
          setState(prev => ({ ...prev, isRunning: false, matrix: message.matrix }));
          terminate();
          resolve(message.matrix);
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
