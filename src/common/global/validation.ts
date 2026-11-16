import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";
import type { ZodType, ZodSafeParseError } from "zod";

/**
 * Type-safe wrapper for zodResolver.
 * In Zod v4, z.coerce and .default() produce input types that differ from output types,
 * causing a type mismatch with useForm<OutputDto>. The schema parameter accepts
 * ZodType<T> with its unknown input to bridge the Zod v4 / react-hook-form type
 * mismatch. Callers retain the output DTO as their form type; raw form inputs
 * still pass through Zod's coercion, defaults and validation at runtime.
 */
export function typedZodResolver<T extends FieldValues>(schema: ZodType<T>): Resolver<T>
{
  return zodResolver(schema as ZodType<T, FieldValues>) as unknown as Resolver<T>;
}

export function getErrors<T>(result: ZodSafeParseError<T>): Partial<Record<keyof T, string>>
{
    const fieldErrors: Partial<Record<keyof T, string>> = {};

    result.error.issues.forEach((err) => 
    {
        const path = err.path.join('.');
        fieldErrors[path as keyof T] = err.message;
    });
    
    return fieldErrors;
}
