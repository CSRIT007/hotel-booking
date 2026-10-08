/**
 * Finance calculations shared by Revenue, Expenses, and Profit admin pages.
 *
 * Recognized revenue:
 *   rooms = folio payments collected on confirmed / in-house / completed stays
 *   POS   = paid transactions (refunded excluded)
 * Expenses: all recorded expense rows
 * Profit  = recognized revenue − expenses
 */
export const EXPENSE_CATEGORIES = [
  'Utilities',
  'Salaries',
  'Supplies',
  'Marketing',
  'Maintenance',
  'Food & Beverage',
  'Other',
]

export function toMoney(n) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

export { formatMoney } from '../utils/money'

export function monthKey(value) {
  if (!value) return 'Unknown'
  const text = String(value)
  const match = text.match(/^(\d{4}-\d{2})/)
  if (match) return match[1]
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Unknown'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function localDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function toDateKey(value) {
  if (!value) return ''
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  if (/^\d{4}-\d{2}-\d{2}/.test(text) && !text.includes('T') && !text.includes(' ')) return text.slice(0, 10)
  return localDateKey(value)
}

export function formatDate(value) {
  return toDateKey(value) || '—'
}

export function bookingFinanceDate(booking) {
  return booking?.created_at || booking?.check_in
}

export function posFinanceDate(tx) {
  return tx?.created_at || tx?.transaction_date
}

export function expenseFinanceDate(expense) {
  return expense?.expense_date || expense?.created_at
}

export function inDateRange(value, from, to) {
  const key = toDateKey(value)
  if (!from && !to) return true
  if (!key) return false
  if (from && key < from) return false
  if (to && key > to) return false
  return true
}

export function filterByDateRange(items, from, to, getDate) {
  const list = !from && !to ? items : items.filter((item) => inDateRange(getDate(item), from, to))
  return list.slice().sort((a, b) => toDateKey(getDate(b)).localeCompare(toDateKey(getDate(a))))
}

export function overlapsDateRange(start, end, from, to) {
  const s = toDateKey(start)
  const e = toDateKey(end) || s
  if (!from && !to) return true
  if (!s) return false
  if (from && e && e < from) return false
  if (to && s > to) return false
  return true
}

export function dateRangePresets(now = new Date()) {
  const today = localDateKey(now)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const yearStart = `${now.getFullYear()}-01-01`
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
  return {
    today: { from: today, to: today, label: 'Today' },
    week: { from: localDateKey(weekAgo), to: today, label: 'Last 7 days' },
    month: { from: monthStart, to: today, label: 'This month' },
    year: { from: yearStart, to: today, label: 'This year' },
    all: { from: '', to: '', label: 'All dates' },
  }
}

export function isRoomRevenue(booking) {
  return booking.status === 'confirmed' || booking.status === 'in_house' || booking.status === 'completed'
}

export function roomCollected(booking) {
  return toMoney(booking?.folio_payments)
}

export function isPosRevenue(tx) {
  return tx.status === 'paid'
}

export function summarizeFinance({ bookings = [], transactions = [], expenses = [] } = {}) {
  const roomItems = bookings.filter(isRoomRevenue)
  const posItems = transactions.filter(isPosRevenue)
  const pendingBookings = bookings.filter((b) => b.status === 'pending')
  const pendingPos = transactions.filter((t) => t.status === 'pending')
  const refundedPos = transactions.filter((t) => t.status === 'refunded')

  const roomRevenue = roomItems.reduce((sum, b) => sum + roomCollected(b), 0)
  const roomQuoted = roomItems.reduce((sum, b) => sum + toMoney(b.total_price), 0)
  const roomOutstanding = roomItems.reduce((sum, b) => {
    const bal = toMoney(b.folio_balance)
    if (b.folio_payments != null) return sum + Math.max(0, bal)
    return sum + Math.max(0, toMoney(b.total_price) - roomCollected(b))
  }, 0)
  const posRevenue = posItems.reduce((sum, t) => sum + toMoney(t.total_amount), 0)
  const pendingRevenue =
    pendingBookings.reduce((sum, b) => sum + toMoney(b.total_price), 0) +
    pendingPos.reduce((sum, t) => sum + toMoney(t.total_amount), 0)
  const refundedPosTotal = refundedPos.reduce((sum, t) => sum + toMoney(t.total_amount), 0)
  const expenseTotal = expenses.reduce((sum, e) => sum + toMoney(e.amount), 0)
  const revenue = roomRevenue + posRevenue
  const profit = revenue - expenseTotal

  return {
    roomRevenue,
    roomQuoted,
    roomOutstanding,
    posRevenue,
    revenue,
    pendingRevenue,
    refundedPosTotal,
    expenseTotal,
    profit,
    marginPercent: revenue > 0 ? (profit / revenue) * 100 : 0,
    roomItems,
    posItems,
    counts: {
      room: roomItems.length,
      pos: posItems.length,
      expenses: expenses.length,
      pendingBookings: pendingBookings.length,
    },
  }
}

export function groupSum(items, keyFn, amountFn) {
  const map = new Map()
  for (const item of items) {
    const key = keyFn(item) || 'Other'
    map.set(key, (map.get(key) || 0) + toMoney(amountFn(item)))
  }
  return Array.from(map.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
}

export function monthlySeries({ bookings = [], transactions = [], expenses = [] } = {}) {
  const months = new Set()
  const room = {}
  const pos = {}
  const exp = {}

  for (const b of bookings.filter(isRoomRevenue)) {
    const key = monthKey(b.created_at || b.check_in)
    months.add(key)
    room[key] = (room[key] || 0) + roomCollected(b)
  }
  for (const t of transactions.filter(isPosRevenue)) {
    const key = monthKey(t.created_at || t.transaction_date)
    months.add(key)
    pos[key] = (pos[key] || 0) + toMoney(t.total_amount)
  }
  for (const e of expenses) {
    const key = monthKey(e.expense_date || e.created_at)
    months.add(key)
    exp[key] = (exp[key] || 0) + toMoney(e.amount)
  }

  return Array.from(months)
    .filter((m) => m !== 'Unknown')
    .sort()
    .map((month) => {
      const roomTotal = room[month] || 0
      const posTotal = pos[month] || 0
      const expenseTotal = exp[month] || 0
      const revenue = roomTotal + posTotal
      return {
        month,
        room: roomTotal,
        pos: posTotal,
        revenue,
        expenses: expenseTotal,
        profit: revenue - expenseTotal,
      }
    })
}
