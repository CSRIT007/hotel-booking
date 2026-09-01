/**
 * Local API client — talks to Node + pg backend (proxy /api in dev, or VITE_API_URL in prod).
 */
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || ''

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

export async function getHotels() {
  const { data } = await client.get('/api/hotels')
  return Array.isArray(data) ? data : []
}

export async function getRooms(params = {}) {
  const { data } = await client.get('/api/rooms', { params })
  return Array.isArray(data) ? data : []
}

export async function getRoom(id) {
  const { data } = await client.get(`/api/rooms/${id}`)
  return data
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
