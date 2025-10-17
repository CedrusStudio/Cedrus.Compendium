"use client";

import { Character } from "@/domain/characters/Character";
import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { upsertCharacterHeader } from "@/persistence/characterRepository";
import { type  HeaderDto, headerSchema } from "@/persistence/schemas/characters/headerSchema";
import { InputFormField } from "@/common/components/form/InputFormField";
import SubmitButton from "@/common/components/form/SubmitButton";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import { SelectFormField } from "@/common/components/form/SelectFormField";
import { allowedCharacterCategories } from "@/domain/characters/Character";
import { displayedText } from "@/presentation/translations";
import { onError, onSuccess } from "@/common/global/onSaveCallbacks";
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';

export default function EditDetailsView(input: { character: Character })
{
    const initialHeaderValues: HeaderDto =
    {
        name: input.character.name,
        shortName: input.character.shortName,
        category: input.character.category,
        description: input.character.description,
    };

    const form = useForm<HeaderDto>
    ({
        resolver: zodResolver(headerSchema),
        defaultValues: initialHeaderValues,
    })
    
    const id = input.character.id;
    const queryClient = useQueryClient();
    const router = useRouter();
    
    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (characterHeader: HeaderDto) => await upsertCharacterHeader(id, characterHeader),
        onSuccess: () => onSuccess(() =>
        {
            queryClient.invalidateQueries({ queryKey: ['characters'] });
            queryClient.invalidateQueries({ queryKey: [`characters/${id}`] });
            router.refresh();
        }),
        onError: (error) => onError(error)
    });

    function onSubmit(values: HeaderDto) 
    {
        mutate(values);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <EditHeader isPending={isPending} />

                    {/* <div className="flex flex-col justify-center items-center gap-6">
                            <SelectFormField<HeaderDto>
                                path="category"
                                items={allowedCharacterCategories}
                                noLabel
                            />
                    </div> */}
            </form>
        </Form>
    );
};

type EditHeaderProps =
{
    isPending: boolean;
}

function EditHeader({ isPending }: EditHeaderProps)
{
    return (
        <Card className='bg-muted'>
            <CardHeader>
                <CardTitle className='font-bold text-2xl capitalize text-center text-primary flex items-center justify-center gap-3'>
                    <div className="flex flex-row items-center gap-8 w-full">

                        <div className="flex flex-row justify-center items-center gap-6 flex-1">
                            <div className="flex flex-col justify-center items-center gap-6">
                                <InputFormField<HeaderDto> 
                                    path="name" 
                                    inputPlaceholder={displayedText.changeName} 
                                    inputClassName="w-lg"
                                />
                            </div>
                            <div className="flex flex-col justify-center items-center gap-6">
                                <InputFormField<HeaderDto> 
                                    path="shortName" 
                                    inputPlaceholder={displayedText.changeShortName} 
                                    inputClassName="w-30"
                                />
                            </div>
                            <div className="flex flex-col justify-center items-center gap-6">
                                <SelectFormField<HeaderDto>
                                    path="category"
                                    items={allowedCharacterCategories}
                                    noLabel
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end items-center">
                            <SubmitButton isPending={isPending} />
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent>
                <AreaInputFormField<HeaderDto> 
                    path="description" 
                    inputPlaceholder={displayedText.changeDescription} 
                />
            </CardContent>
        </Card>
    )
}