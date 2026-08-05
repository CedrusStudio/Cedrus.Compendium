"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type HeaderDto, headerSchema } from "@/persistence/schemas/characters/headerSchema";
import { InputFormField } from "@/common/components/form/InputFormField";
import SubmitButton from "@/common/components/form/SubmitButton";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import { displayedText } from "@/common/translations";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { Button } from '@/ui/button';
import SelectBaseCharacterDialog from '@/application/characters/add/SelectBaseCharacterDialog';
import { Separator } from '@/ui/separator';
import { useCharacterCreationMode } from '@/application/characters/add/useCharacterCreationMode';
import { useBaseCharacter } from '@/application/characters/add/useBaseCharacter';
import { useCreateCharacterFromScratch } from '@/application/characters/add/useCreateCharacterFromScratch';
import { useCreateCharacterFromCopy } from '@/application/characters/add/useCreateCharacterFromCopy';
import { CharacterCreationInitialState, CharacterCreationMode } from '@/application/characters/add/characterCopyRoute';
import AiCharacterGenerationView from '@/application/characters/ai/AiCharacterGenerationView';

const initialHeaderValues: HeaderDto = 
{
    name: "",
    shortName: "",
    tags: [],
    description: "",
};

export type AddCharacterViewProps = CharacterCreationInitialState & {
    aiProvider?: 'openai' | 'ollama' | 'local';
};

export default function AddCharacterView({ initialMode, initialSelectedCharacterId, aiProvider }: AddCharacterViewProps)
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
        switchToAi,
        selectBaseCharacter, 
        resetMode 
    } = useCharacterCreationMode({ initialMode, initialSelectedCharacterId });

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
        <div className="space-y-8">
            <ModeSelector
                mode={mode}
                onScratchClick={switchToScratch}
                onCopyClick={switchToCopy}
                onAiClick={switchToAi}
            />

            {mode === 'ai' ? <AiCharacterGenerationView provider={aiProvider} /> : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 mx-4">

                {
                    mode === 'copy' && (
                        <CopyModeSection
                            selectedCharacterName={baseCharacter?.name}
                            selectedCharacterShortName={baseCharacter?.shortName}
                            selectedCharacterTags={baseCharacter?.tags}
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
                    (mode === "scratch" || baseCharacter) && <SubmitButton isPending={isSubmitDisabled} />
                }
                </form>
              </Form>
            )}
        </div>
    );
}

type ModeSelectorProps = 
{
    mode: CharacterCreationMode;
    onScratchClick: () => void;
    onCopyClick: () => void;
    onAiClick: () => void;
};

function ModeSelector({ mode, onScratchClick, onCopyClick, onAiClick }: ModeSelectorProps)
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
                className="rounded-none"
            >
                <span className="first-letter:capitalize">{displayedText.create_from_template}</span>
            </Button>

            <Button
                type="button"
                variant={mode === 'ai' ? 'default' : 'outline'}
                onClick={onAiClick}
                className="rounded-l-none"
            >
                Generuj z AI
            </Button>
        </div>
    );
}

type CopyModeSectionProps = 
{
    selectedCharacterName?: string;
    selectedCharacterShortName?: string;
    selectedCharacterTags?: string[];
    selectedCharacterId: string | undefined;
    onSelectCharacter: (id: string) => void;
};

function CopyModeSection({ 
    selectedCharacterName,
    selectedCharacterShortName,
    selectedCharacterTags,
    selectedCharacterId,
    onSelectCharacter,
}: CopyModeSectionProps) 
{
    return (
        <>
            <SelectBaseCharacterDialog
                onSelectCharacter={onSelectCharacter}
                selectedCharacterName={selectedCharacterName}
                selectedCharacterShortName={selectedCharacterShortName}
                selectedCharacterTags={selectedCharacterTags}
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

            <FormTagsInput<HeaderDto> path="tags" beAbleToSetCharacterAndSessionTags={true} entityType="characters" />

            <AreaInputFormField<HeaderDto> 
                path="description" 
                inputPlaceholder={displayedText.description} 
            />
        </>
    );
}
