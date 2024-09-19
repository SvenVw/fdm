import { fdm } from './fdm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { drizzle } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';

vi.mock('drizzle-orm/pglite/migrator');
vi.mock('drizzle-orm/pglite');
vi.mock('@electric-sql/pglite');

describe('fdm', () => {
  let dbMock: any;
  let migrateMock: any;

  beforeEach(() => {
    // Create mock instances before each test
    dbMock = {
      farms: {
        create: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
        select: vi.fn(),
      },
    };
    (drizzle as any).mockReturnValue(dbMock);

    migrateMock = vi.fn();
    (migrate as any).mockReturnValue(migrateMock);
  });

  afterEach(() => {
    // Reset mocks after each test
    vi.clearAllMocks();
  });

  it('should create an in-memory instance', () => {
    new fdm(false, '');
    expect(PGlite).toHaveBeenCalledWith('memory://');
  });

  it('should create a persistent instance', () => {
    const filePath = '/some/path/to/db';
    new fdm(true, filePath);
    expect(PGlite).toHaveBeenCalledWith(filePath);
  });

  // No migrations yet, thus not functional
  // it('should migrate the database on creation', async () => {
  //   const fdmInstance = new fdm(false, '');
  //   expect(migrateMock).toHaveBeenCalledWith(fdmInstance.db, { migrationsFolder: '/schema/migrations' });
  // });
});

