'use server';

import 'server-only';

type PrismaDelegate<TEntity> = 
{
  findUnique: (args: { where: { id: string } }) => Promise<TEntity | null>;
  delete: (args: { where: { id: string } }) => Promise<TEntity>;
  create: (args: { data: TEntity }) => Promise<TEntity>;
  update: (args: { where: { id: string }; data: Omit<TEntity, 'id'> }) => Promise<TEntity>;
};

export type Repository<TEntity extends { id: string }> = 
{
  getById: (id: string) => Promise<TEntity | null>;
  delete: (id: string) => Promise<void>;
  add: (entity: TEntity) => Promise<string>;
  update: (entity: TEntity) => Promise<boolean>;
};

export async function createCommonRepository<TEntity extends { id: string }>(model: PrismaDelegate<TEntity>) 
  : Promise<Repository<TEntity>> 
{
  return {

    getById: async (id: string): Promise<TEntity | null> => 
    {
      return await model.findUnique({ where: { id } });
    },

    delete: async (id: string): Promise<void> => 
    {
      await model.delete({ where: { id } });
    },

    add: async (entity: TEntity): Promise<string> => 
    {
      const added = await model.create({ data: entity });
      return added.id;
    },

    update: async (entity: TEntity): Promise<boolean> => 
    {
      const { id, ...entityWithoutId } = entity;

      const updated = await model.update
      ({ 
        where: { id }, 
        data: entityWithoutId
      });

      return !!updated;
    }
  };
}
