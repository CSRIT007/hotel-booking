/**
 * Finance calculations shared by Revenue, Expenses, and Profit admin pages.
 *
 * Recognized revenue:
 *   rooms = confirmed + completed bookings
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

export function formatMoney(n) {
  return `$${toMoney(n).toFixed(2)}`
}

export function monthKey(value) {
  if (!value) return 'Unknown'
  const text = String(value)
  const match = text.match(/^(\d{4}-\d{2})/)
  if (match) return match[1]
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Unknown'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatDate(value) {
  if (!value) return '—'
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return text
  return d.toISOString().slice(0, 10)
}

export function isRoomRevenue(booking) {
  return booking.status === 'confirmed' || booking.status === 'completed'
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

  const roomRevenue = roomItems.reduce((sum, b) => sum + toMoney(b.total_price), 0)
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
    room[key] = (room[key] || 0) + toMoney(b.total_price)
  }
  for (const t of transactions.filter(isPosRevenue)) {
    const key = monthKey(t.created_at)
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
