import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/ui/sheet";
import { Button } from "@/ui/button"
import { LuPlus } from "react-icons/lu";
import { characteristicsOptions, talentCategories } from "@/domain/data/categories";
import { UseFieldArrayAppend } from "react-hook-form";
import { talentSchema, UpsertCharacterTalentsType } from "@/persistence/characterSchemas";
import { useState } from "react";
import { toast } from "sonner";
import LabeledFormInput from "@/common/components/inputs/LabeledFormInput";
import { translate } from "@/domain/data/translations";
import { getErrors } from "@/common/global/validation";
import LabeledFormSelectInput from "@/common/components/inputs/LabeledFormSelectInput";

type AddTalentViewProps =
{
  append: UseFieldArrayAppend<UpsertCharacterTalentsType, "talents">;
  setNameFilter: (value: string) => void;
}

export default function AddTalentView({ append, setNameFilter }: AddTalentViewProps)
{
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [newTalentName, setNewTalentName] = useState<string>("");
  const [newTalentGrade, setNewTalentGrade] = useState<number>(0);
  const [newTalentBonus, setNewTalentBonus] = useState<number>(0);
  const [newTalentPenalty, setNewTalentPenalty] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<string>("");

  const addNewTalent = () =>
  {
    const newTalent = 
    {
      id: newTalentName.toLowerCase().replace(/\s+/g, '-') + newTalentGrade,
      name: newTalentName,
      grade: newTalentGrade,
      category: selectedCategory,
      characteristics: selectedCharacteristics,
      bonus: newTalentBonus,
      penalty: newTalentPenalty,
    };

    const result = talentSchema.safeParse(newTalent);

    if (!result.success) 
    {
      const fieldErrors = getErrors(result);
      setErrors(fieldErrors);
      return;
    }

    append(newTalent);
    setNameFilter(newTalent.name);
    
    setNewTalentName("");
    setNewTalentGrade(0);
    setNewTalentBonus(0);
    setNewTalentPenalty(0);
    setSelectedCategory("");
    setSelectedCharacteristics("");

    setErrors({});
    setOpen(false);
    toast("Success", {
        description: (
            <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
                <code className="text-white">Character updated successfully</code>
            </pre>
        ),
        position: "top-right"
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>

      <SheetTrigger asChild>
        <Button variant="outline"><LuPlus className="h-[1.2rem] w-[1.2rem]" /></Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle>Dodaj nową umiejętność</SheetTitle>
          <SheetDescription>
            Kliknij zapisz, gdy skończysz.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col">

            <div className="flex flex-col gap-6">

                <div className="flex grid-cols justify-center gap-4">

                    <LabeledFormInput 
                        name="name" 
                        label={translate("name")}
                        value={newTalentName} 
                        placeholder="Nazwa umiejętności"
                        onChange={(e) => setNewTalentName(e.target.value)} 
                        errors={errors} 
                    />

                    <LabeledFormInput 
                        name="grade" 
                        label={translate("grade")}
                        value={newTalentGrade} 
                        onChange={(e) => setNewTalentGrade(Number(e.target.value))}
                        errors={errors} 
                    />

                </div>

                <LabeledFormSelectInput
                    name="category"
                    label={translate("category")}
                    collectionToSelectFrom={talentCategories}
                    value={selectedCategory}
                    placeholder="Wybierz kategorię"
                    onChange={setSelectedCategory}
                    errors={errors}
                />

                <LabeledFormSelectInput
                    name="characteristics"
                    label={translate("characteristics")}
                    collectionToSelectFrom={characteristicsOptions}
                    value={selectedCharacteristics}
                    placeholder="Wybierz cechę"
                    onChange={setSelectedCharacteristics}
                    errors={errors}
                />

                <div className="grid grid-cols-2 gap-3">

                    <LabeledFormInput 
                        name="bonus" 
                        label={translate("bonus")}
                        value={newTalentBonus} 
                        onChange={(e) => setNewTalentBonus(Number(e.target.value))}
                        errors={errors} 
                    />

                    <LabeledFormInput 
                        name="penalty" 
                        label={translate("penalty")}
                        value={newTalentPenalty} 
                        onChange={(e) => setNewTalentPenalty(Number(e.target.value))}
                        errors={errors} 
                    />

                </div>

            </div>

            <SheetFooter>
                <div className="flex justify-center">
                    <Button type="button" className="flex-1" onClick={addNewTalent} >
                    Dodaj umiejętność
                    </Button>
                </div>

                <SheetClose asChild>
                    <Button type="button" variant="outline" className="flex-1">Anuluj</Button>
                </SheetClose>
            </SheetFooter>

        </div>
      </SheetContent>
    </Sheet>
  )
}