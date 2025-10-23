"use client";

import { Character } from "@/domain/characters/Character";
import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { updateCharacterDetails } from "@/persistence/charactersRepository";
import { type DetailsDto, detailsSchema } from "@/persistence/schemas/characters/headerSchema";
import { InputFormField } from "@/common/components/form/InputFormField";
import SubmitButton from "@/common/components/form/SubmitButton";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import { SelectFormField } from "@/common/components/form/SelectFormField";
import { allowedCharacterCategories } from "@/domain/characters/Character";
import { displayedText } from "@/presentation/translations";
import { onError, onSuccess } from "@/common/global/onSaveCallbacks";
import EditPerksList from "@/application/characters/edit/details/EditPerksList";
import useWatchedFormArray from "@/infrastructure/hooks/useWatchedFormArray";
import { Separator } from "@/common/components/ui/separator";

export default function EditDetailsView(input: { character: Character })
{
    const initialHeaderValues: DetailsDto =
    {
        name: input.character.name,
        shortName: input.character.shortName,
        category: input.character.category,
        description: input.character.description,
        perks: input.character.perks
    };

    const form = useForm<DetailsDto>
    ({
        resolver: zodResolver(detailsSchema),
        defaultValues: initialHeaderValues,
    })
    
    const id = input.character.id;
    const queryClient = useQueryClient();
    const router = useRouter();
    
    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (characterDetails: DetailsDto) => await updateCharacterDetails(id, characterDetails),
        onSuccess: () => onSuccess(() =>
        {
            queryClient.invalidateQueries({ queryKey: ['characters'] });
            queryClient.invalidateQueries({ queryKey: [`characters/${id}`] });
            queryClient.invalidateQueries({ queryKey: [`characters/${id}/edit`] });
            router.refresh();
        }),
        onError: (error) => onError(error)
    });

    function onSubmit(values: DetailsDto) 
    {
        mutate(values);
    }

    const { watchedArray: perks, append: appendPerk, remove: removePerk } = useWatchedFormArray("perks", form.control);
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <EditHeader />
                <Separator className="my-4" />
                <EditPerksList isPending={isPending} perks={perks} append={appendPerk} remove={removePerk} />
                <SubmitButton isPending={isPending} />
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

                <div className="flex flex-col justify-center items-center gap-6">
                    <SelectFormField<DetailsDto>
                        path="category"
                        items={allowedCharacterCategories}
                        noLabel
                        />
                </div>

            </div>
    
            <AreaInputFormField<DetailsDto> 
                path="description" 
                inputPlaceholder={displayedText.changeDescription} 
            />
        </div>
    )
}