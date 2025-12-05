import { Field as FieldRoot } from "@/common/components/fields/Field";
import { FieldLabel } from "@/common/components/fields/FieldLabel";
import { FieldValue } from "@/common/components/fields/FieldValue";
import { FieldIcon } from "@/common/components/fields/FieldIcon";
import { FieldInfo } from "@/common/components/fields/FieldInfo";

type FieldComponent = typeof FieldRoot & 
{
  Label: typeof FieldLabel;
  Value: typeof FieldValue;
  Icon: typeof FieldIcon;
  Info: typeof FieldInfo;
}

// Compound component pattern
export const Field: FieldComponent = Object.assign(FieldRoot, 
{
  Label: FieldLabel,
  Value: FieldValue,
  Icon: FieldIcon,
  Info: FieldInfo,
});

// Export individual components for flexibility
export { FieldLabel, FieldValue, FieldIcon, FieldInfo };
