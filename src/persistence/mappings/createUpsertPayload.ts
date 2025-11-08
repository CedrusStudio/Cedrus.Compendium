export type RelationPayload<T> = 
{
  create: T[];
  update: { where: { id: string }; data: Omit<T, 'id'> }[];
  disconnect: { id: string }[];
  connect: { id: string }[];
};

export function createUpsertPayload<T extends { id: string }>
(
  existingIds: string[],
  incoming: T[],
  idsToConnect: string[] = []
)
  : RelationPayload<T> 
{
  const update = incoming
    .filter(i => existingIds.includes(i.id))
    .filter(i => !idsToConnect.includes(i.id))
    .map(i => ({ where: { id: i.id }, data: { ...i, id: undefined } }))

  const create = incoming
    .filter(i => !existingIds.includes(i.id))
    .filter(i => !idsToConnect.includes(i.id));

  const disconnect = existingIds
    .filter(id => !incoming.some(i => i.id === id))
    .map(id => ({ id }));

  return {
    create,
    update,
    disconnect,
    connect: idsToConnect.map(id => ({ id }))
  };
}