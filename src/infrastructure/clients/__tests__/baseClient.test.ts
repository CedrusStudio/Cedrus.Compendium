import { describe, expect, it } from 'vitest';
import { extractServerErrorMessage } from '@/infrastructure/clients/baseClient';

describe('extractServerErrorMessage', () => {
  it('returns the server message when present', () => {
    const result = extractServerErrorMessage({
      response: { data: { message: 'Invalid API key(s), not part of the configured admin keys: BOGUS' } },
    });

    expect(result).toBe('Invalid API key(s), not part of the configured admin keys: BOGUS');
  });

  it('returns undefined when there is no response', () => {
    expect(extractServerErrorMessage({})).toBeUndefined();
  });

  it('returns undefined when the response body has no message field', () => {
    expect(extractServerErrorMessage({ response: { data: { error: 'Forbidden' } } })).toBeUndefined();
  });

  it('returns undefined when message is not a string', () => {
    expect(extractServerErrorMessage({ response: { data: { message: 42 } } })).toBeUndefined();
  });

  it('returns undefined when message is an empty string', () => {
    expect(extractServerErrorMessage({ response: { data: { message: '' } } })).toBeUndefined();
  });

  it('returns undefined when the response body is not an object', () => {
    expect(extractServerErrorMessage({ response: { data: 'Internal Server Error' } })).toBeUndefined();
  });
});
