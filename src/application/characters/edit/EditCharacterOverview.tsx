"use client";

import { Character } from "@/domain/characters/Character";
import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner"
import { useRouter } from 'next/navigation';
import { upsertCharacterHeader } from "@/persistence/characterRepository";
import { upsertCharacterHeaderSchema, type UpsertCharacterHeaderType } from "@/persistence/characterSchemas";
import { InputFormField } from "@/common/components/form/InputFormField";
import SubmitButton from "@/common/components/form/SubmitButton";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";

const initialValues: UpsertCharacterHeaderType =
{
    name: "",
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
        onSuccess: () => 
        {
            toast("Success", 
            {
                description: (
                    <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
                    <code className="text-white">{JSON.stringify("Character updated successfully", null, 2)}</code>
                    </pre>
                )
            });

            queryClient.invalidateQueries({ queryKey: ['characters'] });
            queryClient.invalidateQueries({ queryKey: [`characters/${id}`] });
            form.reset(initialValues);
            router.refresh();
        },
        onError: (error) => 
        {
            toast("Error", 
            {
                description: (
                    <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
                    <code className="text-white">{JSON.stringify(error.message, null, 2)}</code>
                    </pre>
                )
            });
        },
    });

    function onSubmit(values: UpsertCharacterHeaderType) 
    {
        mutate(values);
    }

    return (
        <Form {...form}>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <p className='text-xl text-center text-primary pt-2 capitalize font-semibold '>
                    {input.character.name}
                </p>

                <InputFormField<UpsertCharacterHeaderType> 
                    path="name" 
                    inputPlaceholder="zmien nazwę..." 
                    inputClassName="w-xl"
                />
                
                <p className='text-xl text-center text-primary pt-2 capitalize font-semibold '>
                    {input.character.category}
                </p>

                <InputFormField<UpsertCharacterHeaderType> 
                    path="category" 
                    inputPlaceholder="zmien kategorię..." 
                    inputClassName="w-xl"
                />
    
                <p className='text-md text-center text-primary pt-2 capitalize'>
                    {input.character.description}
                </p>

                <AreaInputFormField<UpsertCharacterHeaderType> 
                    path="description" 
                    inputPlaceholder="zmien opis..." 
                />

                <SubmitButton isPending={isPending} />
            </form>

        </Form>
    );
};
