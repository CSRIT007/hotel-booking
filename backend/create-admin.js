/**
 * Create an admin (staff) user in the database.
 * Usage: node create-admin.js [username] [password]
 * Or: ADMIN_USER=Admin ADMIN_PASS=yourpassword node create-admin.js
 *
 * Uses same .env as the API (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE).
 */
import pg from 'pg'
import bcrypt from 'bcrypt'
import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '.env')
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  })
}

const pool = new pg.Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || process.env.USER,
  password: process.env.PGPASSWORD || undefined,
  database: process.env.PGDATABASE || 'hotel_booking',
})

const username = process.env.ADMIN_USER || process.argv[2] || 'Admin'
const password = process.env.ADMIN_PASS || process.argv[3] || 'admin123'

async function main() {
  if (!password || password.length < 6) {
    console.error('Password must be at least 6 characters. Use: node create-admin.js Admin yourpassword')
    process.exit(1)
  }
  const hash = await bcrypt.hash(password, 10)
  try {
    const exist = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, `${username.toLowerCase()}@hotel.local`])
    if (exist.rows.length) {
      await pool.query("UPDATE users SET password = $1, role = 'staff' WHERE id = $2", [hash, exist.rows[0].id])
      console.log(`Updated user "${username}" to staff role.`)
    } else {
      await pool.query(
        "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, 'staff')",
        [username, `${username.toLowerCase()}@hotel.local`, hash]
      )
      console.log(`Admin user created: username "${username}". Use this to log in at /admin/login`)
    }
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
