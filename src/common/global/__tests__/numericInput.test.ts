import { describe, expect, it } from 'vitest';
import { normalizeLeadingZeros, normalizeNumericInput } from '../numericInput';

describe('normalizeLeadingZeros', () => {
  it.each([
    ['0', '0'], ['00', '0'], ['000', '0'], ['05', '5'], ['00012', '12'],
    ['10', '10'], ['1005', '1005'], ['-05', '-5'], ['+005', '+5'],
    ['-0', '-0'], ['-000', '-0'], ['0.5', '0.5'], ['00.50', '0.50'], ['-00.50', '-0.50'],
    ['00,50', '0,50'], ['0.', '0.'], ['00.', '0.'], ['', ''], ['-', '-'], ['+', '+'], ['.', '.'],
    ['1e03', '1e03'], ['001e03', '1e03'], ['00e-03', '0e-03'], ['0e', '0e'],
    ['00090071992547409931234', '90071992547409931234'],
  ])('%j → %j without converting to Number', (raw, expected) => {
    expect(normalizeLeadingZeros(raw)).toBe(expected);
  });
});

describe('normalizeNumericInput selection', () => {
  it.each([
    ['005', 1, 1, '5', 0, 0],
    ['005', 3, 3, '5', 1, 1],
    ['-005', 1, 1, '-5', 1, 1],
    ['-005', 4, 4, '-5', 2, 2],
    ['0052', 1, 4, '52', 0, 2],
  ] as const)('preserves the selection when formatting %s at %i–%i', (raw, start, end, expected, nextStart, nextEnd) => {
    const input = document.createElement('input');
    input.value = raw;
    input.setSelectionRange(start, end, 'backward');
    normalizeNumericInput(input);
    expect(input.value).toBe(expected);
    expect(input.selectionStart).toBe(nextStart);
    expect(input.selectionEnd).toBe(nextEnd);
    expect(input.selectionDirection).toBe('backward');
  });
});
