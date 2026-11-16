import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Character } from '@/domain/characters/Character';

const formTagsInputSpy = vi.fn();
const useCharacterFormMock = vi.fn();
const useWatchedFormArrayMock = vi.fn();

vi.mock('@/ui/form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/common/components/form/InputFormField', () => ({
  InputFormField: () => <div data-testid="input-form-field" />,
}));

vi.mock('@/common/components/form/SubmitButton', () => ({
  __esModule: true,
  default: () => <button type="button">submit</button>,
}));

vi.mock('@/common/components/form/AreaInputFormField', () => ({
  __esModule: true,
  default: () => <div data-testid="area-input-form-field" />,
}));

vi.mock('@/common/components/inputs/FormTagsInput', () => ({
  __esModule: true,
  default: (props: unknown) => {
    formTagsInputSpy(props);
    return <div data-testid="form-tags-input" />;
  },
}));

vi.mock('@/common/components/inputs/FormStringsInput', () => ({
  __esModule: true,
  default: () => <div data-testid="form-strings-input" />,
}));

vi.mock('@/common/hooks/useApiKey', () => ({
  useApiKey: () => ({ apiKey: null, isLoaded: true, hasApiKey: false, saveApiKey: vi.fn(), removeApiKey: vi.fn() }),
}));

vi.mock('@/common/translations', () => ({
  displayedText: {
    changeName: 'change name',
    changeShortName: 'change short name',
    changeDescription: 'change description',
    apiKeys: 'api keys',
    apiKeysDescription: 'api keys description',
    assignCurrentApiKey: 'assign current api key',
    noApiKeySet: 'no api key set',
  },
}));

vi.mock('@/application/characters/edit/details/EditPerksList', () => ({
  __esModule: true,
  default: () => <div data-testid="edit-perks-list" />,
}));

vi.mock('@/infrastructure/hooks/useWatchedFormArray', () => ({
  __esModule: true,
  default: function useWatchedFormArray() { return useWatchedFormArrayMock(); },
}));

vi.mock('@/common/components/ui/separator', () => ({
  Separator: () => <div data-testid="separator" />,
}));

vi.mock('@/application/characters/edit/hooks/useCharacterForm', () => ({
  useCharacterForm: () => useCharacterFormMock(),
}));

vi.mock('@/infrastructure/clients/charactersClient', () => ({
  __esModule: true,
  default: {
    updateDetails: vi.fn(),
  },
}));

vi.mock('@/application/characters/edit/editFormConstants', () => ({
  FORM_IDS: {
    DETAILS: 'details-form',
  },
}));

vi.mock('@/application/characters/edit/details/RaceSelector', () => ({
  __esModule: true,
  default: () => <div data-testid="race-selector" />,
}));

import EditDetailsView from '../EditDetailsView';

const character = {
  id: 'character-1',
  name: 'Geralt',
  shortName: 'Ger',
  tags: ['witcher'],
  description: 'White Wolf',
  perks: [],
  race: null,
} as unknown as Character;

describe('EditDetailsView', () => {
  beforeEach(() => {
    formTagsInputSpy.mockClear();
    useCharacterFormMock.mockReset();
    useWatchedFormArrayMock.mockReset();

    useCharacterFormMock.mockReturnValue({
      form: {
        control: {},
        handleSubmit: vi.fn(() => vi.fn()),
      },
      handleSubmit: vi.fn(),
      isPending: false,
      formId: 'details-form',
    });

    useWatchedFormArrayMock.mockReturnValue({
      watchedArray: [],
      append: vi.fn(),
      remove: vi.fn(),
    });
  });

  it('passes the characters entity type to the tags input in edit mode', () => {
    render(<EditDetailsView character={character} />);

    expect(screen.getByTestId('form-tags-input')).toBeTruthy();
    expect(formTagsInputSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'tags',
        beAbleToSetCharacterAndSessionTags: true,
        entityType: 'characters',
      }),
    );
  });
});
