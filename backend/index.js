/**
 * Hotel Booking API — Node + Express + PostgreSQL (pg)
 * Auth (login/register) and data (hotels, rooms, bookings, testimonials, services, contacts).
 *
 * Env: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE (default: hotel_booking), PORT (default: 3001)
 * Run: cd api-server && npm install && npm start
 */
import express from 'express'
import pg from 'pg'
import bcrypt from 'bcrypt'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env
const envPath = join(__dirname, '.env')
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  })
}

const PORT = parseInt(process.env.PORT || '3001', 10)
const pool = new pg.Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || process.env.USER,
  password: process.env.PGPASSWORD || undefined,
  database: process.env.PGDATABASE || 'hotel_booking',
})

const app = express()
app.use(express.json())
app.use((_req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  next()
})
app.options('*', (_req, res) => res.sendStatus(204))

function ensureImagePath(path) {
  if (!path || typeof path !== 'string') return path
  if (path.startsWith('http')) return path
  return path.startsWith('/') ? path : `/${path}`
}

// ----- Auth -----
app.post('/api/auth/login', async (req, res) => {
  try {
    const { login: loginId, password } = req.body || {}
    if (!loginId || !password) {
      return res.status(400).json({ error: 'Please fill in all fields.' })
    }
    const r = await pool.query(
      'SELECT id, username, email, password, role FROM users WHERE email = $1 OR username = $2 LIMIT 1',
      [loginId, loginId]
    )
    const user = r.rows[0]
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email/username or password.' })
    }
    let passwordOk = false
    try {
      passwordOk = await bcrypt.compare(password, user.password)
    } catch (_) {
      // e.g. invalid hash in DB (wrong format)
      return res.status(401).json({ error: 'Invalid email/username or password.' })
    }
    if (!passwordOk) {
      return res.status(401).json({ error: 'Invalid email/username or password.' })
    }
    res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role || 'guest' } })
  } catch (e) {
    console.error('Login error:', e.message)
    const isDbError = e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND' || e.code === '42P01' || e.code === '28P01'
    const message = isDbError
      ? 'Database unreachable. Start PostgreSQL and ensure the API .env (PGHOST, PGDATABASE, PGUSER) is correct.'
      : (e.message || 'Login failed.')
    res.status(500).json({ error: message })
  }
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body || {}
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please fill in all fields.' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' })
    }
    const exist = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1', [email, username])
    if (exist.rows.length) {
      const u = exist.rows[0]
      const isEmail = await pool.query('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [email])
      return res.status(400).json({ error: isEmail.rows.length ? 'Email already registered.' : 'Username already taken.' })
    }
    const hash = await bcrypt.hash(password, 10)
    const ins = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hash, 'guest']
    )
    const u = ins.rows[0]
    res.json({ user: { id: u.id, username: u.username, email: u.email, role: u.role || 'guest' } })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Registration failed' })
  }
})

// ----- Data -----
app.get('/api/hotels', async (_req, res) => {
  try {
    const r = await pool.query('SELECT id, name, description, location, image FROM hotels ORDER BY id')
    const list = r.rows.map((row) => ({ ...row, image: ensureImagePath(row.image) }))
    res.json(list)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/rooms', async (req, res) => {
  try {
    const hotelId = req.query.hotel_id || req.query.hotel
    const statusFilter = req.query.status
    const conditions = []
    const params = []
    let idx = 1
    if (hotelId) {
      conditions.push(`r.hotel_id = $${idx}`)
      params.push(hotelId)
      idx++
    }
    if (statusFilter) {
      conditions.push(`r.status = $${idx}`)
      params.push(statusFilter)
      idx++
    }
    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''
    const query = 'SELECT r.*, h.name AS hotel_name FROM rooms r JOIN hotels h ON r.hotel_id = h.id' + where + ' ORDER BY r.id'
    const r = await pool.query(query, params)
    const list = r.rows.map((row) => ({ ...row, image: ensureImagePath(row.image) }))
    res.json(list)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/rooms/:id', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT r.*, h.name AS hotel_name FROM rooms r JOIN hotels h ON r.hotel_id = h.id WHERE r.id = $1 LIMIT 1',
      [req.params.id]
    )
    const row = r.rows[0]
    if (!row) return res.status(404).json({ error: 'Room not found' })
    res.json({ ...row, image: ensureImagePath(row.image) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Debug: verify which DB the API uses (same as admin bookings)
app.get('/api/db-info', async (_req, res) => {
  try {
    const dbName = process.env.PGDATABASE || 'hotel_booking'
    const r = await pool.query('SELECT COUNT(*) AS count FROM bookings')
    res.json({ database: dbName, bookingsCount: parseInt(r.rows[0].count, 10) })
  } catch (e) {
    res.status(500).json({ database: process.env.PGDATABASE || 'hotel_booking', error: e.message })
  }
})

app.get('/api/bookings', async (req, res) => {
  try {
    const userId = req.query.user_id
    if (userId) {
      const r = await pool.query(
        'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      )
      return res.json(r.rows)
    }
    // Admin: all bookings with user and room info
    const r = await pool.query(
      `SELECT b.*, u.username, u.email,
        r.name AS room_name, r.price AS room_price,
        h.name AS hotel_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN rooms r ON b.room_id = r.id
       JOIN hotels h ON r.hotel_id = h.id
       ORDER BY b.created_at DESC`
    )
    res.json(r.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/bookings/:id', async (req, res) => {
  try {
    const { status } = req.body || {}
    if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' })
    }
    const r = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'Booking not found' })
    res.json(r.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/bookings', async (req, res) => {
  try {
    const { user_id, room_id, check_in, check_out, guests, total_price, status } = req.body || {}
    if (!user_id || !room_id || !check_in || !check_out || total_price == null) {
      return res.status(400).json({ error: 'Missing required booking fields.' })
    }
    const r = await pool.query(
      `INSERT INTO bookings (user_id, room_id, check_in, check_out, guests, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user_id, room_id, check_in, check_out, guests || 1, total_price, status || 'pending']
    )
    res.status(201).json(r.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message || 'Booking failed' })
  }
})

app.get('/api/testimonials', async (_req, res) => {
  try {
    const r = await pool.query('SELECT id, name, position, message, image, rating FROM testimonials WHERE status = $1 ORDER BY id', ['active'])
    const list = r.rows.map((row) => ({ ...row, image: ensureImagePath(row.image) }))
    res.json(list)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/services', async (_req, res) => {
  try {
    const r = await pool.query('SELECT id, name, description, icon, image, status FROM services WHERE status = $1 ORDER BY id', ['active'])
    const list = r.rows.map((row) => ({ ...row, image: ensureImagePath(row.image) }))
    res.json(list)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/users', async (req, res) => {
  try {
    const role = req.query.role
    let query = 'SELECT id, username, email, role, created_at FROM users WHERE 1=1'
    const params = []
    if (role) {
      params.push(role)
      query += ` AND role = $${params.length}`
    }
    query += ' ORDER BY id'
    const r = await pool.query(query, params)
    res.json(r.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/contacts', async (_req, res) => {
  try {
    const r = await pool.query('SELECT id, name, email, subject, message, status, created_at FROM contacts ORDER BY created_at DESC')
    res.json(r.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/contacts/:id', async (req, res) => {
  try {
    const { status } = req.body || {}
    if (!status || !['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' })
    }
    const r = await pool.query('UPDATE contacts SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id])
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json(r.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {}
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required.' })
    }
    const r = await pool.query(
      'INSERT INTO contacts (name, email, subject, message, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, subject, message, status',
      [name, email, subject || '', message, 'new']
    )
    res.status(201).json(r.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to send message' })
  }
})

// POS Products (admin)
app.get('/api/pos-products', async (_req, res) => {
  try {
    const r = await pool.query('SELECT id, name, category, price, stock, status, created_at FROM pos_products ORDER BY id')
    res.json(r.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POS Transactions (admin — used by POS Sales & POS Transactions pages)
app.get('/api/pos-transactions', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT t.id,
              t.product_id,
              p.name AS product_name,
              p.category,
              t.quantity,
              t.total_amount,
              t.payment_method,
              t.status,
              t.created_at
       FROM pos_transactions t
       JOIN pos_products p ON t.product_id = p.id
       ORDER BY t.created_at DESC, t.id DESC`
    )
    res.json(r.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/pos-transactions', async (req, res) => {
  try {
    const { product_id, quantity, payment_method, status } = req.body || {}
    const qty = parseInt(quantity, 10)
    if (!product_id || !qty || qty <= 0 || !payment_method) {
      return res.status(400).json({ error: 'product_id, quantity and payment_method are required.' })
    }

    const prod = await pool.query('SELECT price FROM pos_products WHERE id = $1', [product_id])
    if (!prod.rows[0]) {
      return res.status(400).json({ error: 'Product not found.' })
    }
    const price = Number(prod.rows[0].price || 0)
    const total = price * qty
    const txStatus = status || 'paid'

    const inserted = await pool.query(
      `INSERT INTO pos_transactions (product_id, quantity, total_amount, payment_method, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [product_id, qty, total, payment_method, txStatus]
    )

    // Decrease stock but never below zero
    await pool.query('UPDATE pos_products SET stock = GREATEST(0, stock - $1) WHERE id = $2', [qty, product_id])

    const row = await pool.query(
      `SELECT t.id,
              t.product_id,
              p.name AS product_name,
              p.category,
              t.quantity,
              t.total_amount,
              t.payment_method,
              t.status,
              t.created_at
       FROM pos_transactions t
       JOIN pos_products p ON t.product_id = p.id
       WHERE t.id = $1`,
      [inserted.rows[0].id]
    )

    res.status(201).json(row.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to create POS transaction' })
  }
})

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

pool.query('SELECT 1').then(() => {
  app.listen(PORT, () => {
    console.log(`Hotel Booking API (Node + pg) at http://localhost:${PORT}`)
    console.log(`  PostgreSQL: ${process.env.PGDATABASE || 'hotel_booking'}`)
  })
}).catch((e) => {
  console.error('PostgreSQL connection failed:', e.message)
  console.error('Start PostgreSQL (e.g. brew services start postgresql@16) and set PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE if needed.')
  process.exit(1)
})
