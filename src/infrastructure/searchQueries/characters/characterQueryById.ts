import { SearchByIdEntityPayload } from "@/common/global/SearchPayloads";
import { includeAllRelations } from "@/infrastructure/searchQueries/characters/allCharacterRelations";

export const characterQueryById: SearchByIdEntityPayload = 
{
    entity: 'character',
    include: includeAllRelations
};
