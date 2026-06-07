import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const itemEditableFieldsSpy = vi.fn();

vi.mock('@/common/components/sheets/EditSheet', () => ({
  EditSheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/application/common/equipment/EditSheets/ItemEditableFields', () => ({
  __esModule: true,
  default: (props: unknown) => {
    itemEditableFieldsSpy(props);
    return <div data-testid="item-editable-fields" />;
  },
}));

vi.mock('@/common/translations', () => ({
  displayedText: {
    editingItem: 'editing item',
  },
}));

import EditCharacterItemSheet from '../EditCharacterItemSheet';

describe('EditCharacterItemSheet', () => {
  it('passes the equipment entity type for armor edits', () => {
    render(<EditCharacterItemSheet type="armors.0" />);

    expect(itemEditableFieldsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        pathPrefix: 'armors.0.',
        entityType: 'armors',
      }),
    );
  });

  it('passes the equipment entity type for inventory edits', () => {
    render(<EditCharacterItemSheet type="inventory.2" />);

    expect(itemEditableFieldsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        pathPrefix: 'inventory.2.',
        entityType: 'inventory',
      }),
    );
  });
});