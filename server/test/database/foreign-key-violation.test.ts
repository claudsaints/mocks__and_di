import { isForeignKeyViolation } from '../../src/database/foreign-key-violation';

describe('isForeignKeyViolation', () => {
  test('returns true for PostgreSQL foreign key violation code', () => {
    expect(isForeignKeyViolation({ code: '23503' })).toBe(true);
  });

  test.each([null, undefined, '23505', 23503, {}, { code: 'outro' }])(
    'returns false for %p',
    (value) => {
      expect(isForeignKeyViolation(value as any)).toBe(false);
    },
  );
});
