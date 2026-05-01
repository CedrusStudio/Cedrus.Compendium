import client from '@/infrastructure/clients/baseClient';

export type AdminCapabilities = {
  isAdmin: boolean;
};

const adminClient = {
  getCapabilities: async (): Promise<AdminCapabilities> => {
    const response = await client.get<AdminCapabilities>('/admin/capabilities');
    return response.data;
  },
};

export default adminClient;