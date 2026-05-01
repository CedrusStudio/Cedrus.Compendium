import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

const formStringsInputSpy = vi.fn();

vi.mock('@/common/translations', () => ({
  displayedText: {
    name: 'name',
    grade: 'grade',
    description: 'description',
    changeName: 'change name',
    changeDescription: 'change description',
    addRequirement: 'add requirement',
    price: 'price',
  },
}));

vi.mock('@/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
}));

vi.mock('@/common/components/form/InputFormField', () => ({
  InputFormField: () => <div data-testid="input-form-field" />,
}));

vi.mock('@/common/components/form/AreaInputFormField', () => ({
  __esModule: true,
  default: () => <div data-testid="area-input-form-field" />,
}));

vi.mock('@/common/components/inputs/FormTagsInput', () => ({
  __esModule: true,
  default: () => <div data-testid="form-tags-input" />,
}));

vi.mock('@/common/components/inputs/FormStringsInput', () => ({
  __esModule: true,
  default: (props: unknown) => {
    formStringsInputSpy(props);
    return <div data-testid="form-strings-input" />;
  },
}));

vi.mock('@/common/components/sheets/AddSheet', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import PerkEditableFields from '@/application/common/PerkEditableFields';
import PerkableAddSheet from '@/application/common/PerkableAddSheet';

describe('perk requirement inputs', () => {
  beforeEach(() => {
    formStringsInputSpy.mockClear();
  });

  it('passes the entity type to the shared edit requirements input', () => {
    render(<PerkEditableFields entityType="perks" />);

    expect(formStringsInputSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'requirements',
        entityType: 'perks',
      }),
    );
  });

  it('passes the entity type to the shared add requirements input', () => {
    render(
      <PerkableAddSheet
        isPending={false}
        formId="perk-form"
        title="Add perk"
        entityType="perks"
      />,
    );

    expect(formStringsInputSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'requirements',
        entityType: 'perks',
      }),
    );
  });
});