import { isUniqueViolation } from '../../src/database/unique-violation';

describe('isUniqueViolation', () => {
  test('returns true for PostgreSQL unique violation code', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
  });

  test.each([null, undefined, '23505', 23503, {}, { code: 'outro' }])(
    'returns false for %p',
    (value) => {
      expect(isUniqueViolation(value as any)).toBe(false);
    },
  );
});
