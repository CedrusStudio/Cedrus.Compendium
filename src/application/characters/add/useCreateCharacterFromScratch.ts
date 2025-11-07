"use client";

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useDispatch } from "react-redux";
import { actions } from "@/persistence/slices/characterSlice";
import { onError, onSuccess } from "@/common/global/onSaveCallbacks";
import charactersClient from "@/infrastructure/clients/charactersClient";
import { type HeaderDto } from "@/persistence/schemas/characters/headerSchema";

type UseCreateCharacterFromScratchParams = 
{
  onSuccessCallback?: () => void;
};

export const useCreateCharacterFromScratch = ({ onSuccessCallback }: UseCreateCharacterFromScratchParams = {}) => 
{
  const dispatch = useDispatch();
  const router = useRouter();

  const { mutate, isPending } = useMutation
  ({
    mutationFn: async (characterHeader: HeaderDto) => 
    {
      const id = await charactersClient.add(characterHeader);
      return { id, shortName: characterHeader.shortName };
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
    createFromScratch: mutate, 
    isPending 
  };
};
