import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const formTagsInputSpy = vi.fn();
const useFormMock = vi.fn();
const useCharacterCreationModeMock = vi.fn();
const useBaseCharacterMock = vi.fn();
const useCreateCharacterFromScratchMock = vi.fn();
const useCreateCharacterFromCopyMock = vi.fn();

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(),
}));

vi.mock('react-hook-form', () => ({
  useForm: () => useFormMock(),
}));

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

vi.mock('@/common/translations', () => ({
  displayedText: {
    create_new_character: 'create new character',
    create_from_template: 'create from template',
    name: 'name',
    short_name: 'short name',
    description: 'description',
  },
}));

vi.mock('@/common/components/inputs/FormTagsInput', () => ({
  __esModule: true,
  default: (props: unknown) => {
    formTagsInputSpy(props);
    return <div data-testid="form-tags-input" />;
  },
}));

vi.mock('@/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/application/characters/add/SelectBaseCharacterDialog', () => ({
  __esModule: true,
  default: () => <div data-testid="select-base-character-dialog" />,
}));

vi.mock('@/ui/separator', () => ({
  Separator: () => <div data-testid="separator" />,
}));

vi.mock('@/application/characters/add/useCharacterCreationMode', () => ({
  useCharacterCreationMode: () => useCharacterCreationModeMock(),
}));

vi.mock('@/application/characters/add/useBaseCharacter', () => ({
  useBaseCharacter: () => useBaseCharacterMock(),
}));

vi.mock('@/application/characters/add/useCreateCharacterFromScratch', () => ({
  useCreateCharacterFromScratch: () => useCreateCharacterFromScratchMock(),
}));

vi.mock('@/application/characters/add/useCreateCharacterFromCopy', () => ({
  useCreateCharacterFromCopy: () => useCreateCharacterFromCopyMock(),
}));

import AddCharacterView from '../AddCharacterView';

describe('AddCharacterView', () => {
  beforeEach(() => {
    formTagsInputSpy.mockClear();
    useFormMock.mockReset();
    useCharacterCreationModeMock.mockReset();
    useBaseCharacterMock.mockReset();
    useCreateCharacterFromScratchMock.mockReset();
    useCreateCharacterFromCopyMock.mockReset();

    useFormMock.mockReturnValue({
      handleSubmit: vi.fn(() => vi.fn()),
      reset: vi.fn(),
    });

    useCharacterCreationModeMock.mockReturnValue({
      mode: 'copy',
      selectedCharacterId: 'character-1',
      switchToScratch: vi.fn(),
      switchToCopy: vi.fn(),
      selectBaseCharacter: vi.fn(),
      resetMode: vi.fn(),
    });

    useBaseCharacterMock.mockReturnValue({
      baseCharacter: { id: 'character-1' },
    });

    useCreateCharacterFromScratchMock.mockReturnValue({
      createFromScratch: vi.fn(),
      isPending: false,
    });

    useCreateCharacterFromCopyMock.mockReturnValue({
      createFromCopy: vi.fn(),
      isPending: false,
    });
  });

  it('passes the characters entity type to the tags input in create-from-template mode', () => {
    render(<AddCharacterView />);

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