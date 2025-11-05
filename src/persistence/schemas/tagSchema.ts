import { z } from "zod";
import { isValidTag } from "@/domain/Tag";

const tagSchema = z.string().refine((val) => isValidTag(val), { message: "Nieprawidłowa kategoria." });
export const tagsSchema = z.array(tagSchema);
