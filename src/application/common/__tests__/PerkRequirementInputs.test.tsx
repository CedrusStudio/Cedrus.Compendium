import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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

vi.mock('@/application/common/requirements/RequirementListField', () => ({
  __esModule: true,
  default: () => <div data-testid="requirement-list-field" />,
}));

vi.mock('@/application/common/replaces/ReplacesListField', () => ({
  __esModule: true,
  default: ({ group }: { group: string }) => <div data-testid="replaces-list-field" data-group={group} />,
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

  it('renders the structured requirement picker in the edit fields (no legacy input)', () => {
    render(<PerkEditableFields entityType="perks" />);

    expect(screen.getByTestId('requirement-list-field')).toBeTruthy();
    expect(formStringsInputSpy).not.toHaveBeenCalled();
  });

  it('uses the structured requirement picker in the compendium add sheet', () => {
    render(
      <PerkableAddSheet
        isPending={false}
        formId="perk-form"
        title="Add perk"
        entityType="perks"
      />,
    );

    expect(screen.getByTestId('requirement-list-field')).toBeTruthy();
    expect(formStringsInputSpy).not.toHaveBeenCalled();
  });

  it('offers the replaces editor in the add sheet, scoped to the added entity kind', () => {
    render(
      <PerkableAddSheet
        isPending={false}
        formId="perk-form"
        title="Add perk"
        entityType="perks"
      />,
    );

    expect(screen.getByTestId('replaces-list-field').getAttribute('data-group')).toBe('perks');
  });

  it('leaves the replaces editor out when there is no entity kind to suggest from', () => {
    render(<PerkableAddSheet isPending={false} formId="perk-form" title="Add perk" />);

    expect(screen.queryByTestId('replaces-list-field')).toBeNull();
  });
});