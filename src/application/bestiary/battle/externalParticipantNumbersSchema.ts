import { z } from 'zod';
import { numberInput } from '@/persistence/schemas/numericSchema';

export const externalParticipantNumbersSchema = z.object({
  maxHealth: numberInput(z.coerce.number().int().min(1, { message: 'Zdrowie musi wynosić co najmniej 1' })),
  initiativeGrade: numberInput(z.coerce.number().int().min(1, { message: 'Ranga musi wynosić co najmniej 1' })),
  initiativeValue: numberInput(z.coerce.number().int()),
});
