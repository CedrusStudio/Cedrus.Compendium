/** A full form save uses zero to explicitly remove an optional cooldown. */
export function toCastablePersistenceModel<T extends { cooldown?: number | null }>(entity: T)
{
  return { ...entity, cooldown: entity.cooldown ?? 0 };
}
