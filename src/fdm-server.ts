// import { access, constants } from 'node:fs';
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { buildSchema } from 'drizzle-graphql'
import postgres from 'postgres'
import * as schema from './db/schema'

import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { createYoga } from 'graphql-yoga'
import { nanoid } from 'nanoid'
import { GraphQLSchema } from 'graphql'

import { getFieldType } from './fdm-server.d'

export class FdmServer {
  /**
* Class of FdmServer to interact with the Farm Data Model.
* @param host  - host of the postgres server.
* @param port - port of the postgres server.
* @param user - username to connect to the postgres database.
* @param password - password to connect to the postgres database.
* @param database - database to connect to the postgres database.
* @returns A FdmServer class with functions to interact with the Farm Data Model.
* @alpha
*/

  client: ReturnType<typeof postgres>
  db: ReturnType<typeof drizzle>

  constructor (host: string, port: number, user: string, password: string, database: string) {
    // Create a client
    this.client = postgres({
      host,
      port,
      user,
      password,
      database,
      max: 1
    })

    // Create the db instance
    this.db = drizzle(this.client, { schema })
  }

  // Migrate the databe to the latest version
  async migrateDatabase (): Promise<void> {
    // This will run migrations on the database, skipping the ones already applied
    await migrate(this.db, { migrationsFolder: 'src/db/migrations', migrationsSchema: 'fdm-migrations' })
  }

  /**
   * Get the GraphQL schema for the Farm Data Model
   *
   * @returns A GraphQL schema for the Farm Data Model
   * @experimental
   */
  public getGraphQlSchema (): GraphQLSchema {
    const { schema } = buildSchema(this.db)

    return schema
  }

  /**
   * Create a FastifyInstance with GraphQL endpoint.
   *
   * @returns A FastifyInstance with GraphQL endpoint. Use .listen(PORT) to start the instance.
   * @experimental
   */
  public createGraphQlServer (logger: boolean): FastifyInstance {
    // Collect the schema
    const schema = this.getGraphQlSchema()

    // Start a fastify instance
    const app = fastify({ logger })
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
      schema
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
        response.headers.forEach(async (value, key) => {
          await reply.header(key, value)
        })

        await reply.status(response.status)

        await reply.send(response.body)

        return await reply
      }
    })

    // This will allow Fastify to forward multipart requests to GraphQL Yoga
    app.addContentTypeParser('multipart/form-data', {}, (_req, _payload, done) => done(null))

    return app
  }

  /**
  * Add a new farm.
  *
  * @param b_name_farm - Name of the farm
  * @param b_sector - Sector(s) for which the farm is active
  * @returns A Promise that resolves when the farm has been added and returns the value for b_id_farm
  * @alpha
  */
  public async addFarm (b_name_farm: schema.farmsTypeInsert['b_name_farm'], b_sector: schema.farmsTypeInsert['b_sector']): Promise<schema.farmsTypeInsert['b_id_farm']> {
    // Generate an ID for the farm
    const b_id_farm = nanoid()

    // Insert the farm in the dab
    const farmData = {
      b_id_farm,
      b_name_farm,
      b_sector
    }
    await this.db
      .insert(schema.farms)
      .values(farmData)

    return b_id_farm
  }

  /**
  * Get the details of a specific farm.
  *
  * @param b_id_farm - The id of the farm to be requested.
  * @returns A Promise that resolves with an object that contains the details of a farm.
  * @alpha
  */
  public async getFarm (b_id_farm: schema.farmsTypeInsert['b_id_farm']): Promise<schema.farmsTypeSelect> {
    const farm = await this.db
      .select()
      .from(schema.farms)
      .where(eq(schema.farms.b_id_farm, b_id_farm))
      .limit(1)

    return farm[0]
  }

  /**
  * Update the details of a farm.
  *
  * @param b_id_farm - The id of the farm to be updated.
  * @param b_name_farm - The new value for the name of the farm.
  * @param b_sector - The new list of sectors for which this farm is active.
  * @returns A Promise that resolves with an object that contains the details of a farm.
  * @alpha
  */
  public async updateFarm (b_id_farm: schema.farmsTypeInsert['b_id_farm'], b_name_farm: schema.farmsTypeInsert['b_name_farm'], b_sector: schema.farmsTypeInsert['b_sector']): Promise<schema.farmsTypeSelect> {
    const updatedFarm = await this.db
      .update(schema.farms)
      .set({
        b_name_farm,
        b_sector,
        updated: new Date()
      })
      .where(eq(schema.farms.b_id_farm, b_id_farm))
      .returning({
        b_id_farm: schema.farms.b_id_farm,
        b_name_farm: schema.farms.b_name_farm,
        b_sector: schema.farms.b_sector,
        created: schema.farms.created,
        updated: schema.farms.updated
      })

    return updatedFarm[0]
  }

  /**
   * Add a new field
   *
   * @param b_id_farm - ID of the farm.
   * @param b_name - Name of the field.
   * @param b_manage_start - Start date of managing field.
   * @param b_manage_end - End date of managing field.
   * @param b_manage_type - Type of managing field.
   * @returns A Promise that resolves when the field has been added and returns the value for b_id.
   * @alpha
   */
  public async addField (b_id_farm: schema.farmManagingTypeInsert['b_id_farm'],
    b_name: schema.fieldsTypeInsert['b_name'], b_manage_start: schema.farmManagingTypeInsert['b_manage_start'], b_manage_end: schema.farmManagingTypeInsert['b_manage_end'], b_manage_type: schema.farmManagingTypeInsert['b_manage_type']): Promise<schema.fieldsTypeInsert['b_id']> {
    // Generate an ID for the field
    const b_id = nanoid()

    // Insert field
    const fieldData = {
      b_id,
      b_name
    }
    await this.db
      .insert(schema.fields)
      .values(fieldData)

    // Insert relation between farm and field
    const farmManagingData = {
      b_id,
      b_id_farm,
      b_manage_start,
      b_manage_end,
      b_manage_type
    }
    await this.db
      .insert(schema.farmManaging)
      .values(farmManagingData)

    return b_id
  }

  /**
  * Get the details of a specific field.
  *
  * @param b_id - The id of the field to be requested.
  * @returns A Promise that resolves with an object that contains the details of a field.
  * @alpha
  */
  public async getField (b_id: schema.fieldsTypeSelect['b_id']): Promise<getFieldType> {
    // Get properties of the requested field
    const field = await this.db
      .select({
        b_id: schema.fields.b_id,
        b_name: schema.fields.b_name,
        b_id_farm: schema.farmManaging.b_id_farm,
        b_manage_start: schema.farmManaging.b_manage_start,
        b_manage_end: schema.farmManaging.b_manage_end,
        b_manage_type: schema.farmManaging.b_manage_type,
        created: schema.fields.created,
        updated: schema.fields.updated
      })
      .from(schema.fields)
      .innerJoin(schema.farmManaging, eq(schema.fields.b_id, schema.farmManaging.b_id))
      .where(eq(schema.fields.b_id, b_id))
      .limit(1)

    return field[0]
  }
}
