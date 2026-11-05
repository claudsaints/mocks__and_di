import { HttpError } from '../../../src/errors';
import { StudentsService } from '../../../src/modules/students/students.service';

describe('StudentsService', () => {
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

  test('create returns the created student and forwards the payload', async () => {
    const service = new StudentsService(repository as any);
    const created = { ra: 123, name: 'Ana' };
    repository.create.mockResolvedValue(created);

    await expect(service.create({ ra: 123, name: 'Ana' })).resolves.toBe(created);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ ra: 123, name: 'Ana' });
  });

  test('create rejects invalid RA with 400 before calling the repository', async () => {
    const service = new StudentsService(repository as any);

    await expect(service.create({ ra: 0, name: 'Ana' })).rejects.toBeInstanceOf(HttpError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  test('create rejects duplicate RA with 409', async () => {
    const service = new StudentsService(repository as any);
    repository.create.mockRejectedValue({ code: '23505' });

    await expect(service.create({ ra: 123, name: 'Ana' })).rejects.toMatchObject({
      statusCode: 409,
      message: 'Já existe um estudante com este RA.',
    });
  });

  test('findOne rejects when the student is missing', async () => {
    const service = new StudentsService(repository as any);
    repository.findOne.mockResolvedValue(undefined);

    await expect(service.findOne(123)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Estudante com RA 123 não encontrado.',
    });
  });

  test('create propagates unexpected database errors', async () => {
    const service = new StudentsService(repository as any);
    const error = new Error('database exploded');
    repository.create.mockRejectedValueOnce(error);

    await expect(service.create({ ra: 123, name: 'Ana' })).rejects.toBe(error);
  });

  test('findAll returns the repository list', async () => {
    const service = new StudentsService(repository as any);
    const list = [{ ra: 123, name: 'Ana' }, { ra: 456, name: 'Bia' }];
    repository.findAll.mockResolvedValue(list);

    await expect(service.findAll()).resolves.toEqual(list);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test('findOne returns an existing student', async () => {
    const service = new StudentsService(repository as any);
    const record = { ra: 123, name: 'Ana' };
    repository.findOne.mockResolvedValue(record);

    await expect(service.findOne(123)).resolves.toBe(record);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });
});
