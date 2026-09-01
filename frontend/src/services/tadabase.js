import axios from 'axios'

const baseURL = import.meta.env.VITE_TADABASE_API_URL || ''
const apiKey = import.meta.env.VITE_TADABASE_API_KEY || ''

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    ...(apiKey && { 'X-API-Key': apiKey }),
  },
})

// Tadabase returns records in different shapes; normalize to array of objects.
// Adjust field names to match your Tadabase table field IDs (e.g. field_1, field_2) or use column names if your API returns them.
function normalizeRecords(res) {
  const data = res?.data
  if (Array.isArray(data)) return data
  if (data?.records) return data.records
  if (data?.data) return Array.isArray(data.data) ? data.data : [data.data]
  return []
}

export async function getHotels() {
  const tableId = import.meta.env.VITE_TADABASE_TABLE_HOTELS || 'hotels'
  const { data } = await client.get(`/tables/${tableId}/records`)
  return normalizeRecords({ data })
}

export async function getRooms(params = {}) {
  const tableId = import.meta.env.VITE_TADABASE_TABLE_ROOMS || 'rooms'
  const { data } = await client.get(`/tables/${tableId}/records`, { params })
  return normalizeRecords({ data })
}

export async function getRoom(id) {
  const tableId = import.meta.env.VITE_TADABASE_TABLE_ROOMS || 'rooms'
  const { data } = await client.get(`/tables/${tableId}/records/${id}`)
  return data?.record ?? data
}

export async function getBookings(params = {}) {
  const tableId = import.meta.env.VITE_TADABASE_TABLE_BOOKINGS || 'bookings'
  const { data } = await client.get(`/tables/${tableId}/records`, { params })
  return normalizeRecords({ data })
}

export async function createBooking(payload) {
  const tableId = import.meta.env.VITE_TADABASE_TABLE_BOOKINGS || 'bookings'
  const { data } = await client.post(`/tables/${tableId}/records`, payload)
  return data?.record ?? data
}

export async function getTestimonials() {
  const tableId = import.meta.env.VITE_TADABASE_TABLE_TESTIMONIALS || 'testimonials'
  const { data } = await client.get(`/tables/${tableId}/records`)
  return normalizeRecords({ data })
}

export async function getServices() {
  const tableId = import.meta.env.VITE_TADABASE_TABLE_SERVICES || 'services'
  const { data } = await client.get(`/tables/${tableId}/records`)
  return normalizeRecords({ data })
}

export async function getContacts() {
  const tableId = import.meta.env.VITE_TADABASE_TABLE_CONTACTS || 'contacts'
  const { data } = await client.get(`/tables/${tableId}/records`)
  return normalizeRecords({ data })
}

export async function createContact(payload) {
  const tableId = import.meta.env.VITE_TADABASE_TABLE_CONTACTS || 'contacts'
  const { data } = await client.post(`/tables/${tableId}/records`, payload)
  return data?.record ?? data
}

export async function updateBookingStatus(id, status) {
  const tableId = import.meta.env.VITE_TADABASE_TABLE_BOOKINGS || 'bookings'
  const { data } = await client.patch(`/tables/${tableId}/records/${id}`, { status })
  return data?.record ?? data
}

export async function updateContactStatus(id, status) {
  const tableId = import.meta.env.VITE_TADABASE_TABLE_CONTACTS || 'contacts'
  const { data } = await client.patch(`/tables/${tableId}/records/${id}`, { status })
  return data?.record ?? data
}

export async function getUsers(params = {}) {
  const tableId = import.meta.env.VITE_TADABASE_TABLE_USERS || 'users'
  const { data } = await client.get(`/tables/${tableId}/records`, { params })
  return normalizeRecords({ data })
}

// POS Products (admin, from Tadabase)
export async function getPosProducts(params = {}) {
  const tableId = import.meta.env.VITE_TADABASE_TABLE_POS_PRODUCTS || 'pos_products'
  const { data } = await client.get(`/tables/${tableId}/records`, { params })
  return normalizeRecords({ data })
}

// POS Transactions (admin, from Tadabase)
export async function getPosTransactions(params = {}) {
  const tableId = import.meta.env.VITE_TADABASE_TABLE_POS_TRANSACTIONS || 'pos_transactions'
  const { data } = await client.get(`/tables/${tableId}/records`, { params })
  return normalizeRecords({ data })
}

export async function createPosTransaction(payload) {
  const tableId = import.meta.env.VITE_TADABASE_TABLE_POS_TRANSACTIONS || 'pos_transactions'
  const { data } = await client.post(`/tables/${tableId}/records`, payload)
  return data?.record ?? data
}

export default client
