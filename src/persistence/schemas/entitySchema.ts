import { z } from "zod";

export const idSchema = z.object
({
  id: z.ulid()
});

export const entitySchema = idSchema.extend
({
  name: z.string().min(2, { message: "Nazwa musi mieć co najmniej 2 znaki." }).max(100, { message: "Nazwa nie może być dłuższa niż 100 znaków." }),
});