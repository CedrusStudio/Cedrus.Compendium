import { z } from 'zod';

// Existing imported character IDs also include human-readable legacy identifiers.
// Do not restrict this endpoint to ULIDs until those callers have migrated.
export const MAX_CHARACTER_IDS_PER_REQUEST = 200;

export const characterIdsSchema = z.object({
  ids: z.array(z.string().min(1).max(200).refine(id => id.trim().length > 0)).max(MAX_CHARACTER_IDS_PER_REQUEST),
}).transform(({ ids }) => ({ ids: [...new Set(ids)] }));
