"use client";

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useDispatch } from "react-redux";
import { actions } from "@/persistence/slices/characterSlice";
import { onError, onSuccess } from "@/common/global/onSaveCallbacks";
import charactersClient from "@/infrastructure/clients/charactersClient";
import { type HeaderDto } from "@/persistence/schemas/characters/headerSchema";
import { CharacterWithRelations, toCharacter } from '@/persistence/mappings/characterMapping';
import { CopyCreateCharacterDto } from "@/persistence/schemas/characters/copyCharacterSchema";

type UseCreateCharacterFromCopyParams = 
{
  onSuccessCallback?: () => void;
};

type CreateFromCopyPayload = 
{
  header: HeaderDto;
  baseCharacter: CharacterWithRelations;
};

export const useCreateCharacterFromCopy = ({ onSuccessCallback }: UseCreateCharacterFromCopyParams = {}) => 
{
  const dispatch = useDispatch();
  const router = useRouter();

  const { mutate, isPending } = useMutation
  ({
    mutationFn: async ({ header, baseCharacter }: CreateFromCopyPayload) => 
    {
      const baseChar = toCharacter(baseCharacter);

      const copyCreateData: CopyCreateCharacterDto = 
      {
        name: header.name,
        shortName: header.shortName,
        description: header.description,
        tags: header.tags,
        characteristics: baseChar.characteristics,
        attributes: baseChar.attributes,
        talents: baseChar.talents,
        health: baseChar.health,
        defenses: baseChar.defenses,
        offenses: baseChar.offenses,
        equipment: baseChar.equipment,
        powers: baseChar.powers,

        stancesIds: baseChar.stances.map(stance => stance.id),
        statesIds: baseChar.states.map(state => state.id),
        maneuversIds: baseChar.maneuvers.map(maneuver => maneuver.id),
        perksIds: baseChar.perks.map(perk => perk.id),
        spellsIds: baseChar.powers.flatMap(power => power.spells.map(s => s.id)),
      };
      
      const id = await charactersClient.copyCreate(copyCreateData);
      return { id, shortName: header.shortName };
    },
    onSuccess: (data) => onSuccess(() =>
    {
      dispatch(actions.setCharacterShortName({ id: data.id, shortName: data.shortName }));
      onSuccessCallback?.();
      router.push(`/characters/${data.id}/edit?tab=character`);
    }),
    onError: (error) => onError(error)
  });

  return { 
    createFromCopy: mutate, 
    isPending 
  };
};
