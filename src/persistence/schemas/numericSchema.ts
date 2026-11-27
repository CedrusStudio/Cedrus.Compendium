import { requiredNumericInput } from "@cedrus/react-forms/zod";
import type { z } from "zod";

export const REQUIRED_NUMBER_MESSAGE = "Uzupełnij pole";

/** Reject missing numeric input before coercion can turn it into zero. */
export function numberInput<T extends z.ZodType>(schema: T)
{
  return requiredNumericInput(schema, REQUIRED_NUMBER_MESSAGE);
}
