/**
 * Local API client — talks to Node + pg backend (proxy /api in dev, or VITE_API_URL in prod).
 */
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || ''

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

function throwApiError(e, fallback) {
  throw new Error(e.response?.data?.error || e.message || fallback)
}

export async function getHotels() {
  const { data } = await client.get('/api/hotels')
  return Array.isArray(data) ? data : []
}

export async function createHotel(payload) {
  try {
    const { data } = await client.post('/api/hotels', payload)
    return data
  } catch (e) {
    throwApiError(e, 'Failed to add property')
  }
}

export async function updateHotel(id, payload) {
  try {
    const { data } = await client.patch(`/api/hotels/${id}`, payload)
    return data
  } catch (e) {
    throwApiError(e, 'Failed to update property')
  }
}

export async function deleteHotel(id) {
  try {
    const { data } = await client.delete(`/api/hotels/${id}`)
    return data
  } catch (e) {
    throwApiError(e, 'Failed to remove property')
  }
}

export async function getRooms(params = {}) {
  const { data } = await client.get('/api/rooms', { params })
  return Array.isArray(data) ? data : []
}

export async function getRoom(id) {
  const { data } = await client.get(`/api/rooms/${id}`)
  return data
}

export async function createRoom(payload) {
  try {
    const { data } = await client.post('/api/rooms', payload)
    return data
  } catch (e) {
    throwApiError(e, 'Failed to add room')
  }
}

export async function updateRoom(id, payload) {
  try {
    const { data } = await client.patch(`/api/rooms/${id}`, payload)
    return data
  } catch (e) {
    throwApiError(e, 'Failed to update room')
  }
}

export async function deleteRoom(id) {
  try {
    const { data } = await client.delete(`/api/rooms/${id}`)
    return data
  } catch (e) {
    throwApiError(e, 'Failed to remove room')
  }
}

export async function createBooking(payload) {
  const { data } = await client.post('/api/bookings', payload)
  return data
}

export async function getTestimonials() {
  const { data } = await client.get('/api/testimonials')
  return Array.isArray(data) ? data : []
}

export async function getServices() {
  const { data } = await client.get('/api/services')
  return Array.isArray(data) ? data : []
}

export async function createContact(payload) {
  const { data } = await client.post('/api/contacts', payload)
  return data
}

// Admin: all bookings (no user_id)
export async function getAllBookings() {
  const { data } = await client.get('/api/bookings')
  return Array.isArray(data) ? data : []
}

export async function updateBookingStatus(id, status) {
  const { data } = await client.patch(`/api/bookings/${id}`, { status })
  return data
}

export async function getContacts() {
  const { data } = await client.get('/api/contacts')
  return Array.isArray(data) ? data : []
}

export async function getStaffAlerts() {
  const { data } = await client.get('/api/staff-alerts')
  return data || { new_messages: 0, pending_bookings: 0, latest_message: null }
}

export async function updateContactStatus(id, status) {
  const { data } = await client.patch(`/api/contacts/${id}`, { status })
  return data
}

export async function getUsers(params = {}) {
  const { data } = await client.get('/api/users', { params })
  return Array.isArray(data) ? data : []
}

// POS Products (admin, from PostgreSQL)
export async function getPosProducts() {
  const { data } = await client.get('/api/pos-products')
  return Array.isArray(data) ? data : []
}

// POS Transactions (admin, from PostgreSQL)
export async function getPosTransactions() {
  const { data } = await client.get('/api/pos-transactions')
  return Array.isArray(data) ? data : []
}

export async function createPosTransaction(payload) {
  const { data } = await client.post('/api/pos-transactions', payload)
  return data
}

export async function getMyBookings(userId) {
  const { data } = await client.get('/api/bookings', { params: { user_id: userId } })
  return Array.isArray(data) ? data : []
}

export async function getNotifications(userId) {
  const { data } = await client.get('/api/notifications', { params: { user_id: userId } })
  return Array.isArray(data) ? data : []
}

export async function markNotificationsRead(userId) {
  const { data } = await client.patch('/api/notifications/read', { user_id: userId })
  return data
}

export async function getExpenses() {
  const { data } = await client.get('/api/expenses')
  return Array.isArray(data) ? data : []
}

export async function createExpense(payload) {
  const { data } = await client.post('/api/expenses', payload)
  return data
}

export async function deleteExpense(id) {
  const { data } = await client.delete(`/api/expenses/${id}`)
  return data
}
