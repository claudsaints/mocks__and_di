import { HttpError } from '../src/errors';
import { parseId, positiveInteger, validateBody, validateName } from '../src/validation';

function expectHttp400(fn: () => unknown): void {
  try {
    fn();
    throw new Error('Expected function to throw an HttpError with status 400.');
  } catch (error) {
    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).statusCode).toBe(400);
  }
}

describe('validation helpers', () => {
  describe('positiveInteger', () => {
    test.each([1, 2147483647])('accepts %p', (value) => {
      expect(positiveInteger(value, 'RA')).toBe(value);
    });

    test.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2147483648, '123', null, undefined])(
      'rejects %p',
      (value) => {
        expectHttp400(() => positiveInteger(value as any, 'RA'));
      },
    );
  });

  describe('parseId', () => {
    test.each(['1', '2147483647'])('converts %p to the numeric value', (value) => {
      expect(parseId(value, 'RA')).toBe(Number(value));
    });

    test.each(['1abc', '1.2', '1e2', '', '-1', '0', '2147483648', 123])(
      'rejects %p',
      (value) => {
        expectHttp400(() => parseId(value as any, 'RA'));
      },
    );
  });

  describe('validateName', () => {
    test.each(['Ana', 'a'.repeat(100)])('accepts %p', (value) => {
      expect(validateName(value)).toBe(value);
    });

    test.each(['', 'ab', '   ', ' a ', 'a'.repeat(101), 123, null, undefined])(
      'rejects %p',
      (value) => {
        expectHttp400(() => validateName(value as any));
      },
    );
  });

  describe('validateBody', () => {
    test('returns the same frozen object reference', () => {
      const input = Object.freeze({ name: 'Ana' });
      const result = validateBody(input);
      expect(result).toBe(input);
    });

    test.each([null, undefined, [], 'Ana', 12])('rejects %p', (value) => {
      expectHttp400(() => validateBody(value as any));
    });

    test('accepts extra fields without mutating the object', () => {
      const input = { name: 'Ana', extra: true };
      const result = validateBody(input);
      expect(result).toBe(input);
      expect(result).toEqual({ name: 'Ana', extra: true });
    });
  });
});
