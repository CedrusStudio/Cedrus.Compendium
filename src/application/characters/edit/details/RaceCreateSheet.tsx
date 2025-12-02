"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/common/components/ui/sheet";
import { Button } from "@/common/components/ui/button";
import { Form } from "@/common/components/ui/form";
import { Label } from "@/common/components/ui/label";
import { InputFormField } from "@/common/components/form/InputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import SubmitButton from "@/common/components/form/SubmitButton";
import { displayedText } from "@/presentation/translations";
import { Plus } from "lucide-react";
import { RaceDto, raceSchema } from "@/persistence/schemas/characters/raceSchema";
import racesClient from "@/infrastructure/clients/racesClient";
import { defaultRace } from "@/domain/Race";
import { ulid } from "ulid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { onSuccess, onError } from "@/common/global/onSaveCallbacks";
import { useRouter } from "next/navigation";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";

type RaceCreateSheetProps = {
  onRaceCreated: (raceId: string) => void;
};

export default function RaceCreateSheet({ onRaceCreated }: RaceCreateSheetProps) 
{
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const formId = `create-race-${ulid()}`;

  const form = useForm<RaceDto>({
    resolver: zodResolver(raceSchema),
    defaultValues: {
      id: ulid(),
      ...defaultRace,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RaceDto) => {
      const newRaceId = await racesClient.add(data);
      return newRaceId;
    },
    onSuccess: (newRaceId: string) => {
      onSuccess(() => {
        queryClient.invalidateQueries({ queryKey: ['races'] });
        router.refresh();
        onRaceCreated(newRaceId);
        setIsOpen(false);
        form.reset({ id: ulid(), ...defaultRace });
      }, "bottom-center");
    },
    onError: (error: Error) => {
      onError(error, "bottom-center");
    },
  });

  const handleSubmit = (data: RaceDto) => {
    mutation.mutate(data);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          {displayedText.createNewRace || "Stwórz nową rasę"}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="first-letter:uppercase">
            {displayedText.createNewRace || "Stwórz nową rasę"}
          </SheetTitle>
          <SheetDescription>
            {displayedText.createRaceDescription || "Wypełnij poniższe pola aby stworzyć nową rasę"}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form 
            id={formId} 
            onSubmit={form.handleSubmit(handleSubmit)} 
            className="space-y-6 mt-4"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="capitalize">{displayedText.name}</Label>
                <InputFormField<RaceDto> 
                  path="name" 
                  inputPlaceholder={displayedText.changeName} 
                />
              </div>

              <div className="space-y-2">
                <Label className="capitalize">{displayedText.description}</Label>
                <AreaInputFormField<RaceDto> 
                  path="description" 
                  inputPlaceholder={displayedText.changeDescription} 
                />
              </div>

              <FormTagsInput<RaceDto> path="tags" />

              <div className="space-y-3">
                <Label className="text-base">
                  {displayedText.characteristicModifiers || "Modyfikatory cech"}
                </Label>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs capitalize">{displayedText.strength}</Label>
                    <InputFormField<RaceDto> 
                      path="strengthModifier" 
                      inputClassName="h-10 text-center font-medium" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs capitalize">{displayedText.dexterity}</Label>
                    <InputFormField<RaceDto> 
                      path="dexterityModifier" 
                      inputClassName="h-10 text-center font-medium" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs capitalize">{displayedText.constitution}</Label>
                    <InputFormField<RaceDto> 
                      path="constitutionModifier" 
                      inputClassName="h-10 text-center font-medium" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs capitalize">{displayedText.mind}</Label>
                    <InputFormField<RaceDto> 
                      path="mindModifier" 
                      inputClassName="h-10 text-center font-medium" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs capitalize">{displayedText.charisma}</Label>
                    <InputFormField<RaceDto> 
                      path="charismaModifier" 
                      inputClassName="h-10 text-center font-medium" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs capitalize">{displayedText.spellborn}</Label>
                    <InputFormField<RaceDto> 
                      path="spellbornModifier" 
                      inputClassName="h-10 text-center font-medium" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Form>

        <SheetFooter className="mt-6">
          <SubmitButton isPending={mutation.isPending} formName={formId} className="w-full" />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
