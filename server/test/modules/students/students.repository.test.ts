import { PgStudentRepository } from '../../../src/modules/students/students.repository';

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

describe('PgStudentRepository', () => {
  let db: { query: jest.Mock };

  beforeEach(() => {
    db = { query: jest.fn() };
  });

  test('create inserts the student and returns the created row', async () => {
    const repository = new PgStudentRepository(db as any);
    const created = { ra: 123, name: 'Ana' };
    db.query.mockResolvedValue({ rows: [created] });

    await expect(repository.create({ ra: 123, name: 'Ana' })).resolves.toEqual(created);
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][1]).toEqual([123, 'Ana']);
    expect(normalizeSql(db.query.mock.calls[0][0])).toBe(
      normalizeSql('INSERT INTO students (ra, name) VALUES ($1, $2) RETURNING ra, name'),
    );
  });

  test('findAll returns the rows ordered by name', async () => {
    const repository = new PgStudentRepository(db as any);
    const rows = [{ ra: 123, name: 'Ana' }, { ra: 456, name: 'Bia' }];
    db.query.mockResolvedValue({ rows });

    await expect(repository.findAll()).resolves.toEqual(rows);
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][1]).toBeUndefined();
    expect(normalizeSql(db.query.mock.calls[0][0])).toBe(
      normalizeSql('SELECT ra, name FROM students ORDER BY name'),
    );
  });

  test('findAll returns an empty array when there are no records', async () => {
    const repository = new PgStudentRepository(db as any);
    db.query.mockResolvedValue({ rows: [] });

    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test('findOne returns the matching row', async () => {
    const repository = new PgStudentRepository(db as any);
    const row = { ra: 123, name: 'Ana' };
    db.query.mockResolvedValue({ rows: [row] });

    await expect(repository.findOne(123)).resolves.toEqual(row);
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][1]).toEqual([123]);
    expect(normalizeSql(db.query.mock.calls[0][0])).toBe(
      normalizeSql('SELECT ra, name FROM students WHERE ra = $1'),
    );
  });

  test('findOne returns undefined when no row matches', async () => {
    const repository = new PgStudentRepository(db as any);
    db.query.mockResolvedValue({ rows: [] });

    await expect(repository.findOne(123)).resolves.toBeUndefined();
  });

  test('propagates database query errors for create, findAll and findOne', async () => {
    const repository = new PgStudentRepository(db as any);
    const methodNames = ['create', 'findAll', 'findOne'] as const;

    for (const methodName of methodNames) {
      const error = new Error(`query failed in ${methodName}`);
      db.query.mockReset();
      db.query.mockRejectedValueOnce(error);

      if (methodName === 'create') {
        await expect(repository.create({ ra: 123, name: 'Ana' })).rejects.toBe(error);
      }
      if (methodName === 'findAll') {
        await expect(repository.findAll()).rejects.toBe(error);
      }
      if (methodName === 'findOne') {
        await expect(repository.findOne(123)).rejects.toBe(error);
      }
    }
  });
});
