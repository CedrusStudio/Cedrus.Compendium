"use client";

import { Character } from "@/domain/characters/Character";
import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { upsertCharacterHeader } from "@/persistence/characterRepository";
import { upsertCharacterHeaderSchema, type UpsertCharacterHeaderType } from "@/persistence/characterSchemas";
import { InputFormField } from "@/common/components/form/InputFormField";
import SubmitButton from "@/common/components/form/SubmitButton";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import { SelectFormField } from "@/common/components/form/SelectFormField";
import { allowedCharacterCategories } from "@/domain/characters/Character";
import { displayedText } from "@/presentation/translations";
import { onError, onSuccess } from "@/common/global/onSaveCallbacks";

const initialValues: UpsertCharacterHeaderType =
{
    name: "",
    shortName: "",
    category: "bohater",
    description: "",
};

export default function EditCharacterOverview(input: { character: Character })
{
    const form = useForm<UpsertCharacterHeaderType>
    ({
        resolver: zodResolver(upsertCharacterHeaderSchema),
        defaultValues: initialValues,
    })
    
    const id = input.character.id;
    const queryClient = useQueryClient();
    const router = useRouter();
    
    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (characterHeader: UpsertCharacterHeaderType) => await upsertCharacterHeader(id, characterHeader),
        onSuccess: () => onSuccess(() =>
        {
            queryClient.invalidateQueries({ queryKey: ['characters'] });
            queryClient.invalidateQueries({ queryKey: [`characters/${id}`] });
            form.reset(initialValues);
            router.refresh();
        }),
        onError: (error) => onError(error)
    });

    function onSubmit(values: UpsertCharacterHeaderType) 
    {
        mutate(values);
    }

    return (
        <Form {...form}>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <div className="flex flex-row items-center justify-center gap-6">
                    <div className="flex flex-col justify-center items-center gap-6">
                        <p className='text-xl text-center text-primary pt-2 capitalize font-semibold '>
                            {input.character.name}
                        </p>

                        <InputFormField<UpsertCharacterHeaderType> 
                            path="name" 
                            inputPlaceholder={displayedText.changeName} 
                            inputClassName="w-xl"
                            />
                    </div>

                    <div className="flex flex-col justify-center items-center gap-6">
                        <p className='text-xl text-center text-primary pt-2 capitalize font-semibold '>
                            {input.character.shortName}
                        </p>

                        <InputFormField<UpsertCharacterHeaderType> 
                            path="shortName" 
                            inputPlaceholder={displayedText.changeShortName} 
                            inputClassName="w-l"
                        />
                    </div>

                    <div className="flex flex-col justify-center items-center gap-6">
                        <p className='text-xl text-center text-primary pt-2 capitalize font-semibold '>
                            {input.character.category}
                        </p>

                        <SelectFormField<UpsertCharacterHeaderType>
                            path="category"
                            items={allowedCharacterCategories}
                            noLabel
                        />
                    </div>
                </div>
    
                <p className='text-md text-center text-primary pt-2'>
                    {input.character.description}
                </p>

                <AreaInputFormField<UpsertCharacterHeaderType> 
                    path="description" 
                    inputPlaceholder={displayedText.changeDescription} 
                />

                <SubmitButton isPending={isPending} />
            </form>

        </Form>
    );
};
