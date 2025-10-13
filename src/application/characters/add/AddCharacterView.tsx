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
import { allowedCharacterCategories } from "@/domain/characters/Character";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { actions } from "@/persistence/slices/characterSlice";

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
    const dispatch = useDispatch();

    const form = useForm<UpsertCharacterHeaderType>
    ({
        resolver: zodResolver(upsertCharacterHeaderSchema),
        defaultValues: initialValues,
    })
    
    const router = useRouter();
    
    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (characterHeader: UpsertCharacterHeaderType) => 
        {
            const id = await addCharacter(characterHeader);
            return { id, shortName: characterHeader.shortName };
        },
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

            dispatch(actions.setCharacterShortName({ id: data.id, shortName: data.shortName }));
            form.reset(initialValues);
            router.push(`/characters/${data.id}/edit?tab=character`);
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
                    {translate("create_new_character")} 
                </p>

                <InputFormField<UpsertCharacterHeaderType> 
                    path="name" 
                    inputPlaceholder={translate("name")} 
                    inputClassName="w-xl"
                />

                <InputFormField<UpsertCharacterHeaderType> 
                    path="shortName" 
                    inputPlaceholder={translate("short_name")} 
                    inputClassName="w-xl"
                />

                <LabeledFormSelectInput
                    name="category"
                    label={translate("category")}
                    collectionToSelectFrom={allowedCharacterCategories}
                    value={selectedCategory}
                    placeholder={translate("selectCategory")}
                    onChange={setSelectedCategory}
                />

                <AreaInputFormField<UpsertCharacterHeaderType> 
                    path="description" 
                    inputPlaceholder={translate("description")} 
                />

                <SubmitButton isPending={isPending} />
            </form>
        </Form>
    );
};