import { z } from "zod";

export const upsertCharacterHeaderSchema = z.object
({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    description: z.string()
        .min(2, { message: "Description must be at least 2 characters." })
        .max(600, { message: "Description must not be longer than 600 characters." }),
});

export type UpsertCharacterHeaderType = z.infer<typeof upsertCharacterHeaderSchema>;