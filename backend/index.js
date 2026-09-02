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
import { readFileSync, existsSync, mkdirSync } from 'fs'
import crypto from 'crypto'
import multer from 'multer'

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
app.set('trust proxy', true)
app.use(express.json({ limit: '2mb' }))
app.use((_req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-User-Id, X-User-Name, X-User-Role')
  next()
})
app.options('*', (_req, res) => res.sendStatus(204))

const uploadsDir = join(__dirname, 'uploads')
mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }[file.mimetype] || '.jpg'
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`)
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true)
    else cb(new Error('Use a JPG, PNG, WebP, or GIF photo.'))
  },
})

function ensureImagePath(path) {
  if (!path || typeof path !== 'string') return path
  if (path.startsWith('http')) return path
  return path.startsWith('/') ? path : `/${path}`
}

function normalizeGallery(value) {
  if (!value) return []
  let list = value
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list)
    } catch {
      return []
    }
  }
  if (!Array.isArray(list)) return []
  return [...new Set(list.map(ensureImagePath).filter(Boolean))]
}

function withMedia(row) {
  if (!row) return row
  return { ...row, image: ensureImagePath(row.image), images: normalizeGallery(row.images) }
}

async function ensureGalleryColumns() {
  await pool.query(`ALTER TABLE hotels ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb`)
  await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb`)
}

function normalizeIp(value) {
  if (!value) return null
  let ip = String(value).trim()
  if (ip.startsWith('::ffff:')) ip = ip.slice(7)
  if (ip === '::1') ip = '127.0.0.1'
  return ip.slice(0, 45) || null
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return normalizeIp(forwarded.split(',')[0])
  }
  const real = req.headers['x-real-ip']
  if (typeof real === 'string' && real.trim()) return normalizeIp(real)
  return normalizeIp(req.ip || req.socket?.remoteAddress)
}

function clientUserAgent(req) {
  return String(req.get('user-agent') || '').slice(0, 255) || null
}

function describeDevice(ua) {
  if (!ua) return 'Unknown device'
  const text = String(ua)
  const browser = /Edg\//.test(text)
    ? 'Edge'
    : /OPR\/|Opera/.test(text)
      ? 'Opera'
      : /Chrome\//.test(text)
        ? 'Chrome'
        : /Firefox\//.test(text)
          ? 'Firefox'
          : /Safari\//.test(text)
            ? 'Safari'
            : 'Browser'
  const os = /Windows NT/.test(text)
    ? 'Windows'
    : /Mac OS X|Macintosh/.test(text)
      ? 'macOS'
      : /Android/.test(text)
        ? 'Android'
        : /iPhone|iPad|iPod/.test(text)
          ? 'iOS'
          : /Linux/.test(text)
            ? 'Linux'
            : 'Unknown OS'
  const kind = /Mobile|Android|iPhone|iPad|iPod/.test(text) ? 'phone/tablet' : 'computer'
  return `${browser} on ${os} · ${kind}`
}

function actorFromReq(req, fallback = {}) {
  const id = parseInt(req.get('x-user-id') || fallback.id || 0, 10) || null
  const name = String(req.get('x-user-name') || fallback.name || 'Guest').slice(0, 100)
  const role = String(req.get('x-user-role') || fallback.role || 'guest').slice(0, 20)
  return { id, name, role, ip: clientIp(req), userAgent: clientUserAgent(req) }
}

function requireStaff(req, res) {
  if (String(req.get('x-user-role') || '') !== 'staff') {
    res.status(403).json({ error: 'Staff access required.' })
    return false
  }
  return true
}

const PASSWORD_MIN = 8
const LOGIN_FAIL_LIMIT = 5
const LOCKOUT_MINUTES = 15

function isPasswordStrong(password) {
  return typeof password === 'string' && password.length >= PASSWORD_MIN
}

async function writeAudit(req, { action, entity, entityId = null, summary, details = null, actor = null }) {
  try {
    const fromReq = actorFromReq(req)
    const a = actor || fromReq
    await pool.query(
      `INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, entity, entity_id, summary, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        a.id ?? fromReq.id,
        a.name || fromReq.name,
        a.role || fromReq.role,
        action,
        entity,
        entityId,
        summary,
        details ? JSON.stringify(details) : null,
        a.ip || fromReq.ip,
        a.userAgent || fromReq.userAgent,
      ]
    )
  } catch (e) {
    console.warn('Audit log skipped:', e.message)
  }
}

// ----- Auth -----
app.post('/api/auth/login', async (req, res) => {
  try {
    const { login: loginId, password } = req.body || {}
    if (!loginId || !password) {
      return res.status(400).json({ error: 'Please fill in all fields.' })
    }
    const r = await pool.query(
      `SELECT id, username, email, password, role,
              COALESCE(status, 'active') AS status,
              COALESCE(failed_login_count, 0) AS failed_login_count,
              locked_until, last_login_at
       FROM users WHERE email = $1 OR username = $2 LIMIT 1`,
      [loginId, loginId]
    )
    const user = r.rows[0]
    if (!user || !user.password) {
      await writeAudit(req, {
        action: 'login_failed',
        entity: 'user',
        summary: `Failed login for ${loginId}`,
        actor: { id: null, name: String(loginId).slice(0, 100), role: 'guest', ip: actorFromReq(req).ip },
      })
      return res.status(401).json({ error: 'Invalid email/username or password.' })
    }
    if (user.status === 'disabled') {
      await writeAudit(req, {
        action: 'login_blocked',
        entity: 'user',
        entityId: user.id,
        summary: `Disabled account ${user.username} tried to sign in`,
      })
      return res.status(403).json({ error: 'This account is disabled. Contact an administrator.' })
    }
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({
        error: `Account locked after too many failed sign-ins. Try again after ${new Date(user.locked_until).toLocaleTimeString()}.`,
      })
    }
    let passwordOk = false
    try {
      passwordOk = await bcrypt.compare(password, user.password)
    } catch (_) {
      return res.status(401).json({ error: 'Invalid email/username or password.' })
    }
    if (!passwordOk) {
      const fails = Number(user.failed_login_count || 0) + 1
      const lock = fails >= LOGIN_FAIL_LIMIT
      await pool.query(
        `UPDATE users
         SET failed_login_count = $1,
             locked_until = CASE WHEN $2 THEN NOW() + ($3::int * INTERVAL '1 minute') ELSE locked_until END
         WHERE id = $4`,
        [fails, lock, LOCKOUT_MINUTES, user.id]
      )
      await writeAudit(req, {
        action: 'login_failed',
        entity: 'user',
        entityId: user.id,
        summary: lock
          ? `${user.username} locked after ${fails} failed sign-ins`
          : `Failed login for ${user.username} (${fails}/${LOGIN_FAIL_LIMIT})`,
        actor: { id: null, name: user.username, role: user.role || 'guest', ip: actorFromReq(req).ip },
      })
      return res.status(401).json({
        error: lock
          ? `Too many failed sign-ins. Account locked for ${LOCKOUT_MINUTES} minutes.`
          : 'Invalid email/username or password.',
      })
    }
    await pool.query(
      'UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1',
      [user.id]
    )
    await writeAudit(req, {
      action: 'login',
      entity: 'user',
      entityId: user.id,
      summary: `${user.username} signed in`,
      actor: { id: user.id, name: user.username, role: user.role || 'guest', ip: actorFromReq(req).ip },
    })
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
    if (!isPasswordStrong(password)) {
      return res.status(400).json({ error: `Password must be at least ${PASSWORD_MIN} characters.` })
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
    await ensureGuestProfile(u.id)
    await writeAudit(req, {
      action: 'register',
      entity: 'user',
      entityId: u.id,
      summary: `${u.username} created a guest account`,
      actor: { id: u.id, name: u.username, role: 'guest', ip: actorFromReq(req).ip },
    })
    res.json({ user: { id: u.id, username: u.username, email: u.email, role: u.role || 'guest' } })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Registration failed' })
  }
})

// ----- Data -----
app.post('/api/upload', (req, res) => {
  if (!requireStaff(req, res)) return
  imageUpload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload failed.' })
    if (!req.file) return res.status(400).json({ error: 'Choose a photo to upload.' })
    res.status(201).json({ url: `/uploads/${req.file.filename}` })
  })
})

app.get('/api/hotels', async (_req, res) => {
  try {
    const r = await pool.query('SELECT id, name, description, location, image, images FROM hotels ORDER BY id')
    res.json(r.rows.map(withMedia))
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
    res.json(r.rows.map(withMedia))
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
    res.json(withMedia(row))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/hotels', async (req, res) => {
  try {
    const { name, description, location, image, images } = req.body || {}
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Property name is required.' })
    if (!location || !String(location).trim()) return res.status(400).json({ error: 'Location is required.' })
    const gallery = JSON.stringify(normalizeGallery(images))
    const r = await pool.query(
      `INSERT INTO hotels (name, description, location, image, images)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [String(name).trim(), description || '', String(location).trim(), image || null, gallery]
    )
    const row = r.rows[0]
    await writeAudit(req, {
      action: 'create',
      entity: 'property',
      entityId: row.id,
      summary: `Added property “${row.name}”`,
    })
    res.status(201).json(withMedia(row))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/hotels/:id', async (req, res) => {
  try {
    const { name, description, location, image, images } = req.body || {}
    const current = await pool.query('SELECT * FROM hotels WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Property not found' })
    const row = current.rows[0]
    const nextName = name != null ? String(name).trim() : row.name
    const nextLocation = location != null ? String(location).trim() : row.location
    if (!nextName) return res.status(400).json({ error: 'Property name is required.' })
    if (!nextLocation) return res.status(400).json({ error: 'Location is required.' })
    const nextImages = images != null ? JSON.stringify(normalizeGallery(images)) : JSON.stringify(normalizeGallery(row.images))
    const r = await pool.query(
      `UPDATE hotels SET name = $1, description = $2, location = $3, image = $4, images = $5 WHERE id = $6 RETURNING *`,
      [nextName, description != null ? description : row.description, nextLocation, image != null ? image : row.image, nextImages, req.params.id]
    )
    await writeAudit(req, {
      action: 'update',
      entity: 'property',
      entityId: r.rows[0].id,
      summary: `Updated property “${r.rows[0].name}”`,
    })
    res.json(withMedia(r.rows[0]))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/hotels/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM hotels WHERE id = $1 RETURNING id, name', [req.params.id])
    if (!r.rows[0]) return res.status(404).json({ error: 'Property not found' })
    await writeAudit(req, {
      action: 'delete',
      entity: 'property',
      entityId: r.rows[0].id,
      summary: `Removed property “${r.rows[0].name}”`,
    })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/rooms', async (req, res) => {
  try {
    const { hotel_id, name, description, price, max_persons, size, view_type, beds, image, images, status } = req.body || {}
    if (!hotel_id) return res.status(400).json({ error: 'Select a property first.' })
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Room name is required.' })
    if (price == null || Number(price) < 0) return res.status(400).json({ error: 'Price is required.' })
    const hotel = await pool.query('SELECT id FROM hotels WHERE id = $1', [hotel_id])
    if (!hotel.rows[0]) return res.status(400).json({ error: 'Property not found. Add a property first.' })
    const roomStatus = ['available', 'booked', 'maintenance'].includes(status) ? status : 'available'
    const gallery = JSON.stringify(normalizeGallery(images))
    const r = await pool.query(
      `INSERT INTO rooms (hotel_id, name, description, price, max_persons, size, view_type, beds, image, status, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        hotel_id,
        String(name).trim(),
        description || '',
        Number(price),
        parseInt(max_persons, 10) || 2,
        size || '',
        view_type || '',
        parseInt(beds, 10) || 1,
        image || null,
        roomStatus,
        gallery,
      ]
    )
    const details = await pool.query(
      'SELECT r.*, h.name AS hotel_name FROM rooms r JOIN hotels h ON r.hotel_id = h.id WHERE r.id = $1',
      [r.rows[0].id]
    )
    const created = details.rows[0]
    await writeAudit(req, {
      action: 'create',
      entity: 'room',
      entityId: created.id,
      summary: `Added room “${created.name}” at ${created.hotel_name}`,
    })
    res.status(201).json(withMedia(created))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/rooms/:id', async (req, res) => {
  try {
    const current = await pool.query('SELECT * FROM rooms WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Room not found' })
    const row = current.rows[0]
    const body = req.body || {}
    const hotelId = body.hotel_id != null ? body.hotel_id : row.hotel_id
    const hotel = await pool.query('SELECT id FROM hotels WHERE id = $1', [hotelId])
    if (!hotel.rows[0]) return res.status(400).json({ error: 'Property not found.' })
    const nextName = body.name != null ? String(body.name).trim() : row.name
    if (!nextName) return res.status(400).json({ error: 'Room name is required.' })
    const nextStatus = body.status && ['available', 'booked', 'maintenance'].includes(body.status) ? body.status : row.status
    const nextImages = body.images != null ? JSON.stringify(normalizeGallery(body.images)) : JSON.stringify(normalizeGallery(row.images))
    const r = await pool.query(
      `UPDATE rooms
       SET hotel_id = $1, name = $2, description = $3, price = $4, max_persons = $5,
           size = $6, view_type = $7, beds = $8, image = $9, status = $10, images = $11
       WHERE id = $12 RETURNING *`,
      [
        hotelId,
        nextName,
        body.description != null ? body.description : row.description,
        body.price != null ? Number(body.price) : row.price,
        body.max_persons != null ? parseInt(body.max_persons, 10) : row.max_persons,
        body.size != null ? body.size : row.size,
        body.view_type != null ? body.view_type : row.view_type,
        body.beds != null ? parseInt(body.beds, 10) : row.beds,
        body.image != null ? body.image : row.image,
        nextStatus,
        nextImages,
        req.params.id,
      ]
    )
    const details = await pool.query(
      'SELECT r.*, h.name AS hotel_name FROM rooms r JOIN hotels h ON r.hotel_id = h.id WHERE r.id = $1',
      [r.rows[0].id]
    )
    const updated = details.rows[0]
    await writeAudit(req, {
      action: 'update',
      entity: 'room',
      entityId: updated.id,
      summary: `Updated room “${updated.name}” (${updated.status})`,
    })
    res.json(withMedia(updated))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING id, name', [req.params.id])
    if (!r.rows[0]) return res.status(404).json({ error: 'Room not found' })
    await writeAudit(req, {
      action: 'delete',
      entity: 'room',
      entityId: r.rows[0].id,
      summary: `Removed room “${r.rows[0].name}”`,
    })
    res.json({ ok: true })
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
        `SELECT b.id, b.user_id, b.room_id,
                to_char(b.check_in, 'YYYY-MM-DD') AS check_in,
                to_char(b.check_out, 'YYYY-MM-DD') AS check_out,
                b.guests, b.total_price, b.status, b.created_at,
                r.name AS room_name, r.image AS room_image,
                h.name AS hotel_name, c.name AS channel_name, c.code AS channel_code
         FROM bookings b
         JOIN rooms r ON b.room_id = r.id
         JOIN hotels h ON r.hotel_id = h.id
         LEFT JOIN crs_channels c ON c.id = b.channel_id
         WHERE b.user_id = $1
         ORDER BY b.created_at DESC`,
        [userId]
      )
      return res.json(r.rows)
    }
    // Admin: all bookings with user and room info
    const r = await pool.query(
      `SELECT b.*, u.username, u.email,
        to_char(b.check_in, 'YYYY-MM-DD') AS check_in,
        to_char(b.check_out, 'YYYY-MM-DD') AS check_out,
        r.name AS room_name, r.price AS room_price,
        h.name AS hotel_name, c.name AS channel_name, c.code AS channel_code
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN rooms r ON b.room_id = r.id
       JOIN hotels h ON r.hotel_id = h.id
       LEFT JOIN crs_channels c ON c.id = b.channel_id
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
    const booking = r.rows[0]

    if (status === 'confirmed' || status === 'cancelled') {
      const details = await pool.query(
        `SELECT r.name AS room_name, h.name AS hotel_name
         FROM rooms r
         JOIN hotels h ON r.hotel_id = h.id
         WHERE r.id = $1`,
        [booking.room_id]
      )
      const roomName = details.rows[0]?.room_name || 'your room'
      const hotelName = details.rows[0]?.hotel_name || ''
      const message =
        status === 'confirmed'
          ? `Your booking for ${roomName}${hotelName ? ` at ${hotelName}` : ''} is confirmed and ready.`
          : `Your booking for ${roomName} has been cancelled.`
      await pool.query(
        `INSERT INTO notifications (user_id, booking_id, type, message, is_read)
         VALUES ($1, $2, $3, $4, 0)`,
        [booking.user_id, booking.id, status, message]
      )
    }

    if (status === 'confirmed') {
      await pool.query("UPDATE rooms SET status = 'booked' WHERE id = $1", [booking.room_id])
    } else if (status === 'completed') {
      await openCheckoutTask(booking.room_id, booking.id)
      await pool.query("UPDATE rooms SET status = 'booked' WHERE id = $1 AND status <> 'maintenance'", [booking.room_id])
      await awardStayPoints(booking)
    } else if (status === 'cancelled') {
      const other = await pool.query(
        `SELECT 1 FROM bookings
         WHERE room_id = $1 AND id <> $2 AND status IN ('confirmed', 'completed')
         LIMIT 1`,
        [booking.room_id, booking.id]
      )
      if (!other.rows.length) {
        await pool.query("UPDATE rooms SET status = 'available' WHERE id = $1 AND status = 'booked'", [booking.room_id])
      }
    }

    await writeAudit(req, {
      action: status,
      entity: 'booking',
      entityId: booking.id,
      summary: `Booking #${booking.id} marked ${status}`,
    })
    res.json(booking)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/bookings', async (req, res) => {
  try {
    const { user_id, room_id, check_in, check_out, guests, status, channel_id } = req.body || {}
    if (!user_id || !room_id || !check_in || !check_out) {
      return res.status(400).json({ error: 'Missing required booking fields.' })
    }
    const quote = await crsQuote(room_id, check_in, check_out)
    if (quote.error) return res.status(400).json({ error: quote.error })
    if (guests && quote.max_persons && Number(guests) > Number(quote.max_persons)) {
      return res.status(400).json({ error: 'Guests exceed room capacity.' })
    }
    let channelId = channel_id ? parseInt(channel_id, 10) : null
    if (channelId) {
      const ch = await pool.query(`SELECT id FROM crs_channels WHERE id = $1 AND status = 'active'`, [channelId])
      if (!ch.rows[0]) return res.status(400).json({ error: 'That booking channel is not active.' })
    } else {
      const direct = await pool.query(`SELECT id FROM crs_channels WHERE code = 'direct' LIMIT 1`)
      channelId = direct.rows[0]?.id || null
    }
    const r = await pool.query(
      `INSERT INTO bookings (user_id, room_id, check_in, check_out, guests, total_price, status, channel_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [user_id, room_id, check_in, check_out, guests || 1, quote.total, status || 'pending', channelId]
    )
    const created = r.rows[0]
    await writeAudit(req, {
      action: 'create',
      entity: 'booking',
      entityId: created.id,
      summary: `Booking request #${created.id}`,
    })
    res.status(201).json(created)
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
  if (!requireStaff(req, res)) return
  try {
    const role = req.query.role
    let query = `SELECT id, username, email, role, created_at,
                        COALESCE(status, 'active') AS status,
                        COALESCE(failed_login_count, 0) AS failed_login_count,
                        locked_until, last_login_at
                 FROM users WHERE 1=1`
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

app.post('/api/users', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const { username, email, password, role } = req.body || {}
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required.' })
    }
    if (!isPasswordStrong(password)) {
      return res.status(400).json({ error: `Password must be at least ${PASSWORD_MIN} characters.` })
    }
    const nextRole = role === 'staff' ? 'staff' : 'guest'
    const exist = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1', [email, username])
    if (exist.rows.length) return res.status(400).json({ error: 'Username or email already exists.' })
    const hash = await bcrypt.hash(password, 10)
    const ins = await pool.query(
      `INSERT INTO users (username, email, password, role, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING id, username, email, role, created_at, status, failed_login_count, locked_until, last_login_at`,
      [String(username).trim(), String(email).trim(), hash, nextRole]
    )
    const row = ins.rows[0]
    await writeAudit(req, {
      action: 'create',
      entity: 'user',
      entityId: row.id,
      summary: `Created ${nextRole} account “${row.username}”`,
    })
    res.status(201).json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/users/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const id = parseInt(req.params.id, 10)
    const actorId = parseInt(req.get('x-user-id') || '0', 10)
    const current = await pool.query(
      `SELECT id, username, email, role, COALESCE(status, 'active') AS status
       FROM users WHERE id = $1`,
      [id]
    )
    if (!current.rows[0]) return res.status(404).json({ error: 'User not found' })
    const row = current.rows[0]
    const nextRole = req.body?.role != null ? req.body.role : row.role
    const nextStatus = req.body?.status != null ? req.body.status : row.status
    if (!['guest', 'staff'].includes(nextRole)) return res.status(400).json({ error: 'Role must be guest or staff.' })
    if (!['active', 'disabled'].includes(nextStatus)) return res.status(400).json({ error: 'Status must be active or disabled.' })
    if (actorId && actorId === id && nextStatus === 'disabled') {
      return res.status(400).json({ error: 'You cannot disable your own account.' })
    }
    if (actorId && actorId === id && nextRole !== 'staff') {
      return res.status(400).json({ error: 'You cannot remove your own staff access.' })
    }
    if (row.role === 'staff' && (nextRole !== 'staff' || nextStatus === 'disabled')) {
      const staffLeft = await pool.query(
        `SELECT COUNT(*) AS count FROM users
         WHERE role = 'staff' AND COALESCE(status, 'active') = 'active' AND id <> $1`,
        [id]
      )
      if (parseInt(staffLeft.rows[0].count, 10) < 1) {
        return res.status(400).json({ error: 'Keep at least one active staff account.' })
      }
    }
    const updated = await pool.query(
      `UPDATE users SET role = $1, status = $2 WHERE id = $3
       RETURNING id, username, email, role, created_at, status, failed_login_count, locked_until, last_login_at`,
      [nextRole, nextStatus, id]
    )
    await writeAudit(req, {
      action: 'update',
      entity: 'user',
      entityId: id,
      summary: `Updated ${updated.rows[0].username} (role ${nextRole}, ${nextStatus})`,
    })
    res.json(updated.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/users/:id/unlock', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const updated = await pool.query(
      `UPDATE users SET failed_login_count = 0, locked_until = NULL, status = COALESCE(status, 'active')
       WHERE id = $1
       RETURNING id, username, email, role, created_at, status, failed_login_count, locked_until, last_login_at`,
      [req.params.id]
    )
    if (!updated.rows[0]) return res.status(404).json({ error: 'User not found' })
    await writeAudit(req, {
      action: 'unlock',
      entity: 'user',
      entityId: updated.rows[0].id,
      summary: `Unlocked account “${updated.rows[0].username}”`,
    })
    res.json(updated.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/users/:id/password', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const password = req.body?.password
    if (!isPasswordStrong(password)) {
      return res.status(400).json({ error: `Password must be at least ${PASSWORD_MIN} characters.` })
    }
    const current = await pool.query('SELECT id, username FROM users WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'User not found' })
    const hash = await bcrypt.hash(password, 10)
    await pool.query('UPDATE users SET password = $1, failed_login_count = 0, locked_until = NULL WHERE id = $2', [hash, req.params.id])
    await writeAudit(req, {
      action: 'password_reset',
      entity: 'user',
      entityId: current.rows[0].id,
      summary: `Reset password for “${current.rows[0].username}”`,
    })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/security/summary', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const [counts, locked, failed] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE role = 'staff') AS staff,
           COUNT(*) FILTER (WHERE role = 'guest') AS guests,
           COUNT(*) FILTER (WHERE COALESCE(status, 'active') = 'disabled') AS disabled,
           COUNT(*) FILTER (WHERE locked_until IS NOT NULL AND locked_until > NOW()) AS locked
         FROM users`
      ),
      pool.query(
        `SELECT id, username, email, role, locked_until, COALESCE(failed_login_count, 0) AS failed_login_count
         FROM users
         WHERE locked_until IS NOT NULL AND locked_until > NOW()
         ORDER BY locked_until DESC`
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM audit_logs
         WHERE action = 'login_failed' AND created_at > NOW() - INTERVAL '24 hours'`
      ),
    ])
    res.json({
      staff: parseInt(counts.rows[0].staff, 10),
      guests: parseInt(counts.rows[0].guests, 10),
      disabled: parseInt(counts.rows[0].disabled, 10),
      locked: parseInt(counts.rows[0].locked, 10),
      failed_logins_24h: parseInt(failed.rows[0].count, 10),
      locked_accounts: locked.rows,
      password_min: PASSWORD_MIN,
      login_fail_limit: LOGIN_FAIL_LIMIT,
      lockout_minutes: LOCKOUT_MINUTES,
    })
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

app.get('/api/staff-alerts', async (_req, res) => {
  try {
    const [messages, bookings, latest] = await Promise.all([
      pool.query("SELECT COUNT(*) AS count FROM contacts WHERE status = 'new'"),
      pool.query("SELECT COUNT(*) AS count FROM bookings WHERE status = 'pending'"),
      pool.query(
        `SELECT id, name, email, subject, created_at
         FROM contacts
         WHERE status = 'new'
         ORDER BY created_at DESC
         LIMIT 1`
      ),
    ])
    res.json({
      new_messages: parseInt(messages.rows[0].count, 10),
      pending_bookings: parseInt(bookings.rows[0].count, 10),
      latest_message: latest.rows[0] || null,
    })
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
    await writeAudit(req, {
      action: 'update',
      entity: 'message',
      entityId: r.rows[0].id,
      summary: `Message from ${r.rows[0].name} marked ${status}`,
    })
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
    await writeAudit(req, {
      action: 'create',
      entity: 'message',
      entityId: r.rows[0].id,
      summary: `New message from ${name}${subject ? `: ${subject}` : ''}`,
      actor: { id: actorFromReq(req).id, name, role: actorFromReq(req).role, ip: actorFromReq(req).ip },
    })
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

    const sale = row.rows[0]
    await writeAudit(req, {
      action: 'create',
      entity: 'pos',
      entityId: sale.id,
      summary: `POS sale ${sale.product_name} × ${sale.quantity} (${formatMoney(sale.total_amount)})`,
    })
    res.status(201).json(sale)
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to create POS transaction' })
  }
})

const EXPENSE_CATEGORIES = ['Utilities', 'Salaries', 'Supplies', 'Marketing', 'Maintenance', 'Food & Beverage', 'Other']
const EXPENSE_PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'other']

async function ensureFinanceTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      description VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'Other',
      amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
      expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
      payment_method VARCHAR(20) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'other')),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)')
  const existing = await pool.query('SELECT 1 FROM expenses LIMIT 1')
  if (!existing.rows.length) {
    await pool.query(
      `INSERT INTO expenses (description, category, amount, expense_date, payment_method)
       VALUES
         ('Electricity bill', 'Utilities', 420.00, CURRENT_DATE - 12, 'bank_transfer'),
         ('Housekeeping supplies', 'Supplies', 85.50, CURRENT_DATE - 8, 'cash'),
         ('Facebook ads', 'Marketing', 120.00, CURRENT_DATE - 3, 'card'),
         ('AC repair — Suite Room', 'Maintenance', 95.00, CURRENT_DATE - 1, 'cash')`
    )
  }
}

function toMoney(n) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

function formatMoney(n) {
  const amount = toMoney(n)
  const abs = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return amount < 0 ? `($${abs})` : `$${abs}`
}

function payrollExpenseMethod(method) {
  if (method === 'cash' || method === 'bank_transfer') return method
  return 'other'
}

async function syncPayrollExpense(payrollId) {
  const r = await pool.query(
    `SELECT p.id, p.net_pay, p.payment_method, p.status,
            to_char(p.payment_date, 'YYYY-MM-DD') AS payment_date,
            to_char(p.period_start, 'YYYY-MM-DD') AS period_start,
            to_char(p.period_end, 'YYYY-MM-DD') AS period_end,
            e.full_name
     FROM hr_payroll p
     JOIN hr_employees e ON e.id = p.employee_id
     WHERE p.id = $1`,
    [payrollId]
  )
  const row = r.rows[0]
  if (!row || row.status !== 'paid') return null
  const description = `Payroll — ${row.full_name} (${row.period_start} to ${row.period_end})`
  const amount = toMoney(row.net_pay)
  const date = row.payment_date || new Date().toISOString().slice(0, 10)
  const method = payrollExpenseMethod(row.payment_method)
  const existing = await pool.query('SELECT id FROM expenses WHERE payroll_id = $1', [payrollId])
  if (existing.rows[0]) {
    await pool.query(
      `UPDATE expenses
       SET description = $1, category = 'Salaries', amount = $2, expense_date = $3, payment_method = $4
       WHERE id = $5`,
      [description, amount, date, method, existing.rows[0].id]
    )
    return existing.rows[0].id
  }
  const ins = await pool.query(
    `INSERT INTO expenses (description, category, amount, expense_date, payment_method, payroll_id)
     VALUES ($1, 'Salaries', $2, $3, $4, $5)
     RETURNING id`,
    [description, amount, date, method, payrollId]
  )
  return ins.rows[0].id
}

async function ensurePayrollExpenseLink() {
  await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payroll_id INT UNIQUE REFERENCES hr_payroll(id) ON DELETE RESTRICT`)
  await pool.query(`DELETE FROM expenses WHERE description = 'Staff wages (week)' AND payroll_id IS NULL`)
  const missing = await pool.query(
    `SELECT p.id
     FROM hr_payroll p
     LEFT JOIN expenses x ON x.payroll_id = p.id
     WHERE p.status = 'paid' AND x.id IS NULL`
  )
  for (const row of missing.rows) {
    await syncPayrollExpense(row.id)
  }
}

function mapExpense(row) {
  if (!row) return row
  const d = row.expense_date
  if (d instanceof Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return { ...row, amount: toMoney(row.amount), expense_date: `${y}-${m}-${day}` }
  }
  if (typeof d === 'string' && d.length >= 10) {
    return { ...row, amount: toMoney(row.amount), expense_date: d.slice(0, 10) }
  }
  return { ...row, amount: toMoney(row.amount) }
}

app.get('/api/expenses', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, description, category, amount,
              to_char(expense_date, 'YYYY-MM-DD') AS expense_date,
              payment_method, payroll_id, created_at
       FROM expenses
       ORDER BY expense_date DESC, id DESC`
    )
    res.json(r.rows.map(mapExpense))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/expenses', async (req, res) => {
  try {
    const { description, category, amount, expense_date, payment_method } = req.body || {}
    const desc = String(description || '').trim()
    const value = Number(amount)
    if (!desc || !Number.isFinite(value) || value < 0) {
      return res.status(400).json({ error: 'description and a valid amount are required.' })
    }
    const cat = EXPENSE_CATEGORIES.includes(category) ? category : (category || 'Other')
    const method = EXPENSE_PAYMENT_METHODS.includes(payment_method) ? payment_method : 'cash'
    const date = expense_date || new Date().toISOString().slice(0, 10)
    const r = await pool.query(
      `INSERT INTO expenses (description, category, amount, expense_date, payment_method)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, description, category, amount,
                 to_char(expense_date, 'YYYY-MM-DD') AS expense_date,
                 payment_method, payroll_id, created_at`,
      [desc, cat, value, date, method]
    )
    const saved = mapExpense(r.rows[0])
    await writeAudit(req, {
      action: 'create',
      entity: 'expense',
      entityId: saved.id,
      summary: `Recorded expense “${saved.description}” (${formatMoney(saved.amount)})`,
    })
    res.status(201).json(saved)
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to create expense' })
  }
})

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const current = await pool.query('SELECT id, description, amount, payroll_id FROM expenses WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Expense not found' })
    if (current.rows[0].payroll_id) {
      return res.status(400).json({ error: 'This expense comes from payroll. Change or keep it on the Payroll page.' })
    }
    const r = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING id, description, amount', [req.params.id])
    if (!r.rows[0]) return res.status(404).json({ error: 'Expense not found' })
    await writeAudit(req, {
      action: 'delete',
      entity: 'expense',
      entityId: r.rows[0].id,
      summary: `Deleted expense “${r.rows[0].description}”`,
    })
    res.json({ ok: true, id: r.rows[0].id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/finance/summary', async (_req, res) => {
  try {
    const [bookings, pos, expenses] = await Promise.all([
      pool.query(`SELECT status, COALESCE(SUM(total_price), 0) AS total, COUNT(*)::int AS count FROM bookings GROUP BY status`),
      pool.query(`SELECT status, COALESCE(SUM(total_amount), 0) AS total, COUNT(*)::int AS count FROM pos_transactions GROUP BY status`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*)::int AS count FROM expenses`),
    ])
    const bookingByStatus = Object.fromEntries(bookings.rows.map((row) => [row.status, { total: toMoney(row.total), count: row.count }]))
    const posByStatus = Object.fromEntries(pos.rows.map((row) => [row.status, { total: toMoney(row.total), count: row.count }]))
    const roomRevenue = toMoney(bookingByStatus.confirmed?.total) + toMoney(bookingByStatus.completed?.total)
    const posRevenue = toMoney(posByStatus.paid?.total)
    const revenue = roomRevenue + posRevenue
    const expenseTotal = toMoney(expenses.rows[0]?.total)
    const profit = revenue - expenseTotal
    res.json({
      roomRevenue,
      posRevenue,
      revenue,
      expenses: expenseTotal,
      profit,
      marginPercent: revenue > 0 ? (profit / revenue) * 100 : 0,
      pendingRevenue: toMoney(bookingByStatus.pending?.total) + toMoney(posByStatus.pending?.total),
      refundedPos: toMoney(posByStatus.refunded?.total),
      counts: {
        confirmedBookings: bookingByStatus.confirmed?.count || 0,
        completedBookings: bookingByStatus.completed?.count || 0,
        pendingBookings: bookingByStatus.pending?.count || 0,
        paidPos: posByStatus.paid?.count || 0,
        expenses: expenses.rows[0]?.count || 0,
      },
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

async function ensureGuestTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL CHECK (type IN ('confirmed', 'cancelled')),
      message TEXT NOT NULL,
      is_read SMALLINT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

async function ensureUserSecurity() {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count INT DEFAULT 0`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ`)
}

async function ensureAuditTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      actor_id INT REFERENCES users(id) ON DELETE SET NULL,
      actor_name VARCHAR(100),
      actor_role VARCHAR(20),
      action VARCHAR(50) NOT NULL,
      entity VARCHAR(50) NOT NULL,
      entity_id INT,
      summary TEXT NOT NULL,
      details JSONB,
      ip_address VARCHAR(45),
      user_agent VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query('ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent VARCHAR(255)')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC)')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity)')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_audit_ip ON audit_logs(ip_address)')
}

app.get('/api/audit-logs', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const entity = req.query.entity
    const action = req.query.action
    const conditions = []
    const params = []
    let idx = 1
    if (entity) {
      conditions.push(`entity = $${idx++}`)
      params.push(entity)
    }
    if (action) {
      conditions.push(`action = $${idx++}`)
      params.push(action)
    }
    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''
    const r = await pool.query(
      `SELECT id, actor_id, actor_name, actor_role, action, entity, entity_id, summary, details, ip_address, user_agent, created_at
       FROM audit_logs
       ${where}
       ORDER BY created_at DESC
       LIMIT 300`,
      params
    )
    res.json(r.rows.map((row) => ({
      ...row,
      ip_address: normalizeIp(row.ip_address),
      device: describeDevice(row.user_agent),
    })))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/notifications', async (req, res) => {
  try {
    const userId = req.query.user_id
    if (!userId) return res.status(400).json({ error: 'user_id is required.' })
    const r = await pool.query(
      `SELECT id, user_id, booking_id, type, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )
    res.json(r.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/notifications/read', async (req, res) => {
  try {
    const userId = req.body?.user_id || req.query.user_id
    if (!userId) return res.status(400).json({ error: 'user_id is required.' })
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = $1 AND is_read = 0', [userId])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const HR_SHIFT_TYPES = ['morning', 'afternoon', 'evening', 'night']
const HR_LEAVE_TYPES = ['vacation', 'sick', 'personal', 'unpaid', 'other']
const DEFAULT_HR_ORG = [
  { name: 'Human Resource', positions: ['Head Department', 'Deputy Department', 'Senior', 'Staff'] },
  { name: 'Operation', positions: ['Head Department', 'Deputy Department', 'Front desk', 'Housekeeping', 'Waiter', 'Maintenance'] },
  { name: 'Finance', positions: ['Head Department', 'Deputy Department', 'Senior Accountant', 'Accountant'] },
  { name: 'Information Technology', positions: ['Head Department', 'Administrator', 'Developer', 'IT support'] },
]

function daysInclusive(start, end) {
  const a = new Date(start)
  const b = new Date(end)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0
  return Math.round((b - a) / 86400000) + 1
}

async function seedHrOrg() {
  const existing = await pool.query('SELECT COUNT(*) AS n FROM hr_departments')
  if (Number(existing.rows[0].n) > 0) return
  for (let i = 0; i < DEFAULT_HR_ORG.length; i++) {
    const dept = DEFAULT_HR_ORG[i]
    const ins = await pool.query(
      'INSERT INTO hr_departments (name, sort_order) VALUES ($1, $2) RETURNING id',
      [dept.name, i + 1]
    )
    for (let j = 0; j < dept.positions.length; j++) {
      await pool.query(
        'INSERT INTO hr_positions (department_id, name, sort_order) VALUES ($1, $2, $3)',
        [ins.rows[0].id, dept.positions[j], j + 1]
      )
    }
  }
}

async function remapLegacyEmployeeOrg() {
  const names = new Set((await pool.query('SELECT name FROM hr_departments')).rows.map((r) => r.name))
  const map = [
    ['Front desk', 'Operation', 'Front desk'],
    ['Housekeeping', 'Operation', 'Housekeeping'],
    ['Food & Beverage', 'Operation', 'Waiter'],
    ['Maintenance', 'Operation', 'Maintenance'],
    ['Management', 'Human Resource', 'Head Department'],
    ['Sales', 'Operation', 'Front desk'],
    ['Accounting', 'Finance', 'Accountant'],
    ['Security', 'Operation', 'Front desk'],
    ['Other', 'Human Resource', 'Staff'],
  ]
  for (const [from, dept, pos] of map) {
    if (names.has(from)) continue
    await pool.query('UPDATE hr_employees SET department = $1, position = $2 WHERE department = $3', [dept, pos, from])
  }
}

async function getOrgTree() {
  const depts = await pool.query('SELECT id, name, sort_order FROM hr_departments ORDER BY sort_order, id')
  const positions = await pool.query(
    'SELECT id, department_id, name, sort_order FROM hr_positions ORDER BY sort_order, id'
  )
  return depts.rows.map((d) => ({
    ...d,
    positions: positions.rows.filter((p) => p.department_id === d.id),
  }))
}

async function resolveDeptPosition(department, position) {
  const deptName = String(department || '').trim()
  const posName = String(position || '').trim()
  if (!deptName || !posName) return { error: 'Department and position are required.' }
  const dept = await pool.query('SELECT id, name FROM hr_departments WHERE name = $1', [deptName])
  if (!dept.rows[0]) return { error: 'Select a valid department.' }
  const pos = await pool.query(
    'SELECT id, name FROM hr_positions WHERE department_id = $1 AND name = $2',
    [dept.rows[0].id, posName]
  )
  if (!pos.rows[0]) return { error: 'Select a valid position for that department.' }
  return { department: dept.rows[0].name, position: pos.rows[0].name }
}

async function ensureHrTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_employees (
      id SERIAL PRIMARY KEY,
      employee_code VARCHAR(20) NOT NULL UNIQUE,
      full_name VARCHAR(120) NOT NULL,
      department VARCHAR(80) NOT NULL DEFAULT 'Operation',
      position VARCHAR(100) NOT NULL,
      phone VARCHAR(30),
      email VARCHAR(120),
      hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
      salary DECIMAL(12, 2) DEFAULT 0,
      salary_type VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (salary_type IN ('hourly', 'monthly', 'annual')),
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query(`ALTER TABLE hr_employees ALTER COLUMN department TYPE VARCHAR(80)`)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_departments (
      id SERIAL PRIMARY KEY,
      name VARCHAR(80) NOT NULL UNIQUE,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_positions (
      id SERIAL PRIMARY KEY,
      department_id INT NOT NULL REFERENCES hr_departments(id) ON DELETE CASCADE,
      name VARCHAR(80) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      UNIQUE (department_id, name)
    )
  `)
  await seedHrOrg()
  await remapLegacyEmployeeOrg()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_schedules (
      id SERIAL PRIMARY KEY,
      employee_id INT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
      shift_date DATE NOT NULL,
      shift_start TIME NOT NULL,
      shift_end TIME NOT NULL,
      shift_type VARCHAR(20) NOT NULL DEFAULT 'morning' CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'night')),
      status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'absent', 'cancelled')),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_payroll (
      id SERIAL PRIMARY KEY,
      employee_id INT NOT NULL REFERENCES hr_employees(id) ON DELETE RESTRICT,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      base_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
      overtime_pay DECIMAL(12, 2) NOT NULL DEFAULT 0,
      bonuses DECIMAL(12, 2) NOT NULL DEFAULT 0,
      deductions DECIMAL(12, 2) NOT NULL DEFAULT 0,
      net_pay DECIMAL(12, 2) NOT NULL DEFAULT 0,
      payment_date DATE,
      payment_method VARCHAR(20) NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'cash', 'check')),
      status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_leaves (
      id SERIAL PRIMARY KEY,
      employee_id INT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
      leave_type VARCHAR(20) NOT NULL DEFAULT 'vacation' CHECK (leave_type IN ('vacation', 'sick', 'personal', 'unpaid', 'other')),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      days_count INT NOT NULL DEFAULT 1,
      reason TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query('CREATE INDEX IF NOT EXISTS idx_hr_emp_dept ON hr_employees(department)')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_hr_sched_date ON hr_schedules(shift_date)')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_hr_leave_status ON hr_leaves(status)')
  const existing = await pool.query('SELECT 1 FROM hr_employees LIMIT 1')
  if (existing.rows.length) {
    await seedHrRelatedIfEmpty()
    return
  }
  const ins = await pool.query(
    `INSERT INTO hr_employees (employee_code, full_name, department, position, phone, email, hire_date, salary, salary_type, status)
     VALUES
       ('EMP-001', 'Sokha Chan', 'Operation', 'Front desk', '012 111 222', 'sokha@smilehotel.local', CURRENT_DATE - 420, 450, 'monthly', 'active'),
       ('EMP-002', 'Dara Kim', 'Operation', 'Housekeeping', '012 333 444', 'dara@smilehotel.local', CURRENT_DATE - 300, 520, 'monthly', 'active'),
       ('EMP-003', 'Maly Chea', 'Operation', 'Waiter', '012 555 666', 'maly@smilehotel.local', CURRENT_DATE - 210, 480, 'monthly', 'active'),
       ('EMP-004', 'Vannak Ly', 'Operation', 'Maintenance', '012 777 888', 'vannak@smilehotel.local', CURRENT_DATE - 150, 500, 'monthly', 'active'),
       ('EMP-005', 'Sreymom Hun', 'Human Resource', 'Head Department', '012 999 000', 'sreymom@smilehotel.local', CURRENT_DATE - 600, 850, 'monthly', 'active')
     RETURNING id`
  )
  const ids = ins.rows.map((r) => r.id)
  await pool.query(
    `INSERT INTO hr_schedules (employee_id, shift_date, shift_start, shift_end, shift_type, status)
     VALUES
       ($1, CURRENT_DATE, '07:00', '15:00', 'morning', 'scheduled'),
       ($2, CURRENT_DATE, '07:00', '15:00', 'morning', 'scheduled'),
       ($3, CURRENT_DATE, '15:00', '23:00', 'afternoon', 'scheduled'),
       ($4, CURRENT_DATE, '08:00', '17:00', 'morning', 'scheduled'),
       ($5, CURRENT_DATE, '15:00', '23:00', 'afternoon', 'scheduled'),
       ($1, CURRENT_DATE + 1, '07:00', '15:00', 'morning', 'scheduled'),
       ($2, CURRENT_DATE + 1, '15:00', '23:00', 'afternoon', 'scheduled')`,
    ids
  )
  await seedHrRelatedIfEmpty()
}

async function seedHrRelatedIfEmpty() {
  const employees = await pool.query('SELECT id FROM hr_employees ORDER BY id')
  const ids = employees.rows.map((r) => r.id)
  if (ids.length < 3) return
  const pay = await pool.query('SELECT 1 FROM hr_payroll LIMIT 1')
  if (!pay.rows.length) {
    await pool.query(
      `INSERT INTO hr_payroll (employee_id, period_start, period_end, base_salary, overtime_pay, bonuses, deductions, net_pay, payment_date, payment_method, status)
       VALUES
         ($1, date_trunc('month', CURRENT_DATE) - INTERVAL '1 month', date_trunc('month', CURRENT_DATE) - INTERVAL '1 day', 450, 20, 0, 10, 460, CURRENT_DATE - 5, 'bank_transfer', 'paid'),
         ($2, date_trunc('month', CURRENT_DATE) - INTERVAL '1 month', date_trunc('month', CURRENT_DATE) - INTERVAL '1 day', 520, 0, 30, 15, 535, CURRENT_DATE - 5, 'bank_transfer', 'paid'),
         ($3, date_trunc('month', CURRENT_DATE) - INTERVAL '1 month', date_trunc('month', CURRENT_DATE) - INTERVAL '1 day', 480, 12, 0, 8, 484, NULL, 'bank_transfer', 'approved'),
         ($4, date_trunc('month', CURRENT_DATE) - INTERVAL '1 month', date_trunc('month', CURRENT_DATE) - INTERVAL '1 day', 850, 0, 50, 20, 880, NULL, 'bank_transfer', 'draft')`,
      [ids[0], ids[1], ids[2], ids[Math.min(4, ids.length - 1)]]
    )
  }
  const leaves = await pool.query('SELECT 1 FROM hr_leaves LIMIT 1')
  if (!leaves.rows.length) {
    await pool.query(
      `INSERT INTO hr_leaves (employee_id, leave_type, start_date, end_date, days_count, reason, status)
       VALUES
         ($1, 'vacation', CURRENT_DATE + 10, CURRENT_DATE + 12, 3, 'Family trip', 'pending'),
         ($2, 'sick', CURRENT_DATE - 2, CURRENT_DATE - 1, 2, 'Flu', 'approved'),
         ($3, 'personal', CURRENT_DATE + 20, CURRENT_DATE + 20, 1, 'Personal appointment', 'pending')`,
      [ids[0], ids[1], ids[2]]
    )
  }
}

const EMPLOYEE_SELECT = `id, employee_code, full_name, department, position, phone, email,
  to_char(hire_date, 'YYYY-MM-DD') AS hire_date, salary, salary_type, status, notes, created_at`

app.get('/api/hr/org', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    res.json(await getOrgTree())
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/hr/departments', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const name = String(req.body?.name || '').trim()
    if (!name) return res.status(400).json({ error: 'Department name is required.' })
    const max = await pool.query('SELECT COALESCE(MAX(sort_order), 0) AS n FROM hr_departments')
    const r = await pool.query(
      'INSERT INTO hr_departments (name, sort_order) VALUES ($1, $2) RETURNING id, name, sort_order',
      [name, Number(max.rows[0].n) + 1]
    )
    await writeAudit(req, { action: 'create', entity: 'hr_department', entityId: r.rows[0].id, summary: `Added department ${name}` })
    res.status(201).json({ ...r.rows[0], positions: [] })
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'That department already exists.' })
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/hr/departments/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const name = String(req.body?.name || '').trim()
    if (!name) return res.status(400).json({ error: 'Department name is required.' })
    const current = await pool.query('SELECT id, name FROM hr_departments WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Department not found.' })
    const r = await pool.query(
      'UPDATE hr_departments SET name = $1 WHERE id = $2 RETURNING id, name, sort_order',
      [name, req.params.id]
    )
    await pool.query('UPDATE hr_employees SET department = $1 WHERE department = $2', [name, current.rows[0].name])
    await writeAudit(req, { action: 'update', entity: 'hr_department', entityId: r.rows[0].id, summary: `Renamed department to ${name}` })
    res.json(r.rows[0])
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'That department already exists.' })
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/hr/departments/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const current = await pool.query('SELECT id, name FROM hr_departments WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Department not found.' })
    const used = await pool.query('SELECT 1 FROM hr_employees WHERE department = $1 LIMIT 1', [current.rows[0].name])
    if (used.rows.length) {
      return res.status(400).json({ error: 'Cannot delete a department that still has employees. Reassign them first.' })
    }
    await pool.query('DELETE FROM hr_departments WHERE id = $1', [req.params.id])
    await writeAudit(req, { action: 'delete', entity: 'hr_department', entityId: current.rows[0].id, summary: `Removed department ${current.rows[0].name}` })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/hr/departments/:id/positions', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const name = String(req.body?.name || '').trim()
    if (!name) return res.status(400).json({ error: 'Position name is required.' })
    const dept = await pool.query('SELECT id, name FROM hr_departments WHERE id = $1', [req.params.id])
    if (!dept.rows[0]) return res.status(404).json({ error: 'Department not found.' })
    const max = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) AS n FROM hr_positions WHERE department_id = $1',
      [req.params.id]
    )
    const r = await pool.query(
      'INSERT INTO hr_positions (department_id, name, sort_order) VALUES ($1, $2, $3) RETURNING id, department_id, name, sort_order',
      [req.params.id, name, Number(max.rows[0].n) + 1]
    )
    await writeAudit(req, { action: 'create', entity: 'hr_position', entityId: r.rows[0].id, summary: `Added position ${name} in ${dept.rows[0].name}` })
    res.status(201).json(r.rows[0])
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'That position already exists in this department.' })
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/hr/positions/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const name = String(req.body?.name || '').trim()
    if (!name) return res.status(400).json({ error: 'Position name is required.' })
    const current = await pool.query(
      `SELECT p.id, p.name, p.department_id, d.name AS department
       FROM hr_positions p JOIN hr_departments d ON d.id = p.department_id
       WHERE p.id = $1`,
      [req.params.id]
    )
    if (!current.rows[0]) return res.status(404).json({ error: 'Position not found.' })
    const r = await pool.query(
      'UPDATE hr_positions SET name = $1 WHERE id = $2 RETURNING id, department_id, name, sort_order',
      [name, req.params.id]
    )
    await pool.query(
      'UPDATE hr_employees SET position = $1 WHERE department = $2 AND position = $3',
      [name, current.rows[0].department, current.rows[0].name]
    )
    await writeAudit(req, { action: 'update', entity: 'hr_position', entityId: r.rows[0].id, summary: `Renamed position to ${name}` })
    res.json(r.rows[0])
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'That position already exists in this department.' })
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/hr/positions/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const current = await pool.query(
      `SELECT p.id, p.name, d.name AS department
       FROM hr_positions p JOIN hr_departments d ON d.id = p.department_id
       WHERE p.id = $1`,
      [req.params.id]
    )
    if (!current.rows[0]) return res.status(404).json({ error: 'Position not found.' })
    const used = await pool.query(
      'SELECT 1 FROM hr_employees WHERE department = $1 AND position = $2 LIMIT 1',
      [current.rows[0].department, current.rows[0].name]
    )
    if (used.rows.length) {
      return res.status(400).json({ error: 'Cannot delete a position that still has employees. Reassign them first.' })
    }
    await pool.query('DELETE FROM hr_positions WHERE id = $1', [req.params.id])
    await writeAudit(req, { action: 'delete', entity: 'hr_position', entityId: current.rows[0].id, summary: `Removed position ${current.rows[0].name}` })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/hr/employees', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const r = await pool.query(`SELECT ${EMPLOYEE_SELECT} FROM hr_employees ORDER BY id`)
    res.json(r.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/hr/employees', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const { full_name, department, position, phone, email, hire_date, salary, salary_type, status, notes } = req.body || {}
    const name = String(full_name || '').trim()
    if (!name) return res.status(400).json({ error: 'Name is required.' })
    const resolved = await resolveDeptPosition(department, position)
    if (resolved.error) return res.status(400).json({ error: resolved.error })
    const type = ['hourly', 'monthly', 'annual'].includes(salary_type) ? salary_type : 'monthly'
    const st = ['active', 'on_leave', 'terminated'].includes(status) ? status : 'active'
    const count = await pool.query('SELECT COUNT(*) AS n FROM hr_employees')
    const code = `EMP-${String(parseInt(count.rows[0].n, 10) + 1).padStart(3, '0')}`
    const r = await pool.query(
      `INSERT INTO hr_employees (employee_code, full_name, department, position, phone, email, hire_date, salary, salary_type, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING ${EMPLOYEE_SELECT}`,
      [code, name, resolved.department, resolved.position, phone || null, email || null, hire_date || new Date().toISOString().slice(0, 10), toMoney(salary), type, st, notes || null]
    )
    await writeAudit(req, { action: 'create', entity: 'hr_employee', entityId: r.rows[0].id, summary: `Added employee ${name} (${code})` })
    res.status(201).json(r.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/hr/employees/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const current = await pool.query(`SELECT ${EMPLOYEE_SELECT} FROM hr_employees WHERE id = $1`, [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Employee not found' })
    const row = current.rows[0]
    let department = row.department
    let position = row.position
    if (req.body?.department != null || req.body?.position != null) {
      const resolved = await resolveDeptPosition(req.body?.department ?? row.department, req.body?.position ?? row.position)
      if (resolved.error) return res.status(400).json({ error: resolved.error })
      department = resolved.department
      position = resolved.position
    }
    const next = {
      department,
      position,
      phone: req.body?.phone != null ? req.body.phone : row.phone,
      status: ['active', 'on_leave', 'terminated'].includes(req.body?.status) ? req.body.status : row.status,
      salary: req.body?.salary != null ? toMoney(req.body.salary) : toMoney(row.salary),
    }
    const r = await pool.query(
      `UPDATE hr_employees SET department = $1, position = $2, phone = $3, status = $4, salary = $5 WHERE id = $6
       RETURNING ${EMPLOYEE_SELECT}`,
      [next.department, next.position, next.phone, next.status, next.salary, req.params.id]
    )
    await writeAudit(req, { action: 'update', entity: 'hr_employee', entityId: r.rows[0].id, summary: `Updated employee ${r.rows[0].full_name}` })
    res.json(r.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/hr/employees/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const r = await pool.query('DELETE FROM hr_employees WHERE id = $1 RETURNING id, full_name', [req.params.id])
    if (!r.rows[0]) return res.status(404).json({ error: 'Employee not found' })
    await writeAudit(req, { action: 'delete', entity: 'hr_employee', entityId: r.rows[0].id, summary: `Removed employee ${r.rows[0].full_name}` })
    res.json({ ok: true })
  } catch (e) {
    if (e.code === '23503') return res.status(400).json({ error: 'Cannot delete an employee who still has payroll records.' })
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/hr/schedules', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const r = await pool.query(
      `SELECT s.id, s.employee_id, e.full_name, e.department, e.position, e.employee_code,
              to_char(s.shift_date, 'YYYY-MM-DD') AS shift_date,
              to_char(s.shift_start, 'HH24:MI') AS shift_start,
              to_char(s.shift_end, 'HH24:MI') AS shift_end,
              s.shift_type, s.status, s.notes
       FROM hr_schedules s
       JOIN hr_employees e ON e.id = s.employee_id
       ORDER BY s.shift_date DESC, s.shift_start, s.id DESC`
    )
    res.json(r.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/hr/schedules', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const { employee_id, shift_date, shift_start, shift_end, shift_type, status, notes } = req.body || {}
    if (!employee_id || !shift_date || !shift_start || !shift_end) {
      return res.status(400).json({ error: 'Employee, date, start and end time are required.' })
    }
    const type = HR_SHIFT_TYPES.includes(shift_type) ? shift_type : 'morning'
    const st = ['scheduled', 'completed', 'absent', 'cancelled'].includes(status) ? status : 'scheduled'
    const r = await pool.query(
      `INSERT INTO hr_schedules (employee_id, shift_date, shift_start, shift_end, shift_type, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [employee_id, shift_date, shift_start, shift_end, type, st, notes || null]
    )
    await writeAudit(req, { action: 'create', entity: 'hr_schedule', entityId: r.rows[0].id, summary: `Scheduled shift on ${shift_date}` })
    const saved = await pool.query(
      `SELECT s.id, s.employee_id, e.full_name, e.department, e.position, e.employee_code,
              to_char(s.shift_date, 'YYYY-MM-DD') AS shift_date,
              to_char(s.shift_start, 'HH24:MI') AS shift_start,
              to_char(s.shift_end, 'HH24:MI') AS shift_end,
              s.shift_type, s.status, s.notes
       FROM hr_schedules s JOIN hr_employees e ON e.id = s.employee_id WHERE s.id = $1`,
      [r.rows[0].id]
    )
    res.status(201).json(saved.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/hr/schedules/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const st = req.body?.status
    if (!['scheduled', 'completed', 'absent', 'cancelled'].includes(st)) {
      return res.status(400).json({ error: 'Invalid schedule status.' })
    }
    const r = await pool.query(
      `UPDATE hr_schedules SET status = $1 WHERE id = $2 RETURNING id`,
      [st, req.params.id]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'Schedule not found' })
    await writeAudit(req, { action: 'update', entity: 'hr_schedule', entityId: r.rows[0].id, summary: `Shift marked ${st}` })
    res.json({ ok: true, id: r.rows[0].id, status: st })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/hr/schedules/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const r = await pool.query('DELETE FROM hr_schedules WHERE id = $1 RETURNING id', [req.params.id])
    if (!r.rows[0]) return res.status(404).json({ error: 'Schedule not found' })
    await writeAudit(req, { action: 'delete', entity: 'hr_schedule', entityId: r.rows[0].id, summary: 'Removed a shift' })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/hr/payroll', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const r = await pool.query(
      `SELECT p.id, p.employee_id, e.full_name, e.employee_code, e.department, e.position, e.salary_type,
              to_char(p.period_start, 'YYYY-MM-DD') AS period_start,
              to_char(p.period_end, 'YYYY-MM-DD') AS period_end,
              p.base_salary, p.overtime_pay, p.bonuses, p.deductions, p.net_pay,
              to_char(p.payment_date, 'YYYY-MM-DD') AS payment_date,
              p.payment_method, p.status, p.notes, x.id AS expense_id
       FROM hr_payroll p
       JOIN hr_employees e ON e.id = p.employee_id
       LEFT JOIN expenses x ON x.payroll_id = p.id
       ORDER BY p.period_end DESC, p.id DESC`
    )
    res.json(r.rows.map((row) => ({
      ...row,
      base_salary: toMoney(row.base_salary),
      overtime_pay: toMoney(row.overtime_pay),
      bonuses: toMoney(row.bonuses),
      deductions: toMoney(row.deductions),
      net_pay: toMoney(row.net_pay),
    })))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/hr/payroll', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const { employee_id, period_start, period_end, base_salary, overtime_pay, bonuses, deductions, payment_method, notes } = req.body || {}
    if (!employee_id || !period_start || !period_end) {
      return res.status(400).json({ error: 'Employee and pay period are required.' })
    }
    if (period_end < period_start) {
      return res.status(400).json({ error: 'Period end must be on or after period start.' })
    }
    const emp = await pool.query('SELECT id, full_name, status FROM hr_employees WHERE id = $1', [employee_id])
    if (!emp.rows[0]) return res.status(404).json({ error: 'Employee not found.' })
    if (emp.rows[0].status === 'terminated') {
      return res.status(400).json({ error: 'Cannot create payroll for a terminated employee.' })
    }
    const overlap = await pool.query(
      `SELECT id FROM hr_payroll
       WHERE employee_id = $1
         AND period_start <= $3
         AND period_end >= $2
       LIMIT 1`,
      [employee_id, period_start, period_end]
    )
    if (overlap.rows[0]) {
      return res.status(400).json({ error: 'This employee already has payroll that overlaps that period.' })
    }
    const base = toMoney(base_salary)
    const ot = toMoney(overtime_pay)
    const bonus = toMoney(bonuses)
    const ded = toMoney(deductions)
    if (base < 0 || ot < 0 || bonus < 0 || ded < 0) {
      return res.status(400).json({ error: 'Pay amounts cannot be negative.' })
    }
    const gross = base + ot + bonus
    if (ded > gross) {
      return res.status(400).json({ error: 'Deductions cannot be greater than base + overtime + bonuses.' })
    }
    const net = gross - ded
    const method = ['bank_transfer', 'cash', 'check'].includes(payment_method) ? payment_method : 'bank_transfer'
    const r = await pool.query(
      `INSERT INTO hr_payroll (employee_id, period_start, period_end, base_salary, overtime_pay, bonuses, deductions, net_pay, payment_method, status, notes, payment_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10, NULL)
       RETURNING id`,
      [employee_id, period_start, period_end, base, ot, bonus, ded, net, method, notes || null]
    )
    await writeAudit(req, { action: 'create', entity: 'hr_payroll', entityId: r.rows[0].id, summary: `Payroll draft for ${emp.rows[0].full_name} (${formatMoney(net)})` })
    res.status(201).json({ id: r.rows[0].id, net_pay: net, status: 'draft' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/hr/payroll/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const st = req.body?.status
    const current = await pool.query('SELECT id, status FROM hr_payroll WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Payroll record not found' })
    const from = current.rows[0].status
    const allowed = { draft: ['approved'], approved: ['paid'] }
    if (!allowed[from] || !allowed[from].includes(st)) {
      return res.status(400).json({ error: `Cannot change payroll from ${from} to ${st}. Use draft → approved → paid.` })
    }
    const r = st === 'paid'
      ? await pool.query(
          `UPDATE hr_payroll SET status = 'paid', payment_date = CURRENT_DATE WHERE id = $1
           RETURNING id, status, to_char(payment_date, 'YYYY-MM-DD') AS payment_date`,
          [req.params.id]
        )
      : await pool.query(
          `UPDATE hr_payroll SET status = $1 WHERE id = $2
           RETURNING id, status, to_char(payment_date, 'YYYY-MM-DD') AS payment_date`,
          [st, req.params.id]
        )
    await writeAudit(req, { action: 'update', entity: 'hr_payroll', entityId: r.rows[0].id, summary: `Payroll marked ${st}` })
    let expenseId = null
    if (st === 'paid') {
      expenseId = await syncPayrollExpense(r.rows[0].id)
      await writeAudit(req, {
        action: 'create',
        entity: 'expense',
        entityId: expenseId,
        summary: `Salary expense from payroll #${r.rows[0].id}`,
      })
    }
    res.json({ ok: true, status: r.rows[0].status, payment_date: r.rows[0].payment_date, expense_id: expenseId })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/hr/payroll/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const current = await pool.query('SELECT id, status FROM hr_payroll WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Payroll record not found' })
    if (current.rows[0].status === 'paid') {
      return res.status(400).json({ error: 'Paid payroll cannot be deleted.' })
    }
    const r = await pool.query('DELETE FROM hr_payroll WHERE id = $1 RETURNING id', [req.params.id])
    await writeAudit(req, { action: 'delete', entity: 'hr_payroll', entityId: r.rows[0].id, summary: 'Deleted payroll record' })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/hr/leaves', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const r = await pool.query(
      `SELECT l.id, l.employee_id, e.full_name, e.employee_code, e.department, e.position, l.leave_type,
              to_char(l.start_date, 'YYYY-MM-DD') AS start_date,
              to_char(l.end_date, 'YYYY-MM-DD') AS end_date,
              l.days_count, l.reason, l.status
       FROM hr_leaves l
       JOIN hr_employees e ON e.id = l.employee_id
       ORDER BY l.start_date DESC, l.id DESC`
    )
    res.json(r.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/hr/leaves', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const { employee_id, leave_type, start_date, end_date, reason } = req.body || {}
    if (!employee_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Employee, start date and end date are required.' })
    }
    const days = daysInclusive(start_date, end_date)
    if (days < 1) return res.status(400).json({ error: 'End date must be on or after the start date.' })
    const type = HR_LEAVE_TYPES.includes(leave_type) ? leave_type : 'vacation'
    const r = await pool.query(
      `INSERT INTO hr_leaves (employee_id, leave_type, start_date, end_date, days_count, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id`,
      [employee_id, type, start_date, end_date, days, reason || null]
    )
    await writeAudit(req, { action: 'create', entity: 'hr_leave', entityId: r.rows[0].id, summary: `Leave request ${type} (${days} days)` })
    res.status(201).json({ id: r.rows[0].id, days_count: days })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/hr/leaves/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const st = req.body?.status
    if (!['pending', 'approved', 'rejected', 'cancelled'].includes(st)) {
      return res.status(400).json({ error: 'Invalid leave status.' })
    }
    const r = await pool.query('UPDATE hr_leaves SET status = $1 WHERE id = $2 RETURNING id, employee_id', [st, req.params.id])
    if (!r.rows[0]) return res.status(404).json({ error: 'Leave not found' })
    if (st === 'approved') {
      await pool.query(`UPDATE hr_employees SET status = 'on_leave' WHERE id = $1 AND status = 'active'`, [r.rows[0].employee_id])
    }
    await writeAudit(req, { action: 'update', entity: 'hr_leave', entityId: r.rows[0].id, summary: `Leave marked ${st}` })
    res.json({ ok: true, status: st })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/hr/leaves/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const r = await pool.query('DELETE FROM hr_leaves WHERE id = $1 RETURNING id', [req.params.id])
    if (!r.rows[0]) return res.status(404).json({ error: 'Leave not found' })
    await writeAudit(req, { action: 'delete', entity: 'hr_leave', entityId: r.rows[0].id, summary: 'Deleted leave request' })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

async function roomIsOccupied(roomId) {
  const r = await pool.query(
    `SELECT 1 FROM bookings
     WHERE room_id = $1 AND status = 'confirmed'
       AND check_in <= CURRENT_DATE AND check_out > CURRENT_DATE
     LIMIT 1`,
    [roomId]
  )
  return r.rows.length > 0
}

async function openCheckoutTask(roomId, bookingId = null) {
  const existing = await pool.query(
    `SELECT id FROM housekeeping_tasks WHERE room_id = $1 AND status IN ('dirty', 'in_progress') LIMIT 1`,
    [roomId]
  )
  if (existing.rows[0]) return existing.rows[0]
  const r = await pool.query(
    `INSERT INTO housekeeping_tasks (room_id, booking_id, task_type, status, due_date)
     VALUES ($1, $2, 'checkout', 'dirty', CURRENT_DATE)
     RETURNING id`,
    [roomId, bookingId]
  )
  await pool.query("UPDATE rooms SET status = 'booked' WHERE id = $1 AND status = 'available'", [roomId])
  return r.rows[0]
}

async function releaseRoomIfReady(roomId) {
  if (await roomIsOccupied(roomId)) return
  const open = await pool.query(
    `SELECT 1 FROM housekeeping_tasks WHERE room_id = $1 AND status IN ('dirty', 'in_progress') LIMIT 1`,
    [roomId]
  )
  if (open.rows.length) return
  await pool.query(
    `UPDATE rooms SET status = 'available' WHERE id = $1 AND status = 'booked'`,
    [roomId]
  )
}

async function ensureHousekeepingTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS housekeeping_tasks (
      id SERIAL PRIMARY KEY,
      room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      booking_id INT REFERENCES bookings(id) ON DELETE SET NULL,
      assigned_to INT REFERENCES hr_employees(id) ON DELETE SET NULL,
      task_type VARCHAR(20) NOT NULL DEFAULT 'checkout' CHECK (task_type IN ('checkout', 'stayover', 'deep_clean')),
      status VARCHAR(20) NOT NULL DEFAULT 'dirty' CHECK (status IN ('dirty', 'in_progress', 'clean')),
      notes TEXT,
      due_date DATE NOT NULL DEFAULT CURRENT_DATE,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_hk_open_room
    ON housekeeping_tasks(room_id)
    WHERE status IN ('dirty', 'in_progress')
  `)
  await pool.query('CREATE INDEX IF NOT EXISTS idx_hk_status ON housekeeping_tasks(status)')
  const due = await pool.query(`
    SELECT b.id, b.room_id
    FROM bookings b
    WHERE b.status IN ('confirmed', 'completed')
      AND b.check_out <= CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM bookings x
        WHERE x.room_id = b.room_id AND x.status = 'confirmed'
          AND x.check_in <= CURRENT_DATE AND x.check_out > CURRENT_DATE
      )
      AND NOT EXISTS (
        SELECT 1 FROM housekeeping_tasks t
        WHERE t.room_id = b.room_id AND t.status IN ('dirty', 'in_progress')
      )
  `)
  for (const row of due.rows) {
    await openCheckoutTask(row.room_id, row.id)
  }
}

function housekeepingBoardStatus(row) {
  if (row.room_status === 'maintenance') return 'maintenance'
  if (row.task_status === 'in_progress') return 'cleaning'
  if (row.task_status === 'dirty') return 'dirty'
  if (row.stay_booking_id) return 'occupied'
  return 'ready'
}

app.get('/api/housekeeping', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    await openDueHousekeeping()
    const rooms = await pool.query(`
      SELECT r.id AS room_id, r.name AS room_name, r.status AS room_status,
             h.id AS hotel_id, h.name AS hotel_name,
             t.id AS task_id, t.task_type, t.status AS task_status, t.assigned_to, t.notes,
             to_char(t.due_date, 'YYYY-MM-DD') AS due_date,
             e.full_name AS assigned_name, e.employee_code AS assigned_code,
             s.id AS stay_booking_id,
             to_char(s.check_out, 'YYYY-MM-DD') AS stay_check_out
      FROM rooms r
      JOIN hotels h ON h.id = r.hotel_id
      LEFT JOIN housekeeping_tasks t
        ON t.room_id = r.id AND t.status IN ('dirty', 'in_progress')
      LEFT JOIN hr_employees e ON e.id = t.assigned_to
      LEFT JOIN bookings s
        ON s.room_id = r.id AND s.status = 'confirmed'
        AND s.check_in <= CURRENT_DATE AND s.check_out > CURRENT_DATE
      ORDER BY h.name, r.name
    `)
    const staff = await pool.query(`
      SELECT id, full_name, employee_code, department, position
      FROM hr_employees
      WHERE status = 'active'
        AND (position ILIKE '%housekeeping%' OR department = 'Operation')
      ORDER BY full_name
    `)
    res.json({
      rooms: rooms.rows.map((row) => ({ ...row, hk_status: housekeepingBoardStatus(row) })),
      staff: staff.rows,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

async function openDueHousekeeping() {
  const due = await pool.query(`
    SELECT b.id, b.room_id
    FROM bookings b
    WHERE b.status IN ('confirmed', 'completed')
      AND b.check_out <= CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM bookings x
        WHERE x.room_id = b.room_id AND x.status = 'confirmed'
          AND x.check_in <= CURRENT_DATE AND x.check_out > CURRENT_DATE
      )
      AND NOT EXISTS (
        SELECT 1 FROM housekeeping_tasks t
        WHERE t.room_id = b.room_id AND t.status IN ('dirty', 'in_progress')
      )
  `)
  for (const row of due.rows) {
    await openCheckoutTask(row.room_id, row.id)
  }
}

app.post('/api/housekeeping', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const { room_id, task_type, assigned_to, notes, due_date } = req.body || {}
    if (!room_id) return res.status(400).json({ error: 'Select a room.' })
    const room = await pool.query('SELECT id, name, status FROM rooms WHERE id = $1', [room_id])
    if (!room.rows[0]) return res.status(404).json({ error: 'Room not found.' })
    if (room.rows[0].status === 'maintenance') {
      return res.status(400).json({ error: 'This room is in maintenance. Return it from Rooms first.' })
    }
    const type = ['checkout', 'stayover', 'deep_clean'].includes(task_type) ? task_type : 'checkout'
    const occupied = await roomIsOccupied(room_id)
    if (occupied && type === 'checkout') {
      return res.status(400).json({ error: 'Guest is still in the room. Use stay-over clean, or check the guest out first.' })
    }
    const assignee = assigned_to ? parseInt(assigned_to, 10) : null
    const r = await pool.query(
      `INSERT INTO housekeeping_tasks (room_id, assigned_to, task_type, status, notes, due_date)
       VALUES ($1, $2, $3, 'dirty', $4, $5)
       RETURNING id`,
      [room_id, assignee || null, type, notes || null, due_date || new Date().toISOString().slice(0, 10)]
    )
    if (!occupied) {
      await pool.query("UPDATE rooms SET status = 'booked' WHERE id = $1 AND status = 'available'", [room_id])
    }
    await writeAudit(req, {
      action: 'create',
      entity: 'housekeeping',
      entityId: r.rows[0].id,
      summary: `Housekeeping ${type} opened for “${room.rows[0].name}”`,
    })
    res.status(201).json({ ok: true, id: r.rows[0].id })
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'This room already has an open housekeeping task.' })
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/housekeeping/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const current = await pool.query(
      `SELECT t.*, r.name AS room_name
       FROM housekeeping_tasks t JOIN rooms r ON r.id = t.room_id
       WHERE t.id = $1`,
      [req.params.id]
    )
    if (!current.rows[0]) return res.status(404).json({ error: 'Housekeeping task not found.' })
    const row = current.rows[0]
    if (row.status === 'clean') return res.status(400).json({ error: 'This task is already finished.' })
    let assignedTo = row.assigned_to
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'assigned_to')) {
      assignedTo = req.body.assigned_to ? parseInt(req.body.assigned_to, 10) : null
    }
    let nextStatus = row.status
    if (req.body?.status) {
      if (!['dirty', 'in_progress', 'clean'].includes(req.body.status)) {
        return res.status(400).json({ error: 'Invalid housekeeping status.' })
      }
      if (req.body.status === 'in_progress' && row.status !== 'dirty' && row.status !== 'in_progress') {
        return res.status(400).json({ error: 'Start cleaning from a dirty room.' })
      }
      if (req.body.status === 'clean' && !['dirty', 'in_progress'].includes(row.status)) {
        return res.status(400).json({ error: 'Only an open task can be marked clean.' })
      }
      nextStatus = req.body.status
    }
    const notes = req.body?.notes != null ? req.body.notes : row.notes
    const completedAt = nextStatus === 'clean' ? new Date() : null
    await pool.query(
      `UPDATE housekeeping_tasks
       SET assigned_to = $1, status = $2, notes = $3, completed_at = $4
       WHERE id = $5`,
      [assignedTo, nextStatus, notes, completedAt, req.params.id]
    )
    if (nextStatus === 'clean') {
      await releaseRoomIfReady(row.room_id)
    }
    await writeAudit(req, {
      action: 'update',
      entity: 'housekeeping',
      entityId: row.id,
      summary: `Housekeeping for “${row.room_name}” marked ${nextStatus}`,
    })
    res.json({ ok: true, id: row.id, status: nextStatus })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

async function ensureCrsTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS crs_channels (
      id SERIAL PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      code VARCHAR(40) NOT NULL UNIQUE,
      commission_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS crs_rate_plans (
      id SERIAL PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      hotel_id INT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
      room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
      price NUMERIC(10,2) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      min_nights INT NOT NULL DEFAULT 1,
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CHECK (end_date >= start_date),
      CHECK (price >= 0),
      CHECK (min_nights >= 1)
    )
  `)
  await pool.query('CREATE INDEX IF NOT EXISTS idx_crs_rates_room ON crs_rate_plans(room_id, start_date, end_date)')
  await pool.query(`
    CREATE TABLE IF NOT EXISTS crs_stopsell (
      id SERIAL PRIMARY KEY,
      room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CHECK (end_date >= start_date)
    )
  `)
  await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS channel_id INT REFERENCES crs_channels(id) ON DELETE SET NULL`)
  await pool.query(`
    INSERT INTO crs_channels (name, code, commission_pct, status) VALUES
      ('Direct website', 'direct', 0, 'active'),
      ('Walk-in', 'walkin', 0, 'active'),
      ('Booking.com', 'booking', 15, 'active'),
      ('Agoda', 'agoda', 15, 'active'),
      ('Expedia', 'expedia', 18, 'active')
    ON CONFLICT (code) DO NOTHING
  `)
  await pool.query(`
    UPDATE bookings b SET channel_id = c.id
    FROM crs_channels c
    WHERE b.channel_id IS NULL AND c.code = 'direct'
  `)
}

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function eachNight(checkIn, checkOut) {
  const nights = []
  const start = new Date(`${checkIn}T00:00:00`)
  const end = new Date(`${checkOut}T00:00:00`)
  if (!(start < end)) return nights
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    nights.push(ymd(new Date(d)))
  }
  return nights
}

async function nightlyRate(roomId, hotelId, date, fallbackPrice) {
  const r = await pool.query(
    `SELECT price FROM crs_rate_plans
     WHERE status = 'active' AND start_date <= $1::date AND end_date >= $1::date
       AND hotel_id = $2 AND (room_id = $3 OR room_id IS NULL)
     ORDER BY CASE WHEN room_id IS NOT NULL THEN 0 ELSE 1 END, id DESC
     LIMIT 1`,
    [date, hotelId, roomId]
  )
  if (r.rows[0]) return Number(r.rows[0].price)
  return Number(fallbackPrice || 0)
}

async function crsQuote(roomId, checkIn, checkOut) {
  const room = await pool.query(
    `SELECT r.id, r.price, r.status, r.hotel_id, r.name, r.max_persons, h.name AS hotel_name
     FROM rooms r JOIN hotels h ON h.id = r.hotel_id WHERE r.id = $1`,
    [roomId]
  )
  if (!room.rows[0]) return { error: 'Room not found.' }
  const row = room.rows[0]
  if (row.status === 'maintenance') return { error: 'This room is in maintenance and cannot be booked.' }
  const nights = eachNight(checkIn, checkOut)
  if (!nights.length) return { error: 'Check-out must be after check-in.' }
  const overlap = await pool.query(
    `SELECT id FROM bookings
     WHERE room_id = $1 AND status IN ('pending', 'confirmed')
       AND check_in < $3::date AND check_out > $2::date
     LIMIT 1`,
    [roomId, checkIn, checkOut]
  )
  if (overlap.rows[0]) return { error: 'Those dates are already reserved.' }
  const closed = await pool.query(
    `SELECT id FROM crs_stopsell
     WHERE room_id = $1 AND start_date < $3::date AND end_date >= $2::date
     LIMIT 1`,
    [roomId, checkIn, checkOut]
  )
  if (closed.rows[0]) return { error: 'Those dates are closed for sale.' }
  const nightly = []
  let total = 0
  for (const date of nights) {
    const price = await nightlyRate(row.id, row.hotel_id, date, row.price)
    nightly.push({ date, price })
    total += price
  }
  return {
    room_id: row.id,
    room_name: row.name,
    hotel_name: row.hotel_name,
    max_persons: row.max_persons,
    check_in: checkIn,
    check_out: checkOut,
    nights: nights.length,
    nightly,
    total: Math.round(total * 100) / 100,
  }
}

app.get('/api/crs/quote', async (req, res) => {
  try {
    const roomId = parseInt(req.query.room_id, 10)
    const { check_in, check_out } = req.query || {}
    if (!roomId || !check_in || !check_out) return res.status(400).json({ error: 'Room and dates are required.' })
    const quote = await crsQuote(roomId, check_in, check_out)
    if (quote.error) return res.status(400).json({ error: quote.error })
    res.json(quote)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/crs/rates', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const r = await pool.query(
      `SELECT rp.id, rp.name, rp.hotel_id, rp.room_id, rp.price, rp.min_nights, rp.status,
              to_char(rp.start_date, 'YYYY-MM-DD') AS start_date,
              to_char(rp.end_date, 'YYYY-MM-DD') AS end_date,
              h.name AS hotel_name, r.name AS room_name
       FROM crs_rate_plans rp
       JOIN hotels h ON h.id = rp.hotel_id
       LEFT JOIN rooms r ON r.id = rp.room_id
       ORDER BY rp.start_date DESC, rp.id DESC`
    )
    res.json(r.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/crs/rates', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const { name, hotel_id, room_id, price, start_date, end_date, min_nights, status } = req.body || {}
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Plan name is required.' })
    if (!hotel_id) return res.status(400).json({ error: 'Select a property.' })
    if (price == null || Number(price) < 0) return res.status(400).json({ error: 'Enter a nightly rate.' })
    if (!start_date || !end_date || end_date < start_date) return res.status(400).json({ error: 'Enter a valid date range.' })
    if (room_id) {
      const room = await pool.query('SELECT hotel_id FROM rooms WHERE id = $1', [room_id])
      if (!room.rows[0] || Number(room.rows[0].hotel_id) !== Number(hotel_id)) {
        return res.status(400).json({ error: 'That room does not belong to the selected property.' })
      }
    }
    const st = status === 'paused' ? 'paused' : 'active'
    const r = await pool.query(
      `INSERT INTO crs_rate_plans (name, hotel_id, room_id, price, start_date, end_date, min_nights, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [String(name).trim(), hotel_id, room_id || null, Number(price), start_date, end_date, parseInt(min_nights, 10) || 1, st]
    )
    await writeAudit(req, {
      action: 'create',
      entity: 'crs_rate',
      entityId: r.rows[0].id,
      summary: `CRS rate “${String(name).trim()}” opened`,
    })
    res.status(201).json({ ok: true, id: r.rows[0].id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/crs/rates/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const current = await pool.query('SELECT * FROM crs_rate_plans WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Rate plan not found.' })
    const row = current.rows[0]
    const st = req.body?.status === 'paused' || req.body?.status === 'active' ? req.body.status : row.status
    await pool.query('UPDATE crs_rate_plans SET status = $1 WHERE id = $2', [st, req.params.id])
    await writeAudit(req, {
      action: 'update',
      entity: 'crs_rate',
      entityId: row.id,
      summary: `CRS rate “${row.name}” marked ${st}`,
    })
    res.json({ ok: true, id: row.id, status: st })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/crs/rates/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const r = await pool.query('DELETE FROM crs_rate_plans WHERE id = $1 RETURNING id, name', [req.params.id])
    if (!r.rows[0]) return res.status(404).json({ error: 'Rate plan not found.' })
    await writeAudit(req, {
      action: 'delete',
      entity: 'crs_rate',
      entityId: r.rows[0].id,
      summary: `Deleted CRS rate “${r.rows[0].name}”`,
    })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/crs/channels', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const r = await pool.query(
      `SELECT c.*,
              (SELECT COUNT(*)::int FROM bookings b WHERE b.channel_id = c.id) AS booking_count
       FROM crs_channels c
       ORDER BY c.id`
    )
    res.json(r.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/crs/channels', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const { name, code, commission_pct, status } = req.body || {}
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Channel name is required.' })
    const slug = String(code || name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 40)
    if (!slug) return res.status(400).json({ error: 'Channel code is required.' })
    const commission = Number(commission_pct || 0)
    if (commission < 0 || commission > 100) return res.status(400).json({ error: 'Commission must be 0–100%.' })
    const st = status === 'paused' ? 'paused' : 'active'
    const r = await pool.query(
      `INSERT INTO crs_channels (name, code, commission_pct, status)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [String(name).trim(), slug, commission, st]
    )
    await writeAudit(req, {
      action: 'create',
      entity: 'crs_channel',
      entityId: r.rows[0].id,
      summary: `Added CRS channel “${String(name).trim()}”`,
    })
    res.status(201).json({ ok: true, id: r.rows[0].id })
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'That channel code already exists.' })
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/crs/channels/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const current = await pool.query('SELECT * FROM crs_channels WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Channel not found.' })
    const row = current.rows[0]
    const name = req.body?.name != null ? String(req.body.name).trim() : row.name
    const commission = req.body?.commission_pct != null ? Number(req.body.commission_pct) : Number(row.commission_pct)
    if (!name) return res.status(400).json({ error: 'Channel name is required.' })
    if (commission < 0 || commission > 100) return res.status(400).json({ error: 'Commission must be 0–100%.' })
    let st = req.body?.status === 'paused' || req.body?.status === 'active' ? req.body.status : row.status
    if (row.code === 'direct') st = 'active'
    await pool.query(
      `UPDATE crs_channels SET name = $1, commission_pct = $2, status = $3 WHERE id = $4`,
      [name, commission, st, req.params.id]
    )
    await writeAudit(req, {
      action: 'update',
      entity: 'crs_channel',
      entityId: row.id,
      summary: `Updated CRS channel “${name}”`,
    })
    res.json({ ok: true, id: row.id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/crs/channels/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const current = await pool.query('SELECT * FROM crs_channels WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Channel not found.' })
    if (current.rows[0].code === 'direct') return res.status(400).json({ error: 'The direct website channel cannot be removed.' })
    await pool.query('DELETE FROM crs_channels WHERE id = $1', [req.params.id])
    await writeAudit(req, {
      action: 'delete',
      entity: 'crs_channel',
      entityId: current.rows[0].id,
      summary: `Removed CRS channel “${current.rows[0].name}”`,
    })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/crs/availability', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const start = req.query.from || ymd(new Date())
    const days = Math.min(31, Math.max(7, parseInt(req.query.days, 10) || 14))
    const startDate = new Date(`${start}T00:00:00`)
    const dates = []
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      dates.push(ymd(d))
    }
    const end = dates[dates.length - 1]
    const endExclusive = ymd(new Date(new Date(`${end}T00:00:00`).getTime() + 86400000))
    const hotelId = req.query.hotel_id ? parseInt(req.query.hotel_id, 10) : null
    const roomsQ = hotelId
      ? await pool.query(
          `SELECT r.id AS room_id, r.name AS room_name, r.status AS room_status, h.name AS hotel_name
           FROM rooms r JOIN hotels h ON h.id = r.hotel_id WHERE r.hotel_id = $1 ORDER BY h.name, r.name`,
          [hotelId]
        )
      : await pool.query(
          `SELECT r.id AS room_id, r.name AS room_name, r.status AS room_status, h.name AS hotel_name
           FROM rooms r JOIN hotels h ON h.id = r.hotel_id ORDER BY h.name, r.name`
        )
    const bookings = await pool.query(
      `SELECT room_id, to_char(check_in, 'YYYY-MM-DD') AS check_in, to_char(check_out, 'YYYY-MM-DD') AS check_out
       FROM bookings
       WHERE status IN ('pending', 'confirmed')
         AND check_in < $2::date AND check_out > $1::date`,
      [start, endExclusive]
    )
    const stops = await pool.query(
      `SELECT id, room_id, to_char(start_date, 'YYYY-MM-DD') AS start_date, to_char(end_date, 'YYYY-MM-DD') AS end_date
       FROM crs_stopsell
       WHERE start_date <= $2::date AND end_date >= $1::date`,
      [start, end]
    )
    const rooms = roomsQ.rows.map((room) => {
      const cells = {}
      for (const date of dates) {
        if (room.room_status === 'maintenance') {
          cells[date] = { status: 'maintenance' }
          continue
        }
        const booked = bookings.rows.find(
          (b) => b.room_id === room.room_id && b.check_in <= date && b.check_out > date
        )
        if (booked) {
          cells[date] = { status: 'booked' }
          continue
        }
        const stop = stops.rows.find(
          (s) => s.room_id === room.room_id && s.start_date <= date && s.end_date >= date
        )
        cells[date] = stop ? { status: 'blocked', stop_id: stop.id } : { status: 'available' }
      }
      return { ...room, cells }
    })
    const counts = { available: 0, booked: 0, blocked: 0, maintenance: 0 }
    rooms.forEach((room) => {
      dates.forEach((date) => {
        counts[room.cells[date].status] += 1
      })
    })
    res.json({ from: start, days, dates, rooms, counts })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/crs/stopsell', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const { room_id, start_date, end_date, reason } = req.body || {}
    if (!room_id || !start_date) return res.status(400).json({ error: 'Select a room and date.' })
    const end = end_date || start_date
    if (end < start_date) return res.status(400).json({ error: 'End date must be on or after the start date.' })
    const room = await pool.query('SELECT id, name FROM rooms WHERE id = $1', [room_id])
    if (!room.rows[0]) return res.status(404).json({ error: 'Room not found.' })
    const r = await pool.query(
      `INSERT INTO crs_stopsell (room_id, start_date, end_date, reason)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [room_id, start_date, end, reason || 'Stop sell']
    )
    await writeAudit(req, {
      action: 'create',
      entity: 'crs_stopsell',
      entityId: r.rows[0].id,
      summary: `Closed “${room.rows[0].name}” ${start_date}${end !== start_date ? `–${end}` : ''}`,
    })
    res.status(201).json({ ok: true, id: r.rows[0].id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/crs/stopsell/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const r = await pool.query('DELETE FROM crs_stopsell WHERE id = $1 RETURNING id, room_id', [req.params.id])
    if (!r.rows[0]) return res.status(404).json({ error: 'Stop-sell not found.' })
    await writeAudit(req, {
      action: 'delete',
      entity: 'crs_stopsell',
      entityId: r.rows[0].id,
      summary: 'Opened dates for sale',
    })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

function vipFromPoints(points) {
  const n = Number(points || 0)
  if (n >= 2500) return 'platinum'
  if (n >= 1000) return 'gold'
  if (n >= 500) return 'silver'
  return 'regular'
}

async function ensureGuestProfile(userId) {
  if (!userId) return null
  await pool.query(
    `INSERT INTO guest_profiles (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  )
  const r = await pool.query('SELECT * FROM guest_profiles WHERE user_id = $1', [userId])
  return r.rows[0] || null
}

async function applyLoyalty(userId, type, points, description, bookingId = null) {
  const profile = await ensureGuestProfile(userId)
  if (!profile) throw new Error('Guest profile not found.')
  const amount = Math.abs(parseInt(points, 10) || 0)
  if (!amount) throw new Error('Enter a point amount.')
  let next = Number(profile.loyalty_points || 0)
  if (type === 'earn' || (type === 'adjustment' && Number(points) > 0)) next += amount
  else if (type === 'redeem' || (type === 'adjustment' && Number(points) < 0)) {
    if (amount > next) throw new Error('Not enough loyalty points.')
    next -= amount
  } else {
    throw new Error('Invalid loyalty type.')
  }
  const vip = vipFromPoints(next)
  await pool.query(
    `UPDATE guest_profiles SET loyalty_points = $1, vip_status = $2 WHERE user_id = $3`,
    [next, vip, userId]
  )
  await pool.query(
    `INSERT INTO loyalty_transactions (user_id, booking_id, type, points, description)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, bookingId, type, amount, description || null]
  )
  return { loyalty_points: next, vip_status: vip }
}

async function awardStayPoints(booking) {
  if (!booking?.user_id || !booking?.id) return
  const exists = await pool.query(
    `SELECT 1 FROM loyalty_transactions WHERE booking_id = $1 AND type = 'earn' LIMIT 1`,
    [booking.id]
  )
  if (exists.rows[0]) return
  const points = Math.max(1, Math.floor(Number(booking.total_price || 0)))
  await applyLoyalty(booking.user_id, 'earn', points, `Stay reward for booking #${booking.id}`, booking.id)
}

async function ensureCrmTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guest_profiles (
      user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      loyalty_points INT NOT NULL DEFAULT 0,
      vip_status VARCHAR(20) NOT NULL DEFAULT 'regular'
        CHECK (vip_status IN ('regular', 'silver', 'gold', 'platinum')),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      booking_id INT REFERENCES bookings(id) ON DELETE SET NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'redeem', 'adjustment')),
      points INT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query('CREATE INDEX IF NOT EXISTS idx_loyalty_user ON loyalty_transactions(user_id)')
  await pool.query(`
    CREATE TABLE IF NOT EXISTS crm_campaigns (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      audience VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'vip', 'stayed')),
      subject VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
      sent_count INT NOT NULL DEFAULT 0,
      sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS crm_communications (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      campaign_id INT REFERENCES crm_campaigns(id) ON DELETE SET NULL,
      subject VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query(
    `INSERT INTO guest_profiles (user_id)
     SELECT id FROM users WHERE role = 'guest'
     ON CONFLICT (user_id) DO NOTHING`
  )
}

async function campaignAudience(audience) {
  if (audience === 'vip') {
    return pool.query(
      `SELECT u.id, u.username, u.email FROM users u
       JOIN guest_profiles p ON p.user_id = u.id
       WHERE u.role = 'guest' AND p.vip_status <> 'regular'
       ORDER BY u.username`
    )
  }
  if (audience === 'stayed') {
    return pool.query(
      `SELECT DISTINCT u.id, u.username, u.email FROM users u
       JOIN bookings b ON b.user_id = u.id AND b.status IN ('confirmed', 'completed')
       WHERE u.role = 'guest'
       ORDER BY u.username`
    )
  }
  return pool.query(
    `SELECT id, username, email FROM users WHERE role = 'guest' ORDER BY username`
  )
}

app.get('/api/crm/loyalty', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    await pool.query(
      `INSERT INTO guest_profiles (user_id)
       SELECT id FROM users WHERE role = 'guest'
       ON CONFLICT (user_id) DO NOTHING`
    )
    const guests = await pool.query(
      `SELECT u.id, u.username, u.email, to_char(u.created_at, 'YYYY-MM-DD') AS joined,
              p.loyalty_points, p.vip_status, p.notes,
              COUNT(b.id) FILTER (WHERE b.status IN ('confirmed', 'completed'))::int AS stays,
              COALESCE(SUM(b.total_price) FILTER (WHERE b.status IN ('confirmed', 'completed')), 0) AS spend
       FROM users u
       JOIN guest_profiles p ON p.user_id = u.id
       LEFT JOIN bookings b ON b.user_id = u.id
       WHERE u.role = 'guest'
       GROUP BY u.id, u.username, u.email, u.created_at, p.loyalty_points, p.vip_status, p.notes
       ORDER BY p.loyalty_points DESC, u.username`
    )
    const tx = req.query.user_id
      ? await pool.query(
          `SELECT id, user_id, booking_id, type, points, description,
                  to_char(created_at, 'YYYY-MM-DD HH24:MI') AS created_at
           FROM loyalty_transactions WHERE user_id = $1 ORDER BY id DESC LIMIT 50`,
          [req.query.user_id]
        )
      : await pool.query(
          `SELECT t.id, t.user_id, u.username, t.booking_id, t.type, t.points, t.description,
                  to_char(t.created_at, 'YYYY-MM-DD HH24:MI') AS created_at
           FROM loyalty_transactions t JOIN users u ON u.id = t.user_id
           ORDER BY t.id DESC LIMIT 40`
        )
    res.json({ guests: guests.rows, transactions: tx.rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/crm/loyalty', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const { user_id, type, points, description } = req.body || {}
    if (!user_id) return res.status(400).json({ error: 'Select a guest.' })
    const kind = ['earn', 'redeem', 'adjustment'].includes(type) ? type : null
    if (!kind) return res.status(400).json({ error: 'Choose earn, redeem, or adjustment.' })
    const amount = Number(points)
    if (!amount || Number.isNaN(amount)) return res.status(400).json({ error: 'Enter a point amount.' })
    const result = await applyLoyalty(user_id, kind, amount, description || `Staff ${kind}`)
    await writeAudit(req, {
      action: 'update',
      entity: 'crm_loyalty',
      entityId: user_id,
      summary: `${kind} ${Math.abs(amount)} loyalty points`,
    })
    res.status(201).json({ ok: true, ...result })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.get('/api/crm/campaigns', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const r = await pool.query(
      `SELECT id, name, audience, subject, message, status, sent_count,
              to_char(sent_at, 'YYYY-MM-DD HH24:MI') AS sent_at,
              to_char(created_at, 'YYYY-MM-DD') AS created_at
       FROM crm_campaigns ORDER BY id DESC`
    )
    res.json(r.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/crm/campaigns', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const { name, audience, subject, message } = req.body || {}
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Campaign name is required.' })
    if (!subject || !String(subject).trim()) return res.status(400).json({ error: 'Subject is required.' })
    if (!message || !String(message).trim()) return res.status(400).json({ error: 'Message is required.' })
    const aud = ['all', 'vip', 'stayed'].includes(audience) ? audience : 'all'
    const r = await pool.query(
      `INSERT INTO crm_campaigns (name, audience, subject, message)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [String(name).trim(), aud, String(subject).trim(), String(message).trim()]
    )
    await writeAudit(req, {
      action: 'create',
      entity: 'crm_campaign',
      entityId: r.rows[0].id,
      summary: `Created campaign “${String(name).trim()}”`,
    })
    res.status(201).json({ ok: true, id: r.rows[0].id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/crm/campaigns/:id/send', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const current = await pool.query('SELECT * FROM crm_campaigns WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Campaign not found.' })
    const row = current.rows[0]
    if (row.status === 'sent') return res.status(400).json({ error: 'This campaign was already sent.' })
    const targets = await campaignAudience(row.audience)
    if (!targets.rows.length) return res.status(400).json({ error: 'No guests match this audience yet.' })
    for (const guest of targets.rows) {
      await pool.query(
        `INSERT INTO crm_communications (user_id, campaign_id, subject, message)
         VALUES ($1, $2, $3, $4)`,
        [guest.id, row.id, row.subject, row.message]
      )
    }
    await pool.query(
      `UPDATE crm_campaigns SET status = 'sent', sent_count = $1, sent_at = NOW() WHERE id = $2`,
      [targets.rows.length, row.id]
    )
    await writeAudit(req, {
      action: 'update',
      entity: 'crm_campaign',
      entityId: row.id,
      summary: `Sent campaign “${row.name}” to ${targets.rows.length} guests`,
    })
    res.json({ ok: true, sent_count: targets.rows.length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/crm/campaigns/:id', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const current = await pool.query('SELECT id, name, status FROM crm_campaigns WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Campaign not found.' })
    if (current.rows[0].status === 'sent') return res.status(400).json({ error: 'A sent campaign cannot be deleted.' })
    await pool.query('DELETE FROM crm_campaigns WHERE id = $1', [req.params.id])
    await writeAudit(req, {
      action: 'delete',
      entity: 'crm_campaign',
      entityId: current.rows[0].id,
      summary: `Deleted draft campaign “${current.rows[0].name}”`,
    })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/crm/communications', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const params = []
    let where = ''
    if (req.query.user_id) {
      params.push(req.query.user_id)
      where = `WHERE c.user_id = $${params.length}`
    }
    const r = await pool.query(
      `SELECT c.id, c.user_id, u.username, u.email, c.campaign_id, cam.name AS campaign_name,
              c.subject, c.message, to_char(c.created_at, 'YYYY-MM-DD HH24:MI') AS created_at
       FROM crm_communications c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN crm_campaigns cam ON cam.id = c.campaign_id
       ${where}
       ORDER BY c.id DESC
       LIMIT 200`,
      params
    )
    res.json(r.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/crm/communications', async (req, res) => {
  if (!requireStaff(req, res)) return
  try {
    const { user_id, subject, message } = req.body || {}
    if (!user_id) return res.status(400).json({ error: 'Select a guest.' })
    if (!subject || !String(subject).trim()) return res.status(400).json({ error: 'Subject is required.' })
    if (!message || !String(message).trim()) return res.status(400).json({ error: 'Message is required.' })
    const guest = await pool.query(`SELECT id, username FROM users WHERE id = $1 AND role = 'guest'`, [user_id])
    if (!guest.rows[0]) return res.status(404).json({ error: 'Guest not found.' })
    const r = await pool.query(
      `INSERT INTO crm_communications (user_id, subject, message)
       VALUES ($1, $2, $3) RETURNING id`,
      [user_id, String(subject).trim(), String(message).trim()]
    )
    await writeAudit(req, {
      action: 'create',
      entity: 'crm_communication',
      entityId: r.rows[0].id,
      summary: `Message to ${guest.rows[0].username}: ${String(subject).trim()}`,
    })
    res.status(201).json({ ok: true, id: r.rows[0].id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

pool.query('SELECT 1').then(async () => {
  await ensureCrmTables()
  await ensureCrsTables()
  await ensureGalleryColumns()
  await ensureFinanceTables()
  await ensureHrTables()
  await ensureHousekeepingTables()
  await ensurePayrollExpenseLink()
  await ensureGuestTables()
  await ensureAuditTable()
  await ensureUserSecurity()
  app.listen(PORT, () => {
    console.log(`Hotel Booking API (Node + pg) at http://localhost:${PORT}`)
    console.log(`  PostgreSQL: ${process.env.PGDATABASE || 'hotel_booking'}`)
  })
}).catch((e) => {
  console.error('PostgreSQL connection failed:', e.message)
  console.error('Start PostgreSQL (e.g. brew services start postgresql@16) and set PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE if needed.')
  process.exit(1)
})
