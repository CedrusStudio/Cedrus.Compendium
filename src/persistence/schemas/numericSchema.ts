import { z } from "zod";

export const REQUIRED_NUMBER_MESSAGE = "Uzupełnij pole";

/** Reject missing numeric input before coercion can turn it into zero. */
export function numberInput<T extends z.ZodType>(schema: T)
{
  return z.preprocess((value, context) => {
    if (value == null || (typeof value === "string" && value.trim() === "") ||
      (typeof value === "number" && Number.isNaN(value)))
    {
      context.addIssue({ code: "custom", message: REQUIRED_NUMBER_MESSAGE });
      return z.NEVER;
    }
    return value;
  }, schema);
}
