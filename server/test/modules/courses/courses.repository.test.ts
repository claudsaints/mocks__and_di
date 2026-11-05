import { PgCourseRepository } from '../../../src/modules/courses/courses.repository';

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

describe('PgCourseRepository', () => {
  let db: { query: jest.Mock };

  beforeEach(() => {
    db = { query: jest.fn() };
  });

  test('create inserts the course and returns the created row', async () => {
    const repository = new PgCourseRepository(db as any);
    const created = { id: 7, name: 'Qualidade' };
    db.query.mockResolvedValue({ rows: [created] });

    await expect(repository.create({ name: 'Qualidade' })).resolves.toEqual(created);
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][1]).toEqual(['Qualidade']);
    expect(normalizeSql(db.query.mock.calls[0][0])).toBe(
      normalizeSql('INSERT INTO courses (name) VALUES ($1) RETURNING id, name'),
    );
  });

  test('findAll returns the rows in ascending order by id', async () => {
    const repository = new PgCourseRepository(db as any);
    const rows = [{ id: 1, name: 'Qualidade' }, { id: 2, name: 'Lógica' }];
    db.query.mockResolvedValue({ rows });

    await expect(repository.findAll()).resolves.toEqual(rows);
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][1]).toBeUndefined();
    expect(normalizeSql(db.query.mock.calls[0][0])).toBe(
      normalizeSql('SELECT id, name FROM courses ORDER BY id'),
    );
  });

  test('findAll returns an empty array when there are no records', async () => {
    const repository = new PgCourseRepository(db as any);
    db.query.mockResolvedValue({ rows: [] });

    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test('findOne returns the matching row', async () => {
    const repository = new PgCourseRepository(db as any);
    const row = { id: 7, name: 'Qualidade' };
    db.query.mockResolvedValue({ rows: [row] });

    await expect(repository.findOne(7)).resolves.toEqual(row);
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][1]).toEqual([7]);
    expect(normalizeSql(db.query.mock.calls[0][0])).toBe(
      normalizeSql('SELECT id, name FROM courses WHERE id = $1'),
    );
  });

  test('findOne returns undefined when no row matches', async () => {
    const repository = new PgCourseRepository(db as any);
    db.query.mockResolvedValue({ rows: [] });

    await expect(repository.findOne(7)).resolves.toBeUndefined();
  });

  test('propagates database query errors for create, findAll and findOne', async () => {
    const repository = new PgCourseRepository(db as any);
    const methodNames = ['create', 'findAll', 'findOne'] as const;

    for (const methodName of methodNames) {
      const error = new Error(`query failed in ${methodName}`);
      db.query.mockReset();
      db.query.mockRejectedValueOnce(error);

      if (methodName === 'create') {
        await expect(repository.create({ name: 'Qualidade' })).rejects.toBe(error);
      }
      if (methodName === 'findAll') {
        await expect(repository.findAll()).rejects.toBe(error);
      }
      if (methodName === 'findOne') {
        await expect(repository.findOne(7)).rejects.toBe(error);
      }
    }
  });
});
