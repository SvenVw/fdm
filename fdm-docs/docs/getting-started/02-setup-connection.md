---
title: Setup the FDM instance
---

In the previous step, we made sure that all the prerequisites for `fdm-core` are met. In this step, we will set up an FDM instance.

## Configure Environment Variables

`fdm-core` relies on environment variables for configuration. These variables specify crucial details for connecting to your database. Create a `.env` file in the root of your project and add the following, replacing the placeholders with your actual database credentials:

```env
# DB configuration
# The hostname or IP address of the PostgreSQL database server.
POSTGRES_HOST=

# The port number on which the PostgreSQL database server is listening.  Defaults to 5432 if not specified.
POSTGRES_PORT=

# The name of the PostgreSQL database to connect to.
POSTGRES_DB=

# The username used to authenticate with the PostgreSQL database server.
POSTGRES_USER=

# The password used to authenticate with the PostgreSQL database server.  Ensure this is stored securely and not exposed in version control.
POSTGRES_PASSWORD=

# Security Note:
# 1. Never commit this .env file to version control
# 2. Consider using a secrets management service in production
# 3. Rotate credentials regularly
```

## Intialize the FDM Instance
Once the schema is in place, you can initialize an instance of fdm-core to start interacting with your FDM data.

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fdmSchema as schema, syncCatalogues } from '@svenvw/fdm-core'

// Get credentials to connect to db
const host = process.env.POSTGRES_HOST ?? 
  (() => { throw new Error('POSTGRES_HOST environment variable is required') })()
const port = Number(process.env.POSTGRES_PORT) || 
  (() => { throw new Error('POSTGRES_PORT environment variable is required') })()
const user = process.env.POSTGRES_USER ?? 
  (() => { throw new Error('POSTGRES_USER environment variable is required') })()
const password = process.env.POSTGRES_PASSWORD ?? 
  (() => { throw new Error('POSTGRES_PASSWORD environment variable is required') })()
const database = process.env.POSTGRES_DB ?? 
  (() => { throw new Error('POSTGRES_DB environment variable is required') })()
const migrationsFolderPath = 'node_modules/@svenvw/fdm-core/dist/db/migrations'

// initialize FDM instance

export const fdm = await (async () => {
  try {
    const db = drizzle({
      connection : {
        user : user,
        password : password,
        host : host,
        port : port,
        database : database
      },
      logger: false,
      schema: schema
    });
    
    console.log('Successfully connected to database');
    return db;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
})();

// Apply database migration if needed
await migrate(fdm, { migrationsFolder: migrationsFolderPath, migrationsSchema: 'fdm-migrations' })

// Sync catalogues
const fdm = drizzle(client, {
    mode: "postgres",
    logger: false,
    schema: schema,
})
await syncCatalogues(fdm).catch((error) =>
    console.error("Error in syncing catalogues 🚨:", error),
)

```

The fdm object now provides access to all the functionality offered by `fdm-core`, enabling you to create farms, add fields, manage cultivations, and more. Consult the specific documentation for each function to understand its usage and parameters.

In the next page you will create your first farm.
