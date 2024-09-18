import { fdm } from './fdm';
import { describe, expect, test, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'fs';

describe('fdm', () => {
  const dbFilePath = 'test.db';

  afterEach(() => {
    // Clean up the test database file after each test
    if (existsSync(dbFilePath)) {
      unlinkSync(dbFilePath);
    }
  });

  test('should initialize with in-memory database', () => {
    const farmDataModel = new fdm(false, '');
    expect(farmDataModel.db).toBeDefined();
  });

  test('should initialize with persistent database', () => {
    const farmDataModel = new fdm(true, dbFilePath);
    expect(farmDataModel.db).toBeDefined();
    expect(existsSync(dbFilePath)).toBe(true);
  });

  test('should throw error if persistent database file is not accessible', () => {
    const inaccessibleFilePath = './nonexistent-folder/test.db';
    expect(() => new fdm(true, inaccessibleFilePath)).toThrowError();
  });
});

