/**
 * Data layer: uses Local API (Node+pg) when VITE_USE_LOCAL_API is set,
 * else Tadabase when VITE_TADABASE_API_URL is set, otherwise mock data.
 */
import * as localApi from './localApi'
import * as tadabase from './tadabase'

const hasLocalApi = import.meta.env.VITE_USE_LOCAL_API === 'true' || import.meta.env.VITE_USE_LOCAL_API === '1'
const hasTadabase = !!import.meta.env.VITE_TADABASE_API_URL

const mockHotels = [
  { id: 1, name: 'Sheraton', description: 'Comfort and style in the heart of the city.', location: 'Cairo', image: '/images/services-1.jpg' },
  { id: 2, name: 'The Plaza Hotel', description: 'Premium accommodation with excellent service.', location: 'New York', image: '/images/image_4.jpg' },
  { id: 3, name: 'The Ritz', description: 'Luxury and elegance for every guest.', location: 'Paris', image: '/images/image_4.jpg' },
]

const mockRooms = [
  { id: 1, hotel_id: 1, name: 'Suite Room', description: 'Luxurious suite with modern amenities', price: 120, max_persons: 3, size: '45 m2', view_type: 'Sea View', beds: 1, image: '/images/room-1.jpg', status: 'available', hotel_name: 'Sheraton' },
  { id: 2, hotel_id: 1, name: 'Standard Room', description: 'Comfortable standard room', price: 80, max_persons: 2, size: '30 m2', view_type: 'City View', beds: 1, image: '/images/room-2.jpg', status: 'available', hotel_name: 'Sheraton' },
  { id: 3, hotel_id: 1, name: 'Family Room', description: 'Spacious room for families', price: 150, max_persons: 4, size: '60 m2', view_type: 'Sea View', beds: 2, image: '/images/room-3.jpg', status: 'available', hotel_name: 'Sheraton' },
  { id: 4, hotel_id: 1, name: 'Deluxe Room', description: 'Premium deluxe accommodation', price: 200, max_persons: 3, size: '50 m2', view_type: 'Sea View', beds: 1, image: '/images/room-4.jpg', status: 'available', hotel_name: 'Sheraton' },
]

const mockTestimonials = [
  { id: 1, name: 'Racky Henderson', position: 'Father', message: 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.', image: '/images/person_1.jpg', rating: 5 },
  { id: 2, name: 'Henry Dee', position: 'Businesswoman', message: 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.', image: '/images/person_2.jpg', rating: 5 },
]

const mockServices = [
  { id: 1, name: 'Map Direction', description: 'Easy directions to reach us.', icon: 'flaticon-map', image: '/images/services-1.jpg', status: 'active' },
  { id: 2, name: 'Accommodation', description: 'Comfortable rooms and amenities.', icon: 'flaticon-hotel', image: '/images/services-2.jpg', status: 'active' },
  { id: 3, name: 'Great Experience', description: 'Memorable stays for every guest.', icon: 'flaticon-star', image: '/images/image_2.jpg', status: 'active' },
]

function ensureImagePath(path) {
  if (!path || typeof path !== 'string') return path
  if (path.startsWith('http')) return path
  return path.startsWith('/') ? path : `/${path}`
}

function mapRecord(r) {
  if (!r) return r
  const id = r.id ?? r.field_id ?? r.record_id
  const out = { ...r, id }
  if (out.image) out.image = ensureImagePath(out.image)
  return out
}

export async function getHotels() {
  if (hasLocalApi) {
    try {
      const list = await localApi.getHotels()
      return list.map(mapRecord)
    } catch (e) {
      console.warn('Local API getHotels failed, using mock:', e.message)
    }
  }
  if (hasTadabase) {
    try {
      const list = await tadabase.getHotels()
      return list.map(mapRecord)
    } catch (e) {
      console.warn('Tadabase getHotels failed, using mock:', e.message)
    }
  }
  return mockHotels
}

export async function createHotel(payload) {
  if (hasLocalApi) return await localApi.createHotel(payload)
  throw new Error('No API configured')
}

export async function updateHotel(id, payload) {
  if (hasLocalApi) return await localApi.updateHotel(id, payload)
  throw new Error('No API configured')
}

export async function deleteHotel(id) {
  if (hasLocalApi) return await localApi.deleteHotel(id)
  throw new Error('No API configured')
}

export async function getRooms(params = {}) {
  if (hasLocalApi) {
    try {
      const list = await localApi.getRooms(params)
      return list.map(mapRecord)
    } catch (e) {
      console.warn('Local API getRooms failed, using mock:', e.message)
    }
  }
  if (hasTadabase) {
    try {
      const list = await tadabase.getRooms(params)
      return list.map(mapRecord)
    } catch (e) {
      console.warn('Tadabase getRooms failed, using mock:', e.message)
    }
  }
  const hotelId = params?.hotel_id ?? params?.hotel
  if (hotelId) {
    return mockRooms.filter((r) => String(r.hotel_id) === String(hotelId))
  }
  return mockRooms
}

export async function getRoom(id) {
  if (hasLocalApi) {
    try {
      const r = await localApi.getRoom(id)
      return mapRecord(r)
    } catch (e) {
      console.warn('Local API getRoom failed, using mock:', e.message)
    }
  }
  if (hasTadabase) {
    try {
      const r = await tadabase.getRoom(id)
      return mapRecord(r)
    } catch (e) {
      console.warn('Tadabase getRoom failed, using mock:', e.message)
    }
  }
  const room = mockRooms.find((r) => String(r.id) === String(id))
  if (room) return { ...room, hotel_name: mockHotels.find((h) => h.id === room.hotel_id)?.name }
  return null
}

export async function createRoom(payload) {
  if (hasLocalApi) return await localApi.createRoom(payload)
  throw new Error('No API configured')
}

export async function updateRoom(id, payload) {
  if (hasLocalApi) return await localApi.updateRoom(id, payload)
  throw new Error('No API configured')
}

export async function deleteRoom(id) {
  if (hasLocalApi) return await localApi.deleteRoom(id)
  throw new Error('No API configured')
}

export async function createBooking(payload) {
  if (hasLocalApi) {
    try {
      return await localApi.createBooking(payload)
    } catch (e) {
      throw new Error(e.response?.data?.message || e.message || 'Booking failed')
    }
  }
  if (hasTadabase) {
    try {
      return await tadabase.createBooking(payload)
    } catch (e) {
      throw new Error(e.response?.data?.message || e.message || 'Booking failed')
    }
  }
  return { id: Date.now(), ...payload, status: 'pending' }
}

export async function getTestimonials() {
  if (hasLocalApi) {
    try {
      const list = await localApi.getTestimonials()
      return list.map(mapRecord)
    } catch (e) {
      console.warn('Local API getTestimonials failed, using mock:', e.message)
    }
  }
  if (hasTadabase) {
    try {
      const list = await tadabase.getTestimonials()
      return list.map(mapRecord)
    } catch (e) {
      console.warn('Tadabase getTestimonials failed, using mock:', e.message)
    }
  }
  return mockTestimonials
}

export async function getServices() {
  if (hasLocalApi) {
    try {
      const list = await localApi.getServices()
      return list.map(mapRecord)
    } catch (e) {
      console.warn('Local API getServices failed, using mock:', e.message)
    }
  }
  if (hasTadabase) {
    try {
      const list = await tadabase.getServices()
      return list.map(mapRecord)
    } catch (e) {
      console.warn('Tadabase getServices failed, using mock:', e.message)
    }
  }
  return mockServices
}

export async function createContact(payload) {
  if (hasLocalApi) {
    try {
      return await localApi.createContact(payload)
    } catch (e) {
      throw new Error(e.response?.data?.message || e.message || 'Failed to send message')
    }
  }
  if (hasTadabase) {
    try {
      return await tadabase.createContact(payload)
    } catch (e) {
      throw new Error(e.response?.data?.message || e.message || 'Failed to send message')
    }
  }
  return { id: Date.now(), ...payload, status: 'new' }
}

export async function createPosTransaction(payload) {
  if (hasLocalApi) {
    try {
      return await localApi.createPosTransaction(payload)
    } catch (e) {
      throw new Error(e.response?.data?.error || e.message || 'Failed to record POS sale')
    }
  }
  if (hasTadabase) {
    try {
      return await tadabase.createPosTransaction(payload)
    } catch (e) {
      throw new Error(e.response?.data?.error || e.message || 'Failed to record POS sale')
    }
  }
  throw new Error('No API configured')
}

// ---- Admin: bookings, contacts, users (work with both Local API and Tadabase) ----

export async function getBookings(params = {}) {
  if (hasLocalApi) {
    try {
      return await localApi.getAllBookings()
    } catch (e) {
      console.warn('Local API getBookings failed:', e.message)
      return []
    }
  }
  if (hasTadabase) {
    try {
      const list = await tadabase.getBookings(params)
      return Array.isArray(list) ? list : []
    } catch (e) {
      console.warn('Tadabase getBookings failed:', e.message)
      return []
    }
  }
  return []
}

export async function getContacts() {
  if (hasLocalApi) {
    try {
      return await localApi.getContacts()
    } catch (e) {
      console.warn('Local API getContacts failed:', e.message)
      return []
    }
  }
  if (hasTadabase) {
    try {
      const list = await tadabase.getContacts()
      return Array.isArray(list) ? list : []
    } catch (e) {
      console.warn('Tadabase getContacts failed:', e.message)
      return []
    }
  }
  return []
}

export async function getUsers(params = {}) {
  if (hasLocalApi) {
    try {
      return await localApi.getUsers(params)
    } catch (e) {
      console.warn('Local API getUsers failed:', e.message)
      return []
    }
  }
  if (hasTadabase) {
    try {
      const list = await tadabase.getUsers(params)
      return Array.isArray(list) ? list : []
    } catch (e) {
      console.warn('Tadabase getUsers failed:', e.message)
      return []
    }
  }
  return []
}

export async function getPosProducts(params = {}) {
  if (hasLocalApi) {
    try {
      return await localApi.getPosProducts()
    } catch (e) {
      console.warn('Local API getPosProducts failed:', e.message)
      return []
    }
  }
  if (hasTadabase) {
    try {
      const list = await tadabase.getPosProducts(params)
      return Array.isArray(list) ? list : []
    } catch (e) {
      console.warn('Tadabase getPosProducts failed:', e.message)
      return []
    }
  }
  return []
}

export async function getPosTransactions(params = {}) {
  if (hasLocalApi) {
    try {
      return await localApi.getPosTransactions()
    } catch (e) {
      console.warn('Local API getPosTransactions failed:', e.message)
      return []
    }
  }
  if (hasTadabase) {
    try {
      const list = await tadabase.getPosTransactions(params)
      return Array.isArray(list) ? list : []
    } catch (e) {
      console.warn('Tadabase getPosTransactions failed:', e.message)
      return []
    }
  }
  return []
}

export async function updateBookingStatus(id, status) {
  if (hasLocalApi) {
    return await localApi.updateBookingStatus(id, status)
  }
  if (hasTadabase) {
    return await tadabase.updateBookingStatus(id, status)
  }
  throw new Error('No API configured')
}

export async function updateContactStatus(id, status) {
  if (hasLocalApi) {
    return await localApi.updateContactStatus(id, status)
  }
  if (hasTadabase) {
    return await tadabase.updateContactStatus(id, status)
  }
  throw new Error('No API configured')
}

export async function getExpenses() {
  if (hasLocalApi) {
    try {
      return await localApi.getExpenses()
    } catch (e) {
      console.warn('Local API getExpenses failed:', e.message)
      return []
    }
  }
  return []
}

export async function createExpense(payload) {
  if (hasLocalApi) {
    try {
      return await localApi.createExpense(payload)
    } catch (e) {
      throw new Error(e.response?.data?.error || e.message || 'Failed to save expense')
    }
  }
  throw new Error('No API configured')
}

export async function deleteExpense(id) {
  if (hasLocalApi) {
    try {
      return await localApi.deleteExpense(id)
    } catch (e) {
      throw new Error(e.response?.data?.error || e.message || 'Failed to delete expense')
    }
  }
  throw new Error('No API configured')
}

export async function getMyBookings(userId) {
  if (!userId) return []
  if (hasLocalApi) {
    try {
      return await localApi.getMyBookings(userId)
    } catch (e) {
      console.warn('Local API getMyBookings failed:', e.message)
      return []
    }
  }
  if (hasTadabase) {
    try {
      const list = await tadabase.getBookings({ user_id: userId })
      return Array.isArray(list) ? list.filter((b) => String(b.user_id) === String(userId)) : []
    } catch (e) {
      console.warn('Tadabase getMyBookings failed:', e.message)
      return []
    }
  }
  return []
}

export async function getNotifications(userId) {
  if (!userId) return []
  if (hasLocalApi) {
    try {
      return await localApi.getNotifications(userId)
    } catch (e) {
      console.warn('Local API getNotifications failed:', e.message)
      return []
    }
  }
  return []
}

export async function markNotificationsRead(userId) {
  if (!userId) return
  if (hasLocalApi) {
    try {
      return await localApi.markNotificationsRead(userId)
    } catch (e) {
      console.warn('Local API markNotificationsRead failed:', e.message)
    }
  }
}
