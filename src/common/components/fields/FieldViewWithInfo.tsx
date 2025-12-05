import { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import { Field } from "@/common/components/fields/index";

type FieldViewWithInfoProps = 
{
  value: number;
  infoContent: React.ReactNode;
  className?: string;
  nameClassName?: string;
  valueClassName?: string;
  infoTriggerClassName?: string;
};

/**
 * @deprecated Use the new Field compound component instead:
 * ```tsx
 * <Field value={value} className={className} valueClassName={valueClassName}>
 *   <Field.Label className={nameClassName}>Label</Field.Label>
 *   <Field.Value />
 *   <Field.Info infoContent={infoContent} infoTriggerClassName={infoTriggerClassName} />
 * </Field>
 * ```
 */
export default function FieldViewWithInfo(input: PropsWithChildren<FieldViewWithInfoProps>) 
{
  return (
    <Field value={input.value} className={input.className} valueClassName={input.valueClassName}>
      <Field.Label className={cn("capitalize", input.nameClassName)}>
        {input.children}
      </Field.Label>
      <Field.Value />
      <Field.Info className={input.infoTriggerClassName}>
        {input.infoContent}
      </Field.Info>
    </Field>
  );
};
