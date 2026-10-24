/** Format the integer part without changing precision, fractional digits or exponents. */
export function normalizeLeadingZeros(value: string): string
{
  return value.replace(/^([+-]?)0+(?=\d)/, '$1');
}

/** React may keep "05" in a number input because it is numerically equal to 5. */
export function normalizeNumericInput(input: HTMLInputElement): void
{
  const raw = input.value;
  const normalized = normalizeLeadingZeros(raw);
  if (raw === normalized) return;

  const start = input.selectionStart;
  const end = input.selectionEnd;
  const direction = input.selectionDirection;
  input.value = normalized;

  // Number inputs do not expose a selection; numeric text fields do.
  if (start !== null && end !== null)
  {
    const removed = raw.length - normalized.length;
    const signLength = /^[+-]/.test(raw) ? 1 : 0;
    const adjust = (position: number) => position <= signLength ? position : Math.max(signLength, position - removed);
    input.setSelectionRange(adjust(start), adjust(end), direction ?? undefined);
  }
}
