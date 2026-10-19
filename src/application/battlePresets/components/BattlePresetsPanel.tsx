"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import SelectOneOfStrings from "@/common/components/selects/SelectOneOfStrings";
import { displayedText } from "@/common/translations";
import { deleteIcon } from "@/common/icons";
import { useApiKey } from "@/common/hooks/useApiKey";
import { useBattlePresets } from "@/application/battlePresets/hooks/useBattlePresets";
import { toBattleConfiguration, restoreDuplicatedCharacterRefs } from "@/application/battlePresets/battleConfigurationMapping";
import { RootState } from "@/persistence/slices/store";
import { actions } from "@/persistence/slices/bestiarySlice";
import charactersClient from "@/infrastructure/clients/charactersClient";
import { Character } from "@/domain/characters/Character";

export default function BattlePresetsPanel()
{
  const dispatch = useDispatch();
  const { hasApiKey } = useApiKey();
  const { presets, isLoading, createMutation, updateMutation, deleteMutation, loadMutation } = useBattlePresets();

  const addedToBattle = useSelector((state: RootState) => state.bestiary.addedToBattle);
  const initiatives = useSelector((state: RootState) => state.bestiary.initiatives);
  const externalParticipants = useSelector((state: RootState) => state.bestiary.externalParticipants);
  const duplicatedCharacters = useSelector((state: RootState) => state.bestiary.duplicatedCharacters);
  const loadedPresetId = useSelector((state: RootState) => state.bestiary.loadedPresetId);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(loadedPresetId ?? "");
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");

  if (!hasApiKey)
  {
    return (
      <div className="rounded-lg border p-3 text-sm text-muted-foreground">
        {displayedText.battlePresetsRequireApiKey}
      </div>
    );
  }

  const presetItems = presets.map(preset => ({ label: preset.name, value: preset.id }));
  const loadedPresetStillExists = loadedPresetId !== null && presets.some(preset => preset.id === loadedPresetId);
  const selectedPresetName = presets.find(preset => preset.id === selectedPresetId)?.name ?? '';

  const buildCurrentConfiguration = () => toBattleConfiguration({
    addedToBattle,
    initiatives,
    externalParticipants,
    duplicatedCharacters,
  });

  const handleLoad = async () =>
  {
    if (!selectedPresetId) return;

    try
    {
      const preset = await loadMutation.mutateAsync(selectedPresetId);

      // Fetch current character data for every duplicate's original
      // character, so the restored duplicate reflects today's stats rather
      // than a frozen snapshot (see battleConfigurationMapping.ts).
      const originalCharacterIds = [...new Set(preset.configuration.duplicatedCharacterRefs.map(ref => ref.originalCharacterId))];
      const originalCharacters: Character[] = originalCharacterIds.length > 0
        ? await charactersClient.getByIds(originalCharacterIds)
        : [];
      const restoredDuplicates = restoreDuplicatedCharacterRefs(preset.configuration.duplicatedCharacterRefs, originalCharacters);

      dispatch(actions.clearBattle());
      dispatch(actions.addSelectedToBattle(preset.configuration.characterIds));

      for (const [characterId, entry] of Object.entries(preset.configuration.initiatives))
      {
        dispatch(actions.setInitiative({ characterId, initiative: entry.initiative }));
      }

      for (const externalParticipant of preset.configuration.externalParticipants)
      {
        dispatch(actions.addExternalParticipant(externalParticipant));
      }

      for (const duplicate of restoredDuplicates)
      {
        dispatch(actions.addDuplicatedCharacter(duplicate));
      }

      dispatch(actions.setLoadedPresetId(preset.id));
      setSelectedPresetId(preset.id);
      toast.success(displayedText.battlePresetLoaded);
    }
    catch
    {
      toast.error(displayedText.battlePresetLoadFailed);
    }
  };

  const handleSaveCurrent = async () =>
  {
    if (!loadedPresetId) return;

    try
    {
      await updateMutation.mutateAsync({ id: loadedPresetId, data: { configuration: buildCurrentConfiguration() } });
      toast.success(displayedText.battlePresetUpdated);
    }
    catch
    {
      toast.error(displayedText.battlePresetSaveFailed);
    }
  };

  const handleSaveAs = async () =>
  {
    const name = saveAsName.trim();
    if (!name)
    {
      toast.error(displayedText.battlePresetNameRequired);
      return;
    }

    try
    {
      const { id } = await createMutation.mutateAsync({ name, configuration: buildCurrentConfiguration() });
      dispatch(actions.setLoadedPresetId(id));
      setSelectedPresetId(id);
      setSaveAsName("");
      setSaveAsOpen(false);
      toast.success(displayedText.battlePresetSaved);
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
      if (loadedPresetId === id)
      {
        dispatch(actions.setLoadedPresetId(null));
      }
      if (selectedPresetId === id)
      {
        setSelectedPresetId("");
      }
      toast.success(displayedText.battlePresetDeleted);
    }
    catch
    {
      toast.error(displayedText.battlePresetDeleteFailed);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
      <span className="text-sm font-medium first-letter:capitalize">{displayedText.battlePresets}</span>

      {
        presetItems.length > 0 ? (
          <SelectOneOfStrings
            id="battle-preset-select"
            value={selectedPresetId}
            items={presetItems}
            onChange={setSelectedPresetId}
            placeholder={displayedText.selectBattlePreset}
            triggerClassName="w-full sm:w-[220px]"
            capitalize={false}
          />
        ) : (
          <span className="text-sm text-muted-foreground">{isLoading ? "..." : displayedText.noBattlePresetsSaved}</span>
        )
      }

      <Button
        type="button"
        variant="outline"
        disabled={!selectedPresetId || loadMutation.isPending}
        onClick={handleLoad}
        title={displayedText.loadClearsCurrentBattle}
      >
        <span className="first-letter:capitalize">{displayedText.loadPreset}</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={!loadedPresetId || !loadedPresetStillExists || updateMutation.isPending}
        onClick={handleSaveCurrent}
      >
        <span className="first-letter:capitalize">{displayedText.saveCurrentPreset}</span>
      </Button>

      <Dialog open={saveAsOpen} onOpenChange={setSaveAsOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            <span className="first-letter:capitalize">{displayedText.saveAsNewPreset}</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="first-letter:capitalize">{displayedText.saveAsNewPreset}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 items-center gap-4 py-4 sm:grid-cols-4">
            <Label htmlFor="battle-preset-name">
              <span className="first-letter:capitalize">{displayedText.battlePresetName}</span>
            </Label>
            <Input
              id="battle-preset-name"
              value={saveAsName}
              onChange={event => setSaveAsName(event.target.value)}
              className="sm:col-span-3"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveAsOpen(false)}>
              <span className="first-letter:capitalize">{displayedText.cancel}</span>
            </Button>
            <Button type="button" disabled={createMutation.isPending} onClick={handleSaveAs}>
              <span className="first-letter:capitalize">{displayedText.save}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {
        selectedPresetId && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                disabled={deleteMutation.isPending}
                aria-label={`Usuń ${selectedPresetName}`}
                title={`Usuń ${selectedPresetName}`}
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
                <AlertDialogAction disabled={deleteMutation.isPending} onClick={() => handleDelete(selectedPresetId)}>
                  {deleteMutation.isPending ? displayedText.deleting : displayedText.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      }
    </div>
  );
}
