"use client";

/**
 * Combat Replay — steps through a `CombatLog` turn by turn. Because the log is
 * deterministic and already carries every hp/status change, this component
 * recomputes nothing: it folds the log into frames (`buildReplayFrames`) once
 * and scrubs an index over them.
 */

import { useEffect, useMemo, useState } from "react";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { CombatLog } from "@/domain/combat-lab/engine/CombatLog";
import { buildReplayFrames } from "@/domain/combat-lab/replay/buildReplayFrames";
import { statusLabelsPl } from "@/domain/combat-lab/i18n/labels";
import { Button } from "@/common/components/ui/button";
import { Card } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { cn } from "@/lib/utils";

export type CombatReplayProps =
{
  log: CombatLog;
  /** Autoplay interval in ms. Default 700. */
  intervalMs?: number;
};

export function CombatReplay({ log, intervalMs = 700 }: CombatReplayProps)
{
  const frames = useMemo(() => buildReplayFrames(log), [log]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const lastIndex = frames.length - 1;
  const frame = frames[Math.min(index, lastIndex)];

  useEffect(() =>
  {
    if (!playing) return;
    if (index >= lastIndex)
    {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setIndex(i => Math.min(i + 1, lastIndex)), intervalMs);
    return () => clearTimeout(timer);
  }, [playing, index, lastIndex, intervalMs]);

  if (!frame) return null;

  const clamp = (value: number) => Math.max(0, Math.min(lastIndex, value));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {frame.combatants.map(combatant => (
          <Card key={combatant.id} className="flex-1 min-w-[200px] p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{combatant.name}</span>
              <span className="text-sm text-muted-foreground">
                {combatant.hp} / {combatant.maxHp}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded bg-muted">
              <div
                className={cn("h-full rounded transition-all", combatant.hp <= 0 ? "bg-destructive" : "bg-primary")}
                style={{ width: `${Math.max(0, Math.min(100, (combatant.hp / combatant.maxHp) * 100))}%` }}
              />
            </div>
            {combatant.statuses.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {combatant.statuses.map(status => (
                  <Badge key={status} variant="secondary" className="text-xs">
                    {statusLabelsPl[status]}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setIndex(0)} aria-label="Początek">
          <ChevronFirst className="size-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setIndex(i => clamp(i - 1))} aria-label="Poprzednia">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setPlaying(p => !p)} aria-label={playing ? "Pauza" : "Odtwórz"}>
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={() => setIndex(i => clamp(i + 1))} aria-label="Następna">
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setIndex(lastIndex)} aria-label="Koniec">
          <ChevronLast className="size-4" />
        </Button>

        <input
          type="range"
          min={0}
          max={lastIndex}
          value={Math.min(index, lastIndex)}
          onChange={e => { setPlaying(false); setIndex(clamp(Number(e.target.value))); }}
          className="flex-1 accent-primary"
          aria-label="Przewijanie"
        />
        <span className="w-20 text-right text-sm text-muted-foreground tabular-nums">
          {Math.min(index, lastIndex) + 1} / {frames.length}
        </span>
      </div>

      <Card className="max-h-64 overflow-y-auto p-0">
        <ul className="divide-y text-sm">
          {frames.map(f => (
            <li
              key={f.index}
              className={cn(
                "cursor-pointer px-3 py-1.5",
                f.index === frame.index ? "bg-accent font-medium" : "hover:bg-muted/50",
                f.event.kind === "roundStart" && "text-muted-foreground",
              )}
              onClick={() => { setPlaying(false); setIndex(f.index); }}
            >
              {f.label}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
