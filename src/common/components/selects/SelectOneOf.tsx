import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/ui/hover-card";
import { BsInfoCircle } from "react-icons/bs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Dispatch, SetStateAction } from "react";

type SelectOneOfProps<T> = 
{
  name: string;
  defaultValue: string;
  items: T[];
  index: number;
  setIndex: Dispatch<SetStateAction<number>>;
  disableInfo?: boolean;
};

export default function SelectOneOf<T extends { name: string; description?: string }>({ name, defaultValue, items, index, setIndex, disableInfo }: SelectOneOfProps<T>)
{
  const handleOnSelectedChange = (value: string) => 
  {
    setIndex(parseInt(value));
  };

  return (
    <Select name={name} defaultValue={defaultValue} value={`${index}`} onValueChange={handleOnSelectedChange} >

      <div className={"capitalize"}>
        <SelectTrigger className='capitalize border-0'>
          <SelectValue>{items[index].name} </SelectValue>
        </SelectTrigger>
      </div>

      {
        disableInfo ? <></> : (
          <HoverCard openDelay={350} closeDelay={100}>
            <HoverCardTrigger>{<BsInfoCircle />}</HoverCardTrigger>
            <HoverCardContent>
                <span className={"text-sm"}>{items[index].description}</span>
            </HoverCardContent>
          </HoverCard>
        )
      }

      <SelectContent>
      {
        items.map((item, index) => (
          <SelectItem key={index} value={`${index}`}>
            <span className='capitalize'>{item.name}</span>
          </SelectItem>
        ))
      }
      </SelectContent>

    </Select>
  );
};