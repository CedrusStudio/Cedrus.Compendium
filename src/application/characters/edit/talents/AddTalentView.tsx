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
import { Button } from "@/ui/button";
import { UseFieldArrayAppend } from "react-hook-form";
import { talentSchema, type TalentsDto } from "@/persistence/schemas/characters/talentSchema";
import { useState } from "react";
import LabeledFormInput from "@/common/components/inputs/LabeledFormInput";
import { getErrors } from "@/common/global/validation";
import LabeledFormSelectInput from "@/common/components/inputs/LabeledFormSelectInput";
import { ulid } from "ulid";
import { addIcon } from "@/common/icons";
import { TalentPenalty, allowedTalentPenalties, allowedTalentCategories, defaultTalent, allowedTalentCharacteristics } from "@/domain/characters/Talent";
import { displayedText } from "@/common/translations";

type AddTalentViewProps =
{
  append: UseFieldArrayAppend<TalentsDto, "talents">;
  setNameFilter: (value: string) => void;
}

export default function AddTalentView({ append, setNameFilter }: AddTalentViewProps)
{
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [newTalentName, setNewTalentName] = useState<string>("");
  const [newTalentGrade, setNewTalentGrade] = useState<string | number>(defaultTalent.grade);
  const [newTalentBonus, setNewTalentBonus] = useState<string | number>(0);
  const [newTalentPenalty, setNewTalentPenalty] = useState<TalentPenalty>("0");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<string>("");

  const addNewTalent = () =>
  {
    const newTalent = 
    {
      id: ulid(),
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

    append(result.data);
    setNameFilter(newTalent.name);
    
    setNewTalentName("");
    setNewTalentGrade(defaultTalent.grade);
    setNewTalentBonus(0);
    setNewTalentPenalty("0");
    setSelectedCategory("");
    setSelectedCharacteristics("");
    setErrors({});
    setOpen(false);
  };

  const resetAddTalentForm = () =>
  {
    setNewTalentName("");
    setNewTalentGrade(defaultTalent.grade);
    setNewTalentBonus(0);
    setNewTalentPenalty("0");
    setSelectedCategory("");
    setSelectedCharacteristics("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>

      <SheetTrigger asChild>
        <Button variant="outline">{addIcon("h-[1.2rem] w-[1.2rem]")}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className="first-letter:uppercase">{displayedText.addNewTalent}</SheetTitle>
          <SheetDescription>{displayedText.clickSave}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1">

          <div className="flex flex-col gap-6 px-4">

            <div className="flex grid-cols justify-center gap-4">

              <LabeledFormInput 
                name="name" 
                label={displayedText.name}
                value={newTalentName} 
                placeholder={displayedText.name}
                onChange={(e) => setNewTalentName(e.target.value)} 
                errors={errors} 
              />

              <LabeledFormInput 
                name="grade"
                label={displayedText.grade}
                value={newTalentGrade}
                type="number"
                onChange={(e) => setNewTalentGrade(e.target.value)}
                errors={errors} 
              />

            </div>

            <LabeledFormSelectInput
              name="category"
              label={displayedText.category}
              collectionToSelectFrom={allowedTalentCategories}
              value={selectedCategory}
              placeholder={displayedText.selectCategory}
              onChange={setSelectedCategory}
              errors={errors}
            />

            <LabeledFormSelectInput
              name="characteristics"
              label={displayedText.characteristics}
              collectionToSelectFrom={allowedTalentCharacteristics}
              value={selectedCharacteristics}
              placeholder={displayedText.selectCharacteristic}
              onChange={setSelectedCharacteristics}
              errors={errors}
            />

            <div className="grid grid-cols-2 gap-3">

              <LabeledFormInput 
                name="bonus" 
                label={displayedText.bonus}
                value={newTalentBonus} 
                type="number"
                onChange={(e) => setNewTalentBonus(e.target.value)}
                errors={errors} 
              />

              <LabeledFormSelectInput
                name="penalty"
                label={displayedText.penalty}
                collectionToSelectFrom={allowedTalentPenalties}
                value={newTalentPenalty}
                onChange={setNewTalentPenalty}
                errors={errors}
                isValueCapitalized={false}
              />

            </div>

          </div>

          <SheetFooter>
            <Button type="button" className="flex justify-center flex-1" onClick={addNewTalent}><span className="first-letter:uppercase">{displayedText.addTalent}</span></Button>
            <Button type="button" variant="secondary" className="flex-1 capitalize" onClick={resetAddTalentForm}>{displayedText.clear}</Button>

            <SheetClose asChild>
              <Button type="button" variant="outline" className="flex-1 capitalize">{displayedText.cancel}</Button>
            </SheetClose>
          </SheetFooter>

        </div>
      </SheetContent>
    </Sheet>
  )
}
