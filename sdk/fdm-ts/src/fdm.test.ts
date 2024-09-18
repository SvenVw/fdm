import { fdm } from './fdm';
import { describe, expect, test, afterEach, vi } from 'vitest';
import { access } from 'node:fs';
import { execSync } from 'child_process';

vi.mock('child_process');
vi.mock('node:fs');

describe('fdm', () => {
  const dbFilePath = 'test.db';

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should initialize with in-memory database', () => {
    const farmDataModel = new fdm(false, '');
    expect(farmDataModel.db).toBeDefined();
  });

  test('should initialize with persistent database', () => {
    // Mock access to return successfully
    vi.mocked(access).mockImplementation((path, mode, callback) => callback(null));

    const farmDataModel = new fdm(true, dbFilePath);
    expect(farmDataModel.db).toBeDefined();
  });

  test('should throw error if persistent database file is not accessible', () => {
    // Mock access to return an error
    const mockedAccess = vi.mocked(access);
    mockedAccess.mockImplementation((path, mode, callback) => callback(new Error('File not accessible')));

    // Assert that the console.error method is called with the correct error message
    const consoleSpy = vi.spyOn(console, 'error');
    new fdm(true, dbFilePath);
    expect(consoleSpy).toHaveBeenCalledWith(`${dbFilePath} is not readable and writable`);
  });

  test('should setup database successfully', () => {
    const mockedExecSync = vi.mocked(execSync);
    mockedExecSync.mockImplementation(() => { return undefined; });

    const farmDataModel = new fdm(false, '');
    farmDataModel.setupDatabase();
    expect(mockedExecSync).toHaveBeenCalledTimes(2);
    expect(mockedExecSync).toHaveBeenNthCalledWith(1, 'npx drizzle-kit generate --config drizzle.config.ts');
    expect(mockedExecSync).toHaveBeenNthCalledWith(2, 'npx drizzle-kit migrate --config drizzle.config.ts');
  });

});
