import client from '@/infrastructure/clients/baseClient';
import { RequirementEntityType } from '@/infrastructure/clients/requirementsClient';

export type ManagedRequirement = {
  requirement: string;
  count: number;
};

export type RequirementRenamePayload = {
  entity: RequirementEntityType;
  oldRequirement: string;
  newRequirement: string;
};

export type RequirementDeletePayload = {
  entity: RequirementEntityType;
  requirement: string;
};

const requirementsManagementClient = {
  getRequirements: async (entity: RequirementEntityType): Promise<ManagedRequirement[]> => {
    const response = await client.get<ManagedRequirement[]>(`/requirements-management/${entity}`);
    return response.data;
  },
  renameRequirement: async (payload: RequirementRenamePayload): Promise<{ updatedCount: number }> => {
    const response = await client.post<{ updatedCount: number }>('/requirements-management/rename', payload);
    return response.data;
  },
  deleteRequirement: async (payload: RequirementDeletePayload): Promise<{ updatedCount: number }> => {
    const response = await client.post<{ updatedCount: number }>('/requirements-management/delete', payload);
    return response.data;
  },
};

export default requirementsManagementClient;