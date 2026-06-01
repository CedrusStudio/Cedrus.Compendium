import client from '@/infrastructure/clients/baseClient';
import type { PersonalizationProfile } from '@/persistence/slices/personalizationSlice';

const personalizationClient = {
  async getProfile(): Promise<PersonalizationProfile | null>
  {
    const response = await client.get<PersonalizationProfile | null>('/personalization');
    return response.data;
  },

  async saveProfile(profile: PersonalizationProfile): Promise<PersonalizationProfile>
  {
    const response = await client.put<PersonalizationProfile>('/personalization', profile);
    return response.data;
  },
};

export default personalizationClient;