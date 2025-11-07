"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type HeaderDto, headerSchema } from "@/persistence/schemas/characters/headerSchema";
import { InputFormField } from "@/common/components/form/InputFormField";
import SubmitButton from "@/common/components/form/SubmitButton";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import { displayedText } from "@/presentation/translations";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { Button } from '@/ui/button';
import SelectBaseCharacterDialog from '@/application/characters/add/SelectBaseCharacterDialog';
import { Separator } from '@/ui/separator';
import { CharacterCreationMode, useCharacterCreationMode } from '@/application/characters/add/useCharacterCreationMode';
import { useBaseCharacter } from '@/application/characters/add/useBaseCharacter';
import { useCreateCharacterFromScratch } from '@/application/characters/add/useCreateCharacterFromScratch';
import { useCreateCharacterFromCopy } from '@/application/characters/add/useCreateCharacterFromCopy';

const initialHeaderValues: HeaderDto = 
{
    name: "",
    shortName: "",
    tags: [],
    description: "",
};

export default function AddCharacterView()
{
    const form = useForm<HeaderDto>
    ({
        resolver: zodResolver(headerSchema),
        defaultValues: initialHeaderValues,
    });

    const { 
        mode, 
        selectedCharacterId, 
        switchToScratch, 
        switchToCopy, 
        selectBaseCharacter, 
        resetMode 
    } = useCharacterCreationMode();

    const { baseCharacter } = useBaseCharacter
    ({ 
        characterId: selectedCharacterId, 
        enabled: mode === 'copy' 
    });

    const { createFromScratch, isPending: isPendingFromScratch } = useCreateCharacterFromScratch
    ({
        onSuccessCallback: () => form.reset(initialHeaderValues)
    });

    const { createFromCopy, isPending: isPendingFromCopy } = useCreateCharacterFromCopy
    ({
        onSuccessCallback: () => 
        {
            form.reset(initialHeaderValues);
            resetMode();
        }
    });

    const handleSubmit = (values: HeaderDto) => 
    {
        if (mode === 'scratch') 
        {
            createFromScratch(values);
            return;
        }

        if (mode === 'copy' && baseCharacter) 
        {
            createFromCopy({ header: values, baseCharacter });
            return;
        }

        throw new Error("Invalid character creation mode or missing base character.");
    };

    const isPending = isPendingFromScratch || isPendingFromCopy;
    const isSubmitDisabled = isPending || (mode === 'copy' && !selectedCharacterId);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 mx-4">

                <ModeSelector 
                    mode={mode}
                    onScratchClick={switchToScratch}
                    onCopyClick={switchToCopy}
                />

                {
                    mode === 'copy' && (
                        <CopyModeSection
                            selectedCharacterId={selectedCharacterId}
                            onSelectCharacter={selectBaseCharacter}
                        />
                    )
                }
                                
                <p className='text-xl text-center text-primary font-semibold'>
                    {displayedText.create_new_character} 
                </p>

                <CharacterHeaderFields />
                {
                    mode === "scratch" || baseCharacter && <SubmitButton isPending={isSubmitDisabled} />
                }
            </form>
        </Form>
    );
}

type ModeSelectorProps = 
{
    mode: CharacterCreationMode;
    onScratchClick: () => void;
    onCopyClick: () => void;
};

function ModeSelector({ mode, onScratchClick, onCopyClick }: ModeSelectorProps) 
{
    return (
        <div className="flex justify-center pt-8">
            <Button
                type="button"
                variant={mode === 'scratch' ? 'default' : 'outline'}
                onClick={onScratchClick}
                className="rounded-r-none"
            >
                <span className="first-letter:capitalize">{displayedText.create_new_character}</span>
            </Button>
            <Button
                type="button"
                variant={mode === 'copy' ? 'default' : 'outline'}
                onClick={onCopyClick}
                className="rounded-l-none"
            >
                <span className="first-letter:capitalize">{displayedText.create_from_template}</span>
            </Button>
        </div>
    );
}

type CopyModeSectionProps = 
{
    selectedCharacterId: string | undefined;
    onSelectCharacter: (id: string) => void;
};

function CopyModeSection({ selectedCharacterId, onSelectCharacter }: CopyModeSectionProps) 
{
    return (
        <>
            <SelectBaseCharacterDialog
                onSelectCharacter={onSelectCharacter}
                selectedCharacterId={selectedCharacterId}
            />
            <Separator />
        </>
    );
}

function CharacterHeaderFields() 
{
    return (
        <>
            <InputFormField<HeaderDto> 
                path="name" 
                inputPlaceholder={displayedText.name} 
                inputClassName="lg:w-xl"
            />

            <InputFormField<HeaderDto> 
                path="shortName" 
                inputPlaceholder={displayedText.short_name} 
                inputClassName="lg:w-xl"
            />

            <FormTagsInput<HeaderDto> path="tags" />

            <AreaInputFormField<HeaderDto> 
                path="description" 
                inputPlaceholder={displayedText.description} 
            />
        </>
    );
}
