import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outboxDir = join(__dirname, 'mail-outbox')

const HOTEL = {
  name: process.env.MAIL_FROM_NAME || 'Smile Hotel MS',
  email: process.env.MAIL_FROM_EMAIL || 'noreply@smilerental.com',
  phone: process.env.MAIL_HOTEL_PHONE || '+855 98 944 686',
  address: process.env.MAIL_HOTEL_ADDRESS || 'Sangkat Tul Kok, Khan Tul Kok, Phnom Penh',
}

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'http://localhost:5173').replace(/\/$/, '')

function money(n) {
  const amount = Number(n)
  const abs = Math.abs(Number.isFinite(amount) ? amount : 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return amount < 0 ? `($${abs})` : `$${abs}`
}

export function isDeliverableEmail(value) {
  const email = String(value || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false
  const host = email.split('@')[1]
  if (!host || host === 'localhost' || host.endsWith('.local')) return false
  return true
}

function fromHeader() {
  return `${HOTEL.name} <${HOTEL.email}>`
}

function smtpConfigured() {
  return Boolean(process.env.MAIL_HOST && process.env.MAIL_USER)
}

async function getTransport() {
  if (!smtpConfigured()) return null
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: process.env.MAIL_SECURE === '1' || process.env.MAIL_PORT === '465',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS || '',
    },
  })
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stayRows(stay) {
  return [
    ['Booking', `#${stay.id}`],
    ['Property', stay.hotelName],
    ['Room', stay.roomName],
    ['Check-in', `${stay.checkIn} from 2:00 pm`],
    ['Check-out', `${stay.checkOut} until 12:00 pm`],
    ['Guests', String(stay.guests || 1)],
    ['Stay total', money(stay.total)],
  ]
}

function copyFor(kind, stay) {
  if (kind === 'confirmed') {
    return {
      headline: 'Your stay is confirmed',
      intro: `${HOTEL.name} has confirmed your request. The room is held for your dates.`,
      next: `Please arrive from 2:00 pm on ${stay.checkIn}. Bring photo ID that matches the booking name. Pay the quoted stay at the front desk unless we have arranged otherwise.`,
      subject: `${HOTEL.name}: booking #${stay.id} confirmed`,
      cta: true,
    }
  }
  if (kind === 'changed') {
    return {
      headline: 'Your stay dates were updated',
      intro: `${HOTEL.name} has updated this booking. The new dates and total are below.`,
      next: `Please arrive from 2:00 pm on ${stay.checkIn}. If you did not ask for this change, call ${HOTEL.phone}.`,
      subject: `${HOTEL.name}: booking #${stay.id} dates updated`,
      cta: true,
    }
  }
  return {
    headline: 'Your booking was cancelled',
    intro: `${HOTEL.name} has cancelled this booking. Those dates are no longer held.`,
    next: `If this was a mistake, reply to this email or call ${HOTEL.phone}. You can request another room on our website.`,
    subject: `${HOTEL.name}: booking #${stay.id} cancelled`,
    cta: false,
  }
}

function buildBodies(kind, stay) {
  const guest = stay.guestName || 'Guest'
  const copy = copyFor(kind, stay)
  const rows = stayRows(stay)
    .map(([label, value]) => `<tr><td style="padding:8px 0;color:#78716c;width:140px">${escapeHtml(label)}</td><td style="padding:8px 0;color:#1c1917;font-weight:600">${escapeHtml(value)}</td></tr>`)
    .join('')
  const html = `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f4;font-family:Georgia,serif">
  <div style="max-width:560px;margin:24px auto;background:#fff;border:1px solid #e7e5e4;padding:32px">
    <p style="margin:0;letter-spacing:.16em;font-size:11px;color:#0f766e;text-transform:uppercase">${escapeHtml(HOTEL.name)}</p>
    <h1 style="margin:12px 0 8px;font-size:26px;color:#1c1917">${copy.headline}</h1>
    <p style="margin:0 0 16px;color:#44403c;line-height:1.5">Hello ${escapeHtml(guest)},</p>
    <p style="margin:0 0 16px;color:#44403c;line-height:1.5">${escapeHtml(copy.intro)}</p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 16px">${rows}</table>
    <p style="margin:0 0 16px;color:#44403c;line-height:1.5">${escapeHtml(copy.next)}</p>
    ${copy.cta ? `<p style="margin:0 0 24px"><a href="${SITE_URL}/my-bookings" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px">View my bookings</a></p>` : ''}
    <p style="margin:0;font-size:13px;color:#78716c;line-height:1.5">${escapeHtml(HOTEL.address)}<br>${escapeHtml(HOTEL.phone)} · ${escapeHtml(HOTEL.email)}<br>Desk daily, 7:00 am – 10:00 pm</p>
  </div>
</body></html>`
  const text = [
    `${HOTEL.name} — ${copy.headline}`,
    '',
    `Hello ${guest},`,
    copy.intro,
    '',
    ...stayRows(stay).map(([label, value]) => `${label}: ${value}`),
    '',
    copy.next,
    copy.cta ? `My bookings: ${SITE_URL}/my-bookings` : '',
    '',
    HOTEL.address,
    `${HOTEL.phone} · ${HOTEL.email}`,
  ].filter(Boolean).join('\n')
  return { subject: copy.subject, html, text }
}

function storeCopy(to, subject, html) {
  mkdirSync(outboxDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const safeTo = String(to).replace(/[^a-z0-9@._-]/gi, '_')
  const path = join(outboxDir, `${stamp}-${safeTo}.html`)
  const wrapped = `<!-- to: ${to} -->\n<!-- subject: ${subject} -->\n${html}`
  writeFileSync(path, wrapped, 'utf8')
  return path
}

export async function sendStayEmail(kind, stay) {
  const to = String(stay.email || '').trim()
  if (!isDeliverableEmail(to)) {
    return { sent: false, stored: false, skipped: true, to: to || '', reason: 'No deliverable guest email' }
  }
  const { subject, html, text } = buildBodies(kind, stay)
  const previewPath = storeCopy(to, subject, html)
  if (!smtpConfigured()) {
    console.log(`[mail] SMTP not set. Saved copy for ${to}: ${previewPath}`)
    return {
      sent: false,
      stored: true,
      skipped: false,
      to,
      previewPath,
      reason: 'SMTP is not configured; a copy was saved on the server',
    }
  }
  try {
    const transport = await getTransport()
    await transport.sendMail({ from: fromHeader(), to, subject, text, html })
    return { sent: true, stored: true, skipped: false, to, previewPath }
  } catch (e) {
    console.error('[mail] send failed', e.message)
    return {
      sent: false,
      stored: true,
      skipped: false,
      to,
      previewPath,
      reason: e.message || 'Email failed',
    }
  }
}

export function mailConfigured() {
  return smtpConfigured()
}

export function outboxExists() {
  return existsSync(outboxDir)
}
