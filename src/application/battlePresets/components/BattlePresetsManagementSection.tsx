"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/alert-dialog";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { displayedText } from "@/common/translations";
import { deleteIcon, editIcon } from "@/common/icons";
import { useBattlePresets } from "@/application/battlePresets/hooks/useBattlePresets";

/**
 * Management view for Battle Presets (Personalizacja → Battle Presets in the
 * source feature document). There is no real "subpage per personalization
 * feature" precedent in this repo to follow — `src/app/personalization/tags`
 * only contains a leftover, page-less test file from an earlier refactor
 * (the actual tag management view lives at /admin/tags, which is an
 * admin-only, unrelated feature). The real precedent is the single
 * personalization page composed of sections (favorite characters, quick
 * links, bestiary columns, ...), so this renders as one more such section
 * rather than a new route.
 */
export default function BattlePresetsManagementSection()
{
  const { presets, isLoading, updateMutation, deleteMutation } = useBattlePresets();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const startEdit = (id: string, currentName: string) =>
  {
    setEditingId(id);
    setEditingName(currentName);
  };

  const cancelEdit = () =>
  {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async () =>
  {
    if (!editingId) return;

    const name = editingName.trim();
    if (!name)
    {
      toast.error(displayedText.battlePresetNameRequired);
      return;
    }

    try
    {
      await updateMutation.mutateAsync({ id: editingId, data: { name } });
      toast.success(displayedText.battlePresetUpdated);
      cancelEdit();
    }
    catch
    {
      toast.error(displayedText.battlePresetSaveFailed);
    }
  };

  const handleDelete = async (id: string) =>
  {
    try
    {
      await deleteMutation.mutateAsync(id);
      if (editingId === id) cancelEdit();
      toast.success(displayedText.battlePresetDeleted);
    }
    catch
    {
      toast.error(displayedText.battlePresetDeleteFailed);
    }
  };

  return (
    <section className="rounded-lg border p-6 space-y-4">
      <div>
        <h2 className="text-2xl font-semibold first-letter:capitalize">{displayedText.battlePresets}</h2>
        <p className="text-sm text-muted-foreground">{displayedText.manageBattlePresets}</p>
      </div>

      {
        isLoading ? <p className="text-sm text-muted-foreground">...</p> : (
          <div className="space-y-3">
            {
              presets.length > 0 ? presets.map(preset => (
                <div key={preset.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  {
                    editingId === preset.id ? (
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={event => setEditingName(event.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" size="sm" disabled={updateMutation.isPending} onClick={saveEdit}>
                          <span className="first-letter:capitalize">{displayedText.save}</span>
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                          <span className="first-letter:capitalize">{displayedText.cancel}</span>
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="truncate font-medium">{preset.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label={`Edytuj ${preset.name}`}
                            title={`Edytuj ${preset.name}`}
                            onClick={() => startEdit(preset.id, preset.name)}
                          >
                            {editIcon}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                aria-label={`Usuń ${preset.name}`}
                                title={`Usuń ${preset.name}`}
                                disabled={deleteMutation.isPending}
                              >
                                {deleteIcon}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{displayedText.deleteConfirmation}</AlertDialogTitle>
                                <AlertDialogDescription>{displayedText.deleteConfirmationDescription}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="capitalize">{displayedText.cancel}</AlertDialogCancel>
                                <AlertDialogAction disabled={deleteMutation.isPending} onClick={() => handleDelete(preset.id)}>
                                  {deleteMutation.isPending ? displayedText.deleting : displayedText.delete}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )
                  }
                </div>
              )) : <p className="text-sm text-muted-foreground">{displayedText.noBattlePresetsSaved}</p>
            }
          </div>
        )
      }
    </section>
  );
}
