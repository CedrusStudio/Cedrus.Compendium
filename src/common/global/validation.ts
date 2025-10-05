import { ZodSafeParseError } from "zod";

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