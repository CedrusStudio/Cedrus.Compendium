"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Textarea } from "@/ui/textarea";
import { useMutation } from '@tanstack/react-query';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { addCharacter } from "@/persistence/characterRepository";
import { AddCharacterHeaderType, addCharacterHeaderSchema } from "@/persistence/characterSchemas";
import { InputFormField } from "@/common/components/form/InputFormField";
import SubmitButton from "@/common/components/form/SubmitButton";

const initialValues: AddCharacterHeaderType =
{
    name: "",
    description: "",
};

export default function AddCharacterView()
{
    const form = useForm<AddCharacterHeaderType>
    ({
        resolver: zodResolver(addCharacterHeaderSchema),
        defaultValues: initialValues,
    })
    
    const router = useRouter();
    
    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (characterHeader: AddCharacterHeaderType) => await addCharacter(characterHeader),
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

    function onSubmit(values: AddCharacterHeaderType) 
    {
        mutate(values);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <p className='text-xl text-center text-primary pt-8 font-semibold '>
                    Stwórz nową postać podając nazwę i opis
                </p>

                <InputFormField<AddCharacterHeaderType> 
                    path="name" 
                    inputPlaceholder="nazwa..." 
                    inputClassName="w-xl"
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Textarea placeholder="opis..." className="resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <SubmitButton isPending={isPending} />
            </form>
        </Form>
    );
};