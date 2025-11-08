import { Label } from "@radix-ui/react-label";
import AppendToArrayButton from "@/common/components/form/AppendToArrayButton";
import { UseFieldArrayReturn, FieldValues, ArrayPath, FieldArray, UseFieldArrayRemove, FieldArrayWithId } from "react-hook-form";

type EditArraySectionProps<TFieldValues extends FieldValues, TFieldName extends ArrayPath<TFieldValues>> = 
{
  title: string;
  fieldArray: UseFieldArrayReturn<TFieldValues, TFieldName>;
  createDefault: FieldArray<TFieldValues, TFieldName> | (() => FieldArray<TFieldValues, TFieldName>);
  isPending: boolean;
  renderItem: (item: FieldArrayWithId<TFieldValues, TFieldName>, index: number, remove: UseFieldArrayRemove) => React.ReactNode;
  gridCols?: 1 | 2 | 3;
};

const gridColsClass = 
{
  1: "grid gap-3",
  2: "grid gap-3 lg:grid-cols-2",
  3: "grid gap-3 lg:grid-cols-3"
} as const;

export default function EditArraySection<TFieldValues extends FieldValues, TFieldName extends ArrayPath<TFieldValues>>
(
    {
        title,
        fieldArray,
        createDefault,
        isPending,
        renderItem,
        gridCols = 2
    }
        : EditArraySectionProps<TFieldValues, TFieldName>
) 
{
  const { fields, append, remove } = fieldArray;

  return (
    <div className="space-y-3 flex flex-col justify-center">
      <div className="flex justify-center items-center gap-3">
        <Label className="font-bold text-2xl text-primary text-center capitalize">{title}</Label>
        <AppendToArrayButton<TFieldValues, TFieldName>
          isPending={isPending}
          toAdd={createDefault}
          append={append}
        />
      </div>

      <div className={gridColsClass[gridCols]}>
        {fields.map((item, index) => renderItem(item, index, remove))}
      </div>
    </div>
  );
}