import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { displayedText } from '@/common/translations';
import { createExternalParticipant } from '../BattleCombatants';

const { dispatch } = vi.hoisted(() => ({ dispatch: vi.fn() }));
vi.mock('react-redux', () => ({ useDispatch: () => dispatch }));
import AddExternalParticipantDialog from '../AddExternalParticipantDialog';
import ExternalParticipantActionsCell from '../ExternalParticipantActionsCell';

describe('external participant numeric values', () => {
  beforeEach(() => dispatch.mockClear());
  for (const mode of ['add', 'edit'])
  {
    it.each(['maxHealth', 'initiativeGrade', 'initiativeValue'])(`${mode}: blocks a cleared %s and preserves explicit valid values`, field => {
      const { container } = render(mode === 'add' ? <AddExternalParticipantDialog />
        : <ExternalParticipantActionsCell participant={createExternalParticipant('Test', 50, 3, 0)} />);
      fireEvent.click(container.querySelector('button')!);
      const dialog = screen.getByRole('dialog');
      const name = dialog.querySelector('input[id="name"]')!;
      fireEvent.change(name, { target: { value: 'Testowy uczestnik' } });
      const id = mode === 'add' && field.startsWith('initiative')
        ? field === 'initiativeGrade' ? 'initiative.grade' : 'initiative.value' : field;
      const input = dialog.querySelector(`input[id="${id}"]`)!;
      fireEvent.change(input, { target: { value: '' } });
      const save = within(dialog).getByRole('button', { name: displayedText.save });
      fireEvent.click(save);
      expect(dispatch).not.toHaveBeenCalled();
      expect(within(dialog).getByRole('alert')).toHaveTextContent('Uzupełnij pole');
      fireEvent.change(input, { target: { value: field === 'initiativeValue' ? '0' : '5' } });
      fireEvent.click(save);
      expect(dispatch).toHaveBeenCalledOnce();
      expect(dispatch.mock.calls[0][0].payload).toMatchObject({ initiative: { value: 0 } });
    });
  }
});
