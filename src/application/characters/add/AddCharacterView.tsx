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

import { allowedCharacterCategories } from "@/domain/characters/Character";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { actions } from "@/persistence/slices/characterSlice";
import { displayedText } from "@/presentation/translations";
import { onError, onSuccess } from "@/common/global/onSaveCallbacks";

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
        onSuccess: (data) => onSuccess(() =>
        {

            dispatch(actions.setCharacterShortName({ id: data.id, shortName: data.shortName }));
            form.reset(initialValues);
            router.push(`/characters/${data.id}/edit?tab=character`);
        }),
        onError: (error) => onError(error)
    });

    function onSubmit(values: UpsertCharacterHeaderType) 
    {
        mutate(values);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mx-4">
                
                <p className='text-xl text-center text-primary pt-8 font-semibold '>
                    {displayedText.create_new_character} 
                </p>

                <InputFormField<UpsertCharacterHeaderType> 
                    path="name" 
                    inputPlaceholder={displayedText.name} 
                    inputClassName="w-xl"
                />

                <InputFormField<UpsertCharacterHeaderType> 
                    path="shortName" 
                    inputPlaceholder={displayedText.short_name} 
                    inputClassName="w-xl"
                />

                <LabeledFormSelectInput
                    name="category"
                    label={displayedText.category}
                    collectionToSelectFrom={allowedCharacterCategories}
                    value={selectedCategory}
                    placeholder={displayedText.selectCategory}
                    onChange={setSelectedCategory}
                />

                <AreaInputFormField<UpsertCharacterHeaderType> 
                    path="description" 
                    inputPlaceholder={displayedText.description} 
                />

                <SubmitButton isPending={isPending} />
            </form>
        </Form>
    );
};