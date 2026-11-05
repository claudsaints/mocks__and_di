import { HttpError } from '../../../src/errors';
import { CoursesService } from '../../../src/modules/courses/courses.service';

describe('CoursesService', () => {
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

  test('create returns the created course and forwards the payload', async () => {
    const service = new CoursesService(repository as any);
    const created = { id: 1, name: 'Qualidade' };
    repository.create.mockResolvedValue(created);

    await expect(service.create({ name: 'Qualidade' })).resolves.toBe(created);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ name: 'Qualidade' });
  });

  test.each([null, {}, { name: 'A' }])('create rejects invalid payload %p with 400', async (payload) => {
    const service = new CoursesService(repository as any);

    await expect(service.create(payload as any)).rejects.toBeInstanceOf(HttpError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  test('create rejects duplicate names with 409', async () => {
    const service = new CoursesService(repository as any);
    repository.create.mockRejectedValue({ code: '23505' });

    await expect(service.create({ name: 'Qualidade' })).rejects.toMatchObject({
      statusCode: 409,
      message: 'Já existe um curso com este nome.',
    });
  });

  test('findAll returns the repository list', async () => {
    const service = new CoursesService(repository as any);
    const list = [{ id: 1, name: 'Qualidade' }, { id: 2, name: 'Lógica' }];
    repository.findAll.mockResolvedValue(list);

    await expect(service.findAll()).resolves.toEqual(list);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test('findOne returns an existing course', async () => {
    const service = new CoursesService(repository as any);
    const record = { id: 123, name: 'Qualidade' };
    repository.findOne.mockResolvedValue(record);

    await expect(service.findOne(123)).resolves.toBe(record);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test('findOne rejects when the course is missing', async () => {
    const service = new CoursesService(repository as any);
    repository.findOne.mockResolvedValue(undefined);

    await expect(service.findOne(123)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Curso com ID 123 não encontrado.',
    });
  });

  test('findOne rejects invalid identifiers before hitting the repository', async () => {
    const service = new CoursesService(repository as any);

    await expect(service.findOne(0)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  test('propagates unexpected errors from create, findAll and findOne', async () => {
    const methods = ['create', 'findAll', 'findOne'] as const;

    for (const methodName of methods) {
      const service = new CoursesService(repository as any);
      const error = new Error(`error in ${methodName}`);
      repository[methodName].mockRejectedValueOnce(error);

      if (methodName === 'create') {
        await expect(service.create({ name: 'Qualidade' })).rejects.toBe(error);
      }
      if (methodName === 'findAll') {
        await expect(service.findAll()).rejects.toBe(error);
      }
      if (methodName === 'findOne') {
        await expect(service.findOne(123)).rejects.toBe(error);
      }
    }
  });

  test('uses a spy to observe a repository method while returning the record', async () => {
    const repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Qualidade' }),
    };
    const service = new CoursesService(repo as any);
    const spy = jest.spyOn(repo, 'findOne');

    await expect(service.findOne(1)).resolves.toEqual({ id: 1, name: 'Qualidade' });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(1);
  });

  test('create strips extra fields before calling repository.create', async () => {
    const service = new CoursesService(repository as any);
    const created = { id: 7, name: 'Qualidade' };
    repository.create.mockResolvedValue(created);

    await expect(service.create({ name: 'Qualidade', extra: true })).resolves.toBe(created);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ name: 'Qualidade' });
  });
});
