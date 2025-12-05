import { Field } from "@/common/components/fields/index";
import { PropsWithChildren } from "react";

type FieldViewProps = 
{
  value: number | string;
  className?: string;
  childrenClassName?: string;
  valueClassName?: string;
};

/**
 * @deprecated Use the new Field compound component instead:
 * <Field value={value}>
 *   <Field.Label>Label</Field.Label>
 *   <Field.Value />
 * </Field>
 */
export default function FieldView(input: PropsWithChildren<FieldViewProps>) 
{
  return (
    <Field value={input.value} className={input.className} valueClassName={input.valueClassName}>
      <Field.Label className={input.childrenClassName}>{input.children}</Field.Label>
      <Field.Value />
    </Field>
  );
};
