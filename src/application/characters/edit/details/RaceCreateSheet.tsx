"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { typedZodResolver } from "@/common/global/validation";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/common/components/ui/sheet";
import { Button } from "@/common/components/ui/button";
import { Form } from "@/common/components/ui/form";
import { Label } from "@/common/components/ui/label";
import { InputFormField } from "@/common/components/form/InputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import SubmitButton from "@/common/components/form/SubmitButton";
import { displayedText } from "@/common/translations";
import { Plus } from "lucide-react";
import { RaceDto, raceSchema } from "@/persistence/schemas/characters/raceSchema";
import racesClient from "@/infrastructure/clients/racesClient";
import { defaultRace } from "@/domain/Race";
import { ulid } from "ulid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { onSuccess, onError } from "@/common/global/onSaveCallbacks";
import { useRouter } from "next/navigation";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import { type Race } from "@/domain/Race";

type RaceCreateSheetProps = 
{
  onRaceCreated: (race: Race) => void;
};

export default function RaceCreateSheet({ onRaceCreated }: RaceCreateSheetProps) 
{
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const formId = `create-race-${ulid()}`;

  const form = useForm<RaceDto>
  ({
    resolver: typedZodResolver(raceSchema),
    defaultValues: 
    {
      id: ulid(),
      ...defaultRace,
    },
  });

  const mutation = useMutation
  ({
    mutationFn: async (data: RaceDto) => 
    {
      const newRaceId = await racesClient.add(data);
      return newRaceId;
    },
    onSuccess: (newRaceId: string, newRace: RaceDto) => 
    {
      onSuccess(() => 
      {
        const { id: _draftRaceId, ...persistedRace } = newRace;

        queryClient.invalidateQueries({ queryKey: ['races'] });
        router.refresh();
        onRaceCreated({ ...persistedRace, id: newRaceId });
        setIsOpen(false);
        form.reset({ id: ulid(), ...defaultRace });
      }, "bottom-center");
    },
    onError: (error: Error) => 
    {
      onError(error, "bottom-center");
    },
  });

  const handleSubmit = (data: RaceDto) => 
  {
    mutation.mutate(data);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      
      <SheetTrigger asChild>
        <Button type="button" variant="outline">
          <Plus className="h-2 w-2" />
          <span className="first-letter:uppercase">{displayedText.createNewRace}</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full">
        
        <SheetHeader>
          <SheetTitle className="first-letter:uppercase">{displayedText.createNewRace}</SheetTitle>
          <SheetDescription>{displayedText.createRaceDescription}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col place-content-center place-items-center auto-rows-min gap-3">
          <Form {...form}>
            <form 
              id={formId} 
              onSubmit={form.handleSubmit(handleSubmit)} 
              className="space-y-6"
            >
              <div className="space-y-4 mx-4 flex flex-col">
                <div className="space-y-2">
                  <Label className="capitalize place-items-center place-content-center">{displayedText.name}</Label>
                  <InputFormField<RaceDto> 
                    path="name" 
                    inputPlaceholder={displayedText.changeName} 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="capitalize place-items-center place-content-center">{displayedText.description}</Label>
                  <AreaInputFormField<RaceDto> 
                    path="description" 
                    inputPlaceholder={displayedText.changeDescription} 
                  />
                </div>

                <FormTagsInput<RaceDto> path="tags" entityType="races" />

                <div className="space-y-3 flex flex-col place-content-center place-items-center">
                  <Label className="text-base">
                    <span className="first-letter:uppercase">{displayedText.characteristicModifiers}</span>
                  </Label>
                  
                  <div className="grid grid-cols-2 gap-4 mx-4">
                    
                    <div className="flex flex-col gap-2 place-content-center place-items-center">
                      <div className="flex flex-col gap-2 place-content-center place-items-center">
                        <Label className="text-xs capitalize">{displayedText.strength}</Label>
                        <InputFormField<RaceDto> 
                          path="strengthModifier" 
                          inputClassName="max-w-[3rem] text-center font-medium" 
                        />
                      </div>
                      
                      <div className="flex flex-col gap-2 place-content-center place-items-center">
                        <Label className="text-xs capitalize">{displayedText.dexterity}</Label>
                        <InputFormField<RaceDto> 
                          path="dexterityModifier" 
                          inputClassName="max-w-[3rem] text-center font-medium" 
                        />
                      </div>
                      
                      <div className="flex flex-col gap-2 place-content-center place-items-center">
                        <Label className="text-xs capitalize">{displayedText.constitution}</Label>
                        <InputFormField<RaceDto> 
                          path="constitutionModifier" 
                          inputClassName="max-w-[3rem] text-center font-medium" 
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 place-content-center place-items-center">
                      <div className="flex flex-col gap-2 place-content-center place-items-center">
                        <Label className="text-xs capitalize">{displayedText.mind}</Label>
                        <InputFormField<RaceDto> 
                          path="mindModifier" 
                          inputClassName="max-w-[3rem] text-center font-medium" 
                        />
                      </div>
                      
                      <div className="flex flex-col gap-2 place-content-center place-items-center">
                        <Label className="text-xs capitalize">{displayedText.charisma}</Label>
                        <InputFormField<RaceDto> 
                          path="charismaModifier" 
                          inputClassName="max-w-[3rem] text-center font-medium" 
                        />
                      </div>
                      
                      <div className="flex flex-col gap-2 place-content-center place-items-center">
                        <Label className="text-xs capitalize">{displayedText.spellborn}</Label>
                        <InputFormField<RaceDto> 
                          path="spellbornModifier" 
                          inputClassName="max-w-[3rem] text-center font-medium" 
                        />
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </form>
          </Form>
        </div>

        <SheetFooter>
          <SubmitButton isPending={mutation.isPending} formName={formId} className="w-full" />
          <SheetClose className="capitalize" asChild>
            <Button variant="outline" type='button'>{displayedText.close}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
