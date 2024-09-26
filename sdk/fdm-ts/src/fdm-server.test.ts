import 'dotenv/config'
import { fdmServer } from './fdm-server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

vi.mock('drizzle-orm/postgres-js/migrator');
vi.mock('drizzle-orm/postgres-js');
vi.mock('postgres');

describe('fdmServer', () => {
  let dbMock: any;
  let migrateMock: any;
  let clientMock: any;

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

    clientMock = {
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT),
        database: process.env.POSTGRES_DB,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        max: 1,
    };
    (postgres as any).mockReturnValue(clientMock);
  });

  afterEach(() => {
    // Reset mocks after each test
    vi.clearAllMocks();
  });

  it('should create an instance with correct parameters', () => {
    new fdmServer(process.env.POSTGRES_HOST, Number(process.env.POSTGRES_PORT), process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, process.env.POSTGRES_DB);
    expect(postgres).toHaveBeenCalledWith(clientMock);
  });

  // No migrations yet, thus not functional
//   it('should migrate the database on creation', async () => {
//     const fdmServerInstance = new fdmServer(process.env.POSTGRES_HOST, Number(process.env.POSTGRES_PORT), process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, process.env.POSTGRES_DB);
//     expect(migrateMock).toHaveBeenCalledWith(fdmServerInstance.db, { migrationsFolder: '/schema/migrations', migrationsSchema: 'fdm-migrations' });
//   });
});

const fdm = new fdmServer(process.env.POSTGRES_HOST, Number(process.env.POSTGRES_PORT), process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, process.env.POSTGRES_DB);
console.log(fdm)