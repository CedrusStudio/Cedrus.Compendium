import client from '@/infrastructure/clients/baseClient';
import { RequirementEntityType } from '@/infrastructure/clients/requirementsClient';
import type { Requirement } from '@/domain/requirements/Requirement';

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

export type RequirementStructurePayload = {
  entity: RequirementEntityType;
  requirementText: string;
  requirement: Requirement;
};

export type ManagedStructuredRequirement = {
  requirement: Requirement;
  count: number;
};

export type StructuredRequirementEditPayload = {
  entity: RequirementEntityType;
  original: Requirement;
  /**
   * One requirement, or several to SPLIT the original into independent entries.
   * The stored array is already a conjunction, so splitting is how a compound
   * text like "Ilość postaw i manewrów fizycznych 3" becomes two requirements
   * without inventing an `allOf` variant.
   */
  replacements: Requirement[];
};

export type StructuredRequirementDeletePayload = {
  entity: RequirementEntityType;
  requirement: Requirement;
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
  structureRequirement: async (payload: RequirementStructurePayload): Promise<{ updatedCount: number }> => {
    const response = await client.post<{ updatedCount: number }>('/requirements-management/structure', payload);
    return response.data;
  },
  getStructuredRequirements: async (entity: RequirementEntityType): Promise<ManagedStructuredRequirement[]> => {
    const response = await client.get<ManagedStructuredRequirement[]>(`/requirements-management/structured/${entity}`);
    return response.data;
  },
  editStructuredRequirement: async (payload: StructuredRequirementEditPayload): Promise<{ updatedCount: number }> => {
    const response = await client.post<{ updatedCount: number }>('/requirements-management/structured/edit', payload);
    return response.data;
  },
  deleteStructuredRequirement: async (payload: StructuredRequirementDeletePayload): Promise<{ updatedCount: number }> => {
    const response = await client.post<{ updatedCount: number }>('/requirements-management/structured/delete', payload);
    return response.data;
  },
};

export default requirementsManagementClient;