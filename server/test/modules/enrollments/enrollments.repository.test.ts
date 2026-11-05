import { PgEnrollmentRepository } from '../../../src/modules/enrollments/enrollments.repository';

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

describe('PgEnrollmentRepository', () => {
  let db: { query: jest.Mock };

  beforeEach(() => {
    db = { query: jest.fn() };
  });

  test('create inserts the enrollment and returns the created row', async () => {
    const repository = new PgEnrollmentRepository(db as any);
    const created = {
      studentRa: 123,
      courseId: 7,
      enrolledAt: new Date('2024-01-01T00:00:00.000Z'),
    };
    db.query.mockResolvedValue({ rows: [created] });

    await expect(repository.create(123, 7)).resolves.toEqual(created);
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][1]).toEqual([123, 7]);
    expect(normalizeSql(db.query.mock.calls[0][0])).toBe(
      normalizeSql(`INSERT INTO enrollments (student_ra, course_id) VALUES ($1, $2)
         RETURNING student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt"`),
    );
  });

  test('findAll returns the rows ordered by student and course', async () => {
    const repository = new PgEnrollmentRepository(db as any);
    const rows = [
      { studentRa: 123, courseId: 1, enrolledAt: new Date('2024-01-01T00:00:00.000Z') },
      { studentRa: 456, courseId: 2, enrolledAt: new Date('2024-01-02T00:00:00.000Z') },
    ];
    db.query.mockResolvedValue({ rows });

    await expect(repository.findAll()).resolves.toEqual(rows);
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][1]).toBeUndefined();
    expect(normalizeSql(db.query.mock.calls[0][0])).toBe(
      normalizeSql(`SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt"
         FROM enrollments ORDER BY student_ra, course_id`),
    );
  });

  test('findAll returns an empty array when there are no records', async () => {
    const repository = new PgEnrollmentRepository(db as any);
    db.query.mockResolvedValue({ rows: [] });

    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test('findOne returns the matching row', async () => {
    const repository = new PgEnrollmentRepository(db as any);
    const row = { studentRa: 123, courseId: 7, enrolledAt: new Date('2024-01-01T00:00:00.000Z') };
    db.query.mockResolvedValue({ rows: [row] });

    await expect(repository.findOne(123, 7)).resolves.toEqual(row);
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][1]).toEqual([123, 7]);
    expect(normalizeSql(db.query.mock.calls[0][0])).toBe(
      normalizeSql(`SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt"
         FROM enrollments WHERE student_ra = $1 AND course_id = $2`),
    );
  });

  test('findOne returns undefined when no row matches', async () => {
    const repository = new PgEnrollmentRepository(db as any);
    db.query.mockResolvedValue({ rows: [] });

    await expect(repository.findOne(123, 7)).resolves.toBeUndefined();
  });

  test('propagates database query errors for create, findAll and findOne', async () => {
    const repository = new PgEnrollmentRepository(db as any);
    const methodNames = ['create', 'findAll', 'findOne'] as const;

    for (const methodName of methodNames) {
      const error = new Error(`query failed in ${methodName}`);
      db.query.mockReset();
      db.query.mockRejectedValueOnce(error);

      if (methodName === 'create') {
        await expect(repository.create(123, 7)).rejects.toBe(error);
      }
      if (methodName === 'findAll') {
        await expect(repository.findAll()).rejects.toBe(error);
      }
      if (methodName === 'findOne') {
        await expect(repository.findOne(123, 7)).rejects.toBe(error);
      }
    }
  });
});
