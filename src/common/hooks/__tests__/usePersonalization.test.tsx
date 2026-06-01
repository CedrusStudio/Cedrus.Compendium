import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useApiKeyMock, getProfileMock, saveProfileMock } = vi.hoisted(() => ({
  useApiKeyMock: vi.fn(),
  getProfileMock: vi.fn(),
  saveProfileMock: vi.fn(),
}));

vi.mock('@/common/hooks/useApiKey', () => ({
  useApiKey: () => useApiKeyMock(),
  getStoredApiKey: () => 'alpha',
}));

vi.mock('@/infrastructure/clients/personalizationClient', () => ({
  default: {
    getProfile: getProfileMock,
    saveProfile: saveProfileMock,
  },
}));

import { usePersonalization } from '@/common/hooks/usePersonalization';
import { createEmptyProfile, reducer, type PersonalizationProfile, type PersonalizationSliceState } from '@/persistence/slices/personalizationSlice';

function createWrapper(preloadedState?: PersonalizationSliceState)
{
  const store = configureStore({
    reducer: {
      personalization: reducer,
    },
    preloadedState: preloadedState ? { personalization: preloadedState } : undefined,
  });

  return function Wrapper({ children }: PropsWithChildren)
  {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('usePersonalization', () => {
  beforeEach(() => {
    useApiKeyMock.mockReset();
    getProfileMock.mockReset();
    saveProfileMock.mockReset();

    useApiKeyMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
    });
  });

  it('hydrates the profile from the server without immediately saving it again', async () => {
    const remoteProfile: PersonalizationProfile = {
      ...createEmptyProfile(),
      userName: 'Remote Marek',
      favoriteCharacterIds: ['character-1'],
      mainCharacterId: 'character-1',
    };

    getProfileMock.mockResolvedValue(remoteProfile);
    saveProfileMock.mockResolvedValue(remoteProfile);

    const { result } = renderHook(() => usePersonalization(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.profile).toEqual(remoteProfile);
    expect(saveProfileMock).not.toHaveBeenCalled();
  });

  it('uploads an existing local profile when the server does not have one yet', async () => {
    const localProfile: PersonalizationProfile = {
      ...createEmptyProfile(),
      userName: 'Local Marek',
      favoriteCharacterIds: ['character-1'],
      mainCharacterId: 'character-1',
    };

    getProfileMock.mockResolvedValue(null);
    saveProfileMock.mockResolvedValue(localProfile);

    renderHook(() => usePersonalization(), {
      wrapper: createWrapper({
        activeApiKey: 'alpha',
        profilesByApiKey: {
          alpha: localProfile,
        },
      }),
    });

    await waitFor(() => expect(saveProfileMock).toHaveBeenCalledWith(localProfile));
  });

  it('persists profile changes after hydration', async () => {
    const emptyProfile = createEmptyProfile();
    getProfileMock.mockResolvedValue(emptyProfile);
    saveProfileMock.mockResolvedValue({
      ...emptyProfile,
      userName: 'Anna',
    });

    const { result } = renderHook(() => usePersonalization(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    act(() => {
      result.current.setUserName('Anna');
    });

    await waitFor(() => expect(saveProfileMock).toHaveBeenCalledWith({
      ...emptyProfile,
      userName: 'Anna',
    }));
  });

  it('exposes an explicit saveToDatabase action for the current profile', async () => {
    const emptyProfile = createEmptyProfile();

    getProfileMock.mockResolvedValue(emptyProfile);
    saveProfileMock.mockResolvedValue({
      ...emptyProfile,
      userName: 'Manual save',
    });

    const { result } = renderHook(() => usePersonalization(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    act(() => {
      result.current.setUserName('Manual save');
    });

    await waitFor(() => expect(saveProfileMock).toHaveBeenCalledWith({
      ...emptyProfile,
      userName: 'Manual save',
    }));

    saveProfileMock.mockClear();

    await act(async () => {
      await result.current.saveToDatabase();
    });

    expect(saveProfileMock).toHaveBeenCalledWith({
      ...emptyProfile,
      userName: 'Manual save',
    });
  });
});