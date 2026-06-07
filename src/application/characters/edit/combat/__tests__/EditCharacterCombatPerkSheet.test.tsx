import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const perkEditableFieldsSpy = vi.fn();

vi.mock('@/common/components/sheets/EditSheet', () => ({
  EditSheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/application/common/PerkEditableFields', () => ({
  __esModule: true,
  default: (props: unknown) => {
    perkEditableFieldsSpy(props);
    return <div data-testid="perk-editable-fields" />;
  },
}));

import EditCharacterCombatPerkSheet from '../EditCharacterCombatPerkSheet';

describe('EditCharacterCombatPerkSheet', () => {
  it('passes maneuver requirements entity type for maneuver edits', () => {
    render(<EditCharacterCombatPerkSheet type="maneuvers.0" displayedTitle="Edit maneuver" />);

    expect(perkEditableFieldsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        pathPrefix: 'maneuvers.0.',
        entityType: 'maneuvers',
      }),
    );
  });

  it('maps power spell edits to the spells requirements entity type', () => {
    render(<EditCharacterCombatPerkSheet type="powers.0.spells.1" displayedTitle="Edit spell" />);

    expect(perkEditableFieldsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        pathPrefix: 'powers.0.spells.1.',
        entityType: 'spells',
      }),
    );
  });
});