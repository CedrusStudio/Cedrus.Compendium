import { Entity } from "@/domain/Entity";

type EntityPersistenceParams = {
  id: string;
  name: string;
};

export function toEntity<TEntity extends Entity>(entityPersistenceModel: EntityPersistenceParams): TEntity
{
  return {
    id: entityPersistenceModel.id,
    name: entityPersistenceModel.name,
  } as TEntity;
}