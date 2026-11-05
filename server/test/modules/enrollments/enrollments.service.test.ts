import { HttpError } from '../../../src/errors';
import { EnrollmentsService } from '../../../src/modules/enrollments/enrollments.service';

describe('EnrollmentsService', () => {
  let repository: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
  });

  test('create returns the created enrollment and forwards both identifiers', async () => {
    const service = new EnrollmentsService(repository as any);
    const created = { studentRa: 123, courseId: 1, enrolledAt: new Date('2024-01-01T00:00:00.000Z') };
    repository.create.mockResolvedValue(created);

    await expect(service.create({ studentRa: 123, courseId: 1 })).resolves.toBe(created);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(123, 1);
  });

  test.each([
    [{ studentRa: 0, courseId: 1 }, 'studentRa'],
    [{ studentRa: 123, courseId: 0 }, 'courseId'],
  ])('rejects invalid create payload %p with 400', async (payload) => {
    const service = new EnrollmentsService(repository as any);

    await expect(service.create(payload as any)).rejects.toBeInstanceOf(HttpError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  test('create rejects missing foreign key references with 404', async () => {
    const service = new EnrollmentsService(repository as any);
    repository.create.mockRejectedValue({ code: '23503' });

    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toMatchObject({
      statusCode: 404,
      message: 'Estudante ou curso não encontrado para realizar a matrícula.',
    });
  });

  test('create rejects duplicate enrollments with 409', async () => {
    const service = new EnrollmentsService(repository as any);
    repository.create.mockRejectedValue({ code: '23505' });

    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toMatchObject({
      statusCode: 409,
      message: 'Este estudante já está matriculado neste curso.',
    });
  });

  test('findOne rejects when the enrollment is missing', async () => {
    const service = new EnrollmentsService(repository as any);
    repository.findOne.mockResolvedValue(undefined);

    await expect(service.findOne(123, 1)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Matrícula não encontrada.',
    });
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });

  test('create propagates unexpected database errors', async () => {
    const service = new EnrollmentsService(repository as any);
    const error = new Error('database exploded');
    repository.create.mockRejectedValueOnce(error);

    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toBe(error);
  });

  test('findAll returns the list from repository', async () => {
    const service = new EnrollmentsService(repository as any);
    const list = [
      { studentRa: 123, courseId: 1, enrolledAt: new Date('2024-01-01T00:00:00.000Z') },
      { studentRa: 456, courseId: 2, enrolledAt: new Date('2024-01-02T00:00:00.000Z') },
    ];
    repository.findAll.mockResolvedValue(list);

    await expect(service.findAll()).resolves.toEqual(list);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test('findOne returns an existing enrollment', async () => {
    const service = new EnrollmentsService(repository as any);
    const record = { studentRa: 123, courseId: 1, enrolledAt: new Date('2024-01-01T00:00:00.000Z') };
    repository.findOne.mockResolvedValue(record);

    await expect(service.findOne(123, 1)).resolves.toBe(record);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });
});
