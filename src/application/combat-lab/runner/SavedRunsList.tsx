"use client";

/**
 * List of saved simulation runs. Pick one to reopen (summary + replayable
 * fights); delete removes it. Empty until the user saves a run from the runner.
 */

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useSavedSimulations } from "@/application/combat-lab/hooks/useSavedSimulations";
import { SavedRunView } from "@/application/combat-lab/runner/SavedRunView";
import { Button } from "@/common/components/ui/button";
import { Card, CardContent } from "@/common/components/ui/card";

function formatDate(iso: string): string
{
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("pl-PL");
}

export function SavedRunsList()
{
  const { simulations, isLoading, remove, isRemoving } = useSavedSimulations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleDelete = async (id: string) =>
  {
    try
    {
      await remove(id);
      if (selectedId === id) setSelectedId(null);
      toast.success("Usunięto bieg.");
    }
    catch
    {
      toast.error("Nie udało się usunąć biegu.");
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Wczytywanie zapisanych biegów…</p>;

  if (simulations.length === 0)
  {
    return <p className="text-sm text-muted-foreground">Brak zapisanych biegów. Uruchom i zapisz symulację w zakładce „Nowa symulacja&quot;.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {simulations.map(sim => (
              <li key={sim.id} className="flex items-center justify-between gap-3 px-4 py-2">
                <button
                  type="button"
                  className={`flex-1 text-left ${selectedId === sim.id ? "font-semibold" : ""}`}
                  onClick={() => setSelectedId(sim.id)}
                >
                  <span>{sim.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{formatDate(sim.createdAt)}</span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Usuń bieg"
                  disabled={isRemoving}
                  onClick={() => handleDelete(sim.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {selectedId && <SavedRunView id={selectedId} />}
    </div>
  );
}
