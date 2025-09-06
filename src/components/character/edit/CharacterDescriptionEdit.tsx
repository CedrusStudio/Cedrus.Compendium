"use client";

import { Character } from "@/domain/Character";
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldPath, FieldValues, useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner"
import { Control } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { upsertCharacterHeader } from "@/persistence/characterRepository";
import { upsertCharacterHeaderSchema, UpsertCharacterHeaderType } from "@/persistence/characterSchemas";

const initialValues: UpsertCharacterHeaderType =
{
    name: "",
    description: "",
};

export default function CharacterDescriptionEdit(input: { character: Character })
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
                    name="name" 
                    control={form.control} 
                    inputPlaceholder="edit name..." 
                />
    
                <p className='text-md text-center text-primary pt-2 capitalize'>
                    {input.character.description}
                </p>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Textarea placeholder="edit description..." className="resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit"  disabled={isPending}>
                    { isPending ? "Submitting..." : "Submit" }
                </Button>
            </form>

        </Form>
    );
};

type CustomFormFieldProps<TFieldValues extends FieldValues> = 
{
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  inputPlaceholder?: string;
};

function InputFormField<TFieldValues extends FieldValues>(input: CustomFormFieldProps<TFieldValues>) 
{
  return (
    <FormField
      control={input.control}
      name={input.name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input placeholder={input.inputPlaceholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}