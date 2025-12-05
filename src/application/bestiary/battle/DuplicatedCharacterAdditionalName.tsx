import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { showHideIcon } from "@/common/icons";
import { useState } from "react";

type DuplicatedCharacterAdditionalNameProps =
{
  duplicateNumber: number;
};

export default function DuplicatedCharacterAdditionalName({ duplicateNumber }: DuplicatedCharacterAdditionalNameProps)
{
  const [additionalName, setAdditionalName] = useState(`Imię ${duplicateNumber == 1 ? "" : duplicateNumber}`);
  const [hideInput, setHideInput] = useState(duplicateNumber === 1);

  const toggleInput = () =>
  {
    setHideInput(prev => !prev);
  }

  return (
    <>
    { 
      hideInput ? null
        : <Input 
            id="health" 
            type="text" 
            value={additionalName} 
            onChange={e => setAdditionalName(e.target.value)} 
        /> 
    }

    <Button variant="ghost" size="icon" onClick={toggleInput}>{showHideIcon(hideInput)}</Button>
    </>
  );
};