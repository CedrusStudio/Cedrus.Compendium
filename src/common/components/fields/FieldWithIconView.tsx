import { Field } from "@/common/components/fields/index";
import { PropsWithChildren } from "react";

type FieldViewProps = 
{
  value: number | string;
  className?: string;
  nameClassName?: string;
  valueClassName?: string;
};

/**
 * @deprecated Use the new Field compound component instead:
 * <Field value={value}>
 *   <Field.Icon>{icon}</Field.Icon>
 *   <Field.Label>Label</Field.Label>
 *   <Field.Value />
 * </Field>
 */
export default function FieldWithIconView(input: PropsWithChildren<FieldViewProps>) 
{
  return (
    <Field value={input.value} className={input.className} valueClassName={input.valueClassName}>
      <Field.Icon className={input.nameClassName}>{input.children}</Field.Icon>
      <Field.Value />
    </Field>
  );
};
