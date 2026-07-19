"use client";

import type { UseFormReturn } from "react-hook-form";
import { Character } from "@/domain/characters/Character";
import { Form } from "@/ui/form";
import { type DetailsDto, detailsSchema } from "@/persistence/schemas/characters/headerSchema";
import { InputFormField } from "@/common/components/form/InputFormField";
import SubmitButton from "@/common/components/form/SubmitButton";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import FormStringsInput from "@/common/components/inputs/FormStringsInput";
import { displayedText } from "@/common/translations";
import EditPerksList from "@/application/characters/edit/details/EditPerksList";
import useWatchedFormArray from "@/infrastructure/hooks/useWatchedFormArray";
import { Separator } from "@/common/components/ui/separator";
import { useCharacterForm } from "@/application/characters/edit/hooks/useCharacterForm";
import client from "@/infrastructure/clients/charactersClient";
import { FORM_IDS } from "@/application/characters/edit/editFormConstants";
import RaceSelector from "@/application/characters/edit/details/RaceSelector";
import { Button } from "@/ui/button";
import { useApiKey } from "@/common/hooks/useApiKey";

export default function EditDetailsView(input: { character: Character })
{
    const { character } = input;

    const { form, handleSubmit, isPending, isSuccess, formId } = useCharacterForm<DetailsDto>
    ({
        characterId: character.id,
        schema: detailsSchema,
        defaultValues: 
        {
            name: character.name,
            shortName: character.shortName,
            tags: character.tags,
            description: character.description,
            perks: character.perks,
            raceId: character.race?.id ?? null,
            apiKeys: character.apiKeys ?? []
        },
        updateFn: async (id, data) => client.updateDetails(id, data),
        formId: FORM_IDS.DETAILS,
    });

    const { watchedArray: perks, append: appendPerk, remove: removePerk } = useWatchedFormArray("perks", form.control);
    
    return (
        <Form {...form}>
            <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <EditHeader />
                <Separator className="my-4" />
                <EditApiKeysSection form={form} />
                <Separator className="my-4" />
                <RaceSelector
                  control={form.control} 
                                    currentRace={character.race ?? null}
                />
                <Separator className="my-4" />
                                <EditPerksList isPending={isPending} isSuccess={isSuccess} initialPerks={character.perks} perks={perks} append={appendPerk} remove={removePerk} currentCharacterId={character.id} currentCharacterName={character.name} />
                <SubmitButton isPending={isPending} formName={formId} />
            </form>
        </Form>
    );
};

function EditHeader()
{
    return (
        <div className="flex flex-col gap-3 pt-2">
            <div className="flex flex-row flex-wrap justify-center items-center gap-3 flex-1">

                <div className="flex flex-col justify-center items-center gap-6">
                    <InputFormField<DetailsDto> 
                        path="name" 
                        inputPlaceholder={displayedText.changeName} 
                        inputClassName="lg:w-lg"
                        />
                </div>

                <div className="flex flex-col justify-center items-center gap-6">
                    <InputFormField<DetailsDto> 
                        path="shortName" 
                        inputPlaceholder={displayedText.changeShortName} 
                        inputClassName="w-30"
                        />
                </div>

            </div>

            <FormTagsInput<DetailsDto> path="tags" beAbleToSetCharacterAndSessionTags={true} entityType="characters" />
    
            <AreaInputFormField<DetailsDto>
                path="description"
                inputPlaceholder={displayedText.changeDescription}
            />
        </div>
    )
}

function EditApiKeysSection({ form }: { form: UseFormReturn<DetailsDto> })
{
    return (
        <div className="flex flex-col items-center gap-2 pt-2">
            <p className="text-sm font-medium capitalize">{displayedText.apiKeys}</p>
            <p className="max-w-md text-center text-xs text-muted-foreground">{displayedText.apiKeysDescription}</p>

            <FormStringsInput<DetailsDto>
                path="apiKeys"
                placeholder={displayedText.apiKeys}
                maxCount={20}
            />

            <AssignCurrentApiKeyButton form={form} />
        </div>
    );
}

// Takes `form` as a prop (instead of reading it via useFormContext) so it
// doesn't depend on being rendered inside a real react-hook-form FormProvider
// — EditDetailsView.test.tsx (and other tests in this codebase) mock "@/ui/form"'s
// <Form> with a plain <div>, which provides no such context.
function AssignCurrentApiKeyButton({ form }: { form: UseFormReturn<DetailsDto> })
{
    const { apiKey } = useApiKey();

    const handleAssignCurrentApiKey = () =>
    {
        if (!apiKey) return;

        const currentApiKeys = form.getValues("apiKeys") ?? [];
        if (currentApiKeys.includes(apiKey)) return;

        form.setValue("apiKeys", [...currentApiKeys, apiKey], { shouldDirty: true });
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!apiKey}
            title={apiKey ? undefined : displayedText.noApiKeySet}
            onClick={handleAssignCurrentApiKey}
        >
            {displayedText.assignCurrentApiKey}
        </Button>
    );
}