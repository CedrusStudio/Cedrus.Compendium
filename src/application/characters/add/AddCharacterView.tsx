"use client";

import {
  Form
} from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from '@tanstack/react-query';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { addCharacter } from "@/persistence/characterRepository";
import { UpsertCharacterHeaderType, upsertCharacterHeaderSchema } from "@/persistence/characterSchemas";
import { InputFormField } from "@/common/components/form/InputFormField";
import SubmitButton from "@/common/components/form/SubmitButton";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import LabeledFormSelectInput from "@/common/components/inputs/LabeledFormSelectInput";
import { translate } from "@/domain/data/translations";
import { characterCategories } from "@/domain/data/categories";
import { useState } from "react";

const initialValues: UpsertCharacterHeaderType =
{
    name: "",
    shortName: "",
    category: "bohater",
    description: "",
};

export default function AddCharacterView()
{
    const [selectedCategory, setSelectedCategory] = useState<string>("");

    const form = useForm<UpsertCharacterHeaderType>
    ({
        resolver: zodResolver(upsertCharacterHeaderSchema),
        defaultValues: initialValues,
    })
    
    const router = useRouter();
    
    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (characterHeader: UpsertCharacterHeaderType) => await addCharacter(characterHeader),
        onSuccess: (data) => 
        {
            toast("Success", 
            {
                description: (
                    <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
                    <code className="text-white">{JSON.stringify("Character updated successfully", null, 2)}</code>
                    </pre>
                )
            });

            form.reset(initialValues);
            router.push(`/characters/${data}/edit?tab=character`);
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mx-4">
                
                <p className='text-xl text-center text-primary pt-8 font-semibold '>
                    Stwórz nową postać podając nazwę i opis
                </p>

                <InputFormField<UpsertCharacterHeaderType> 
                    path="name" 
                    inputPlaceholder="nazwa..." 
                    inputClassName="w-xl"
                />

                <InputFormField<UpsertCharacterHeaderType> 
                    path="shortName" 
                    inputPlaceholder="krótka nazwa bez spacji..." 
                    inputClassName="w-xl"
                />

                <LabeledFormSelectInput
                    name="category"
                    label={translate("category")}
                    collectionToSelectFrom={characterCategories}
                    value={selectedCategory}
                    placeholder="Wybierz kategorię"
                    onChange={setSelectedCategory}
                />

                <AreaInputFormField<UpsertCharacterHeaderType> 
                    path="description" 
                    inputPlaceholder="opis..." 
                />

                <SubmitButton isPending={isPending} />
            </form>
        </Form>
    );
};