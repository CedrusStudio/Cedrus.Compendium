"use client";

import { Character } from "@/domain/Character";
// import { characterRepository } from '@/persistence/characterRepository';
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

const formSchema = z.object(
{
    description: z.string().min(2, { message: "Description must be at least 2 characters." }),
})

export default function CharacterHeaderEdit(input: { character: Character })
{
    const form = useForm<z.infer<typeof formSchema>>
    ({
        resolver: zodResolver(formSchema),
        defaultValues: 
        {
            description: "",
        },
    })
    
    function onSubmit(values: z.infer<typeof formSchema>) 
    {
        console.log(values);
        // characterRepository.upsert({ ...input.character, description: values.description }); //it should be a call to server
    }

    return (
        <div className="flex flex-col justify-around">
        
            <h1 className='text-xl text-center font-semibold text-primary pt-2 pb-8 capitalize'>
                {input.character.name}
            </h1>
        
            <span className='text-md text-center text-primary pb-12 capitalize'>
                {input.character.description}
            </span>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input placeholder="shadcn" {...field} />
                            </FormControl>
                            <FormDescription>
                                This is your public display name.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Submit</Button>
                </form>
            </Form>
        </div>
    );
};
