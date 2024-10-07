// import { access, constants } from 'node:fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { buildSchema } from 'drizzle-graphql';
import postgres from 'postgres';
import * as schema from './db/schema';
import { farms } from './db/schema';

import fastify, { FastifyReply, FastifyRequest } from 'fastify'
import { createYoga } from 'graphql-yoga'

export class fdmServer {
  /**
* Class of fdmServer to interact with the Farm Data Model
* @param host  -
* @param port - 
* @param user - 
* @param password - 
* @param database - 
* @returns A fdm class with the functions to interact with the data
* @public
*/

  client: ReturnType<typeof postgres>
  db: ReturnType<typeof drizzle>

  constructor(host: string, port: number, user: string, password: string, database: string) {

    // Create a client
    this.client = postgres({
      host: host,
      port: port,
      user: user,
      password: password,
      database: database,
      max: 1,
    })

    // Create the db instance
    this.db = drizzle(this.client, { schema })

  }

  // Migrate the databe to the latest version
  async migrateDatabase() {

    // This will run migrations on the database, skipping the ones already applied
    await migrate(this.db, { migrationsFolder: 'src/db/migrations', migrationsSchema: 'fdm-migrations' });

  }

  /**
   * Returns the GraphQL schema for the Farm Data Model
   * 
   * @param farmData - An object containing the data for the new farm.
   * @returns A Promise that resolves when the farm has been added.
   */
  public getGraphQlSchema() {
    const { schema } = buildSchema(this.db)

    return schema
  }

  public createGraphQlServer(logger: boolean) {

    // Collect the schema
    const schema = this.getGraphQlSchema()

    // Start a fastify instance
    const app = fastify({ logger: logger })
    const yoga = createYoga<{
      req: FastifyRequest
      reply: FastifyReply
    }>({
      // Integrate Fastify logger
      logging: {
        debug: (...args) => args.forEach(arg => app.log.debug(arg)),
        info: (...args) => args.forEach(arg => app.log.info(arg)),
        warn: (...args) => args.forEach(arg => app.log.warn(arg)),
        error: (...args) => args.forEach(arg => app.log.error(arg))
      },
      schema: schema,
    })

    app.route({
      // Bind to the Yoga's endpoint to avoid rendering on any path
      url: '/graphql',
      method: ['GET', 'POST', 'OPTIONS'],
      handler: async (req, reply) => {
        // Second parameter adds Fastify's `req` and `reply` to the GraphQL Context
        const response = await yoga.handleNodeRequestAndResponse(req, reply, {
          req,
          reply
        })
        response.headers.forEach((value, key) => {
          reply.header(key, value)
        })

        reply.status(response.status)

        reply.send(response.body)

        return reply
      }
    })
    
    // This will allow Fastify to forward multipart requests to GraphQL Yoga
    app.addContentTypeParser('multipart/form-data', {}, (_req, _payload, done) => done(null))

    return app
  }

  /**
  * Adds a new farm to the 'farms' table.
  * 
  * @param farmData - An object containing the data for the new farm.
  * @returns A Promise that resolves when the farm has been added.
  */
  public async addFarm(farmData: schema.farmsTypeInsert): Promise<void> {
    await this.db.insert(farms).values(farmData);
  }
}