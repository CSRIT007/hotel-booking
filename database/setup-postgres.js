#!/usr/bin/env node
/**
 * Create hotel_booking database and run PostgreSQL schema.
 * Requires: PostgreSQL running, and connection env vars (or defaults).
 *
 * Usage:
 *   cd database && npm install && npm run create
 *
 * Env (optional): PGHOST, PGPORT, PGUSER, PGPASSWORD
 * Default: localhost, 5432, current OS user, no password, database hotel_booking
 */

import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DB_NAME = process.env.PGDATABASE || 'hotel_booking'

const defaultConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || process.env.USER || 'postgres',
  password: process.env.PGPASSWORD || undefined,
  database: 'postgres', // connect to default DB first to create hotel_booking
}

async function createDatabaseIfNeeded(client) {
  const res = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [DB_NAME]
  )
  if (res.rows.length === 0) {
    await client.query(`CREATE DATABASE ${DB_NAME}`)
    console.log(`Created database: ${DB_NAME}`)
  } else {
    console.log(`Database already exists: ${DB_NAME}`)
  }
}

async function runSchema(client) {
  const schemaPath = join(__dirname, 'postgresql-schema.sql')
  const schema = readFileSync(schemaPath, 'utf8')
  await client.query(schema)
  console.log('Schema and base sample data applied.')

  const samplePath = join(__dirname, 'sample-data-postgres.sql')
  const sample = readFileSync(samplePath, 'utf8')
  await client.query(sample)
  console.log('Extra sample data (users, bookings, contacts, etc.) applied.')
}

async function main() {
  const client = new pg.Client(defaultConfig)
  try {
    await client.connect()
    await createDatabaseIfNeeded(client)
    await client.end()
  } catch (e) {
    console.error('Could not connect to PostgreSQL:', e.message || e)
    console.error('Make sure PostgreSQL is running (e.g. brew services start postgresql@14) and PGHOST/PGPORT/PGUSER are correct.')
    process.exit(1)
  }

  const appClient = new pg.Client({
    ...defaultConfig,
    database: DB_NAME,
  })
  try {
    await appClient.connect()
    await runSchema(appClient)
    await appClient.end()
    console.log('Done.')
  } catch (e) {
    console.error('Schema error:', e.message)
    process.exit(1)
  }
}

main()
