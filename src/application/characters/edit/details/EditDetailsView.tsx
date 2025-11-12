"use client";

import { Character } from "@/domain/characters/Character";
import { Form } from "@/ui/form";
import { type DetailsDto, detailsSchema } from "@/persistence/schemas/characters/headerSchema";
import { InputFormField } from "@/common/components/form/InputFormField";
import SubmitButton from "@/common/components/form/SubmitButton";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { displayedText } from "@/presentation/translations";
import EditPerksList from "@/application/characters/edit/details/EditPerksList";
import useWatchedFormArray from "@/infrastructure/hooks/useWatchedFormArray";
import { Separator } from "@/common/components/ui/separator";
import { useCharacterForm } from "@/application/characters/edit/hooks/useCharacterForm";
import client from "@/infrastructure/clients/charactersClient";
import { FORM_IDS } from "@/application/characters/edit/editFormConstants";

export default function EditDetailsView(input: { character: Character })
{
    const { character } = input;

    const { form, handleSubmit, isPending, formId } = useCharacterForm<DetailsDto>
    ({
        characterId: character.id,
        schema: detailsSchema,
        defaultValues: 
        {
            name: character.name,
            shortName: character.shortName,
            tags: character.tags,
            description: character.description,
            perks: character.perks
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
                <EditPerksList isPending={isPending} perks={perks} append={appendPerk} remove={removePerk} />
                <SubmitButton isPending={isPending} formName={formId} />
            </form>
        </Form>
    );
};

function EditHeader()
{
    return (
        <div className="flex flex-col gap-6 pt-2">
            <div className="flex flex-row flex-wrap justify-center items-center gap-6 flex-1">

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

            <FormTagsInput<DetailsDto> path="tags" />
    
            <AreaInputFormField<DetailsDto> 
                path="description" 
                inputPlaceholder={displayedText.changeDescription} 
            />
        </div>
    )
}