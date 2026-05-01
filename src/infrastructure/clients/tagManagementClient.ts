import client from '@/infrastructure/clients/baseClient';
import { EntityType } from '@/infrastructure/clients/tagsClient';

export type ManagedTag = {
  tag: string;
  count: number;
};

export type TagRenamePayload = {
  entity: EntityType;
  oldTag: string;
  newTag: string;
};

export type TagDeletePayload = {
  entity: EntityType;
  tag: string;
};

const tagManagementClient = {
  getTags: async (entity: EntityType): Promise<ManagedTag[]> => {
    const response = await client.get<ManagedTag[]>(`/tag-management/${entity}`);
    return response.data;
  },
  renameTag: async (payload: TagRenamePayload): Promise<{ updatedCount: number }> => {
    const response = await client.post<{ updatedCount: number }>('/tag-management/rename', payload);
    return response.data;
  },
  deleteTag: async (payload: TagDeletePayload): Promise<{ updatedCount: number }> => {
    const response = await client.post<{ updatedCount: number }>('/tag-management/delete', payload);
    return response.data;
  },
};

export default tagManagementClient;