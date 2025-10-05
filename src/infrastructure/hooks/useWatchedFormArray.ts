"use client";

import { ArrayPath, Control, FieldArray, FieldValues, Path } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";

export default function useWatchedFormArray<TFieldValues extends FieldValues, TName extends ArrayPath<TFieldValues>>
(
    name: TName, 
    control: Control<TFieldValues>
)
{
    const { append, remove } = useFieldArray<TFieldValues, TName>
    ({
        name,
        control
    });

    const watchedArray = useWatch<TFieldValues>
    ({
        control, 
        name: name as Path<TFieldValues>
    }) as FieldArray<TFieldValues, TName>[];

    return { watchedArray, append, remove };
}