import { drizzle } from 'drizzle-orm/postgres-js'
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// Initialize fdmAuth instance
// Get credentials to connect to db
const host = process.env.POSTGRES_HOST ??
  (() => { throw new Error('POSTGRES_HOST environment variable is required') })()
const port = Number(process.env.POSTGRES_PORT) ||
  (() => { throw new Error('POSTGRES_PORT environment variable is required') })()
const user = process.env.POSTGRES_USER ??
  (() => { throw new Error('POSTGRES_USER environment variable is required') })()
const password = process.env.POSTGRES_PASSWORD ??
  (() => { throw new Error('POSTGRES_PASSWORD environment variable is required') })()
const databaseAuth = process.env.POSTGRES_DB_AUTH ??
  (() => { throw new Error('POSTGRES_DB_AUTH environment variable is required') })()

export const fdmAuth = drizzle({
  connection: {
    user: user,
    password: password,
    host: host,
    port: port,
    database: databaseAuth
  },
  logger: false,
})

// Initialize better-auth instance
export const auth = betterAuth({
  database: drizzleAdapter(fdmAuth, {
    provider: "pg",
  }),
  user: {
    additionalFields: {
      firstname: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      surname: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      lang: {
        type: "string",
        required: true,
        defaultValue: "nl-NL",
      }
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});