"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { addCharacter } from "@/persistence/charactersRepository";
import { type HeaderDto, headerSchema } from "@/persistence/schemas/characters/headerSchema";
import { InputFormField } from "@/common/components/form/InputFormField";
import SubmitButton from "@/common/components/form/SubmitButton";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import { allowedCharacterCategories } from "@/domain/characters/Character";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { actions } from "@/persistence/slices/characterSlice";
import { displayedText } from "@/presentation/translations";
import { onError, onSuccess } from "@/common/global/onSaveCallbacks";
import FormSelectInput from "@/common/components/inputs/FormSelectInput";

export default function AddCharacterView()
{
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const dispatch = useDispatch();

    const initialHeaderValues: HeaderDto =
    {
        name: "",
        shortName: "",
        category: "bohater",
        description: "",
    };

    const form = useForm<HeaderDto>
    ({
        resolver: zodResolver(headerSchema),
        defaultValues: initialHeaderValues,
    })
    
    const router = useRouter();
    
    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (characterHeader: HeaderDto) => 
        {
            const id = await addCharacter(characterHeader);
            return { id, shortName: characterHeader.shortName };
        },
        onSuccess: (data) => onSuccess(() =>
        {
            dispatch(actions.setCharacterShortName({ id: data.id, shortName: data.shortName }));
            form.reset(initialHeaderValues);
            router.push(`/characters/${data.id}/edit?tab=character`);
        }),
        onError: (error) => onError(error)
    });

    function onSubmit(values: HeaderDto) 
    {
        mutate(values);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mx-4">
                
                <p className='text-xl text-center text-primary pt-8 font-semibold'>
                    {displayedText.create_new_character} 
                </p>

                <InputFormField<HeaderDto> 
                    path="name" 
                    inputPlaceholder={displayedText.name} 
                    inputClassName="md:w-xl"
                />

                <InputFormField<HeaderDto> 
                    path="shortName" 
                    inputPlaceholder={displayedText.short_name} 
                    inputClassName="md:w-xl"
                />

                <FormSelectInput
                    name="category"
                    collectionToSelectFrom={allowedCharacterCategories}
                    value={selectedCategory}
                    placeholder={displayedText.selectCategory}
                    onChange={setSelectedCategory}
                />

                <AreaInputFormField<HeaderDto> 
                    path="description" 
                    inputPlaceholder={displayedText.description} 
                />

                <SubmitButton isPending={isPending} />
            </form>
        </Form>
    );
};