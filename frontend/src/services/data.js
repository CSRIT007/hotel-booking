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
  out.images = Array.isArray(out.images) ? out.images.map(ensureImagePath).filter(Boolean) : []
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

export async function uploadImage(file) {
  return requireLocal(() => localApi.uploadImage(file), 'Failed to upload photo')
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

export async function getStaffAlerts() {
  if (hasLocalApi) {
    try {
      return await localApi.getStaffAlerts()
    } catch (e) {
      console.warn('Local API getStaffAlerts failed:', e.message)
      return { new_messages: 0, pending_bookings: 0, latest_message: null }
    }
  }
  return { new_messages: 0, pending_bookings: 0, latest_message: null }
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

export async function createUser(payload) {
  if (hasLocalApi) return await localApi.createUser(payload)
  throw new Error('No API configured')
}

export async function updateUser(id, payload) {
  if (hasLocalApi) return await localApi.updateUser(id, payload)
  throw new Error('No API configured')
}

export async function unlockUser(id) {
  if (hasLocalApi) return await localApi.unlockUser(id)
  throw new Error('No API configured')
}

export async function resetUserPassword(id, password) {
  if (hasLocalApi) return await localApi.resetUserPassword(id, password)
  throw new Error('No API configured')
}

export async function getSecuritySummary() {
  if (hasLocalApi) {
    try {
      return await localApi.getSecuritySummary()
    } catch (e) {
      console.warn('Local API getSecuritySummary failed:', e.message)
      return null
    }
  }
  return null
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

export async function getAuditLogs(params = {}) {
  if (hasLocalApi) {
    try {
      return await localApi.getAuditLogs(params)
    } catch (e) {
      console.warn('Local API getAuditLogs failed:', e.message)
      return []
    }
  }
  return []
}

function requireLocal(fn, fallback) {
  if (!hasLocalApi) throw new Error('No API configured')
  return fn().catch((e) => {
    throw new Error(e.response?.data?.error || e.message || fallback)
  })
}

export async function getHrOrg() {
  if (!hasLocalApi) return []
  try {
    return await localApi.getHrOrg()
  } catch (e) {
    console.warn('Local API getHrOrg failed:', e.message)
    return []
  }
}

export async function createHrDepartment(payload) {
  return requireLocal(() => localApi.createHrDepartment(payload), 'Failed to add department')
}

export async function updateHrDepartment(id, payload) {
  return requireLocal(() => localApi.updateHrDepartment(id, payload), 'Failed to update department')
}

export async function deleteHrDepartment(id) {
  return requireLocal(() => localApi.deleteHrDepartment(id), 'Failed to remove department')
}

export async function createHrPosition(departmentId, payload) {
  return requireLocal(() => localApi.createHrPosition(departmentId, payload), 'Failed to add position')
}

export async function updateHrPosition(id, payload) {
  return requireLocal(() => localApi.updateHrPosition(id, payload), 'Failed to update position')
}

export async function deleteHrPosition(id) {
  return requireLocal(() => localApi.deleteHrPosition(id), 'Failed to remove position')
}

export async function getHrEmployees() {
  if (!hasLocalApi) return []
  try {
    return await localApi.getHrEmployees()
  } catch (e) {
    console.warn('Local API getHrEmployees failed:', e.message)
    return []
  }
}

export async function createHrEmployee(payload) {
  return requireLocal(() => localApi.createHrEmployee(payload), 'Failed to add employee')
}

export async function updateHrEmployee(id, payload) {
  return requireLocal(() => localApi.updateHrEmployee(id, payload), 'Failed to update employee')
}

export async function deleteHrEmployee(id) {
  return requireLocal(() => localApi.deleteHrEmployee(id), 'Failed to remove employee')
}

export async function getHrSchedules() {
  if (!hasLocalApi) return []
  try {
    return await localApi.getHrSchedules()
  } catch (e) {
    console.warn('Local API getHrSchedules failed:', e.message)
    return []
  }
}

export async function createHrSchedule(payload) {
  return requireLocal(() => localApi.createHrSchedule(payload), 'Failed to add shift')
}

export async function updateHrSchedule(id, payload) {
  return requireLocal(() => localApi.updateHrSchedule(id, payload), 'Failed to update shift')
}

export async function deleteHrSchedule(id) {
  return requireLocal(() => localApi.deleteHrSchedule(id), 'Failed to remove shift')
}

export async function getHrPayroll() {
  if (!hasLocalApi) return []
  try {
    return await localApi.getHrPayroll()
  } catch (e) {
    console.warn('Local API getHrPayroll failed:', e.message)
    return []
  }
}

export async function createHrPayroll(payload) {
  return requireLocal(() => localApi.createHrPayroll(payload), 'Failed to save payroll')
}

export async function updateHrPayroll(id, payload) {
  return requireLocal(() => localApi.updateHrPayroll(id, payload), 'Failed to update payroll')
}

export async function deleteHrPayroll(id) {
  return requireLocal(() => localApi.deleteHrPayroll(id), 'Failed to delete payroll')
}

export async function getHrLeaves() {
  if (!hasLocalApi) return []
  try {
    return await localApi.getHrLeaves()
  } catch (e) {
    console.warn('Local API getHrLeaves failed:', e.message)
    return []
  }
}

export async function createHrLeave(payload) {
  return requireLocal(() => localApi.createHrLeave(payload), 'Failed to add leave')
}

export async function updateHrLeave(id, payload) {
  return requireLocal(() => localApi.updateHrLeave(id, payload), 'Failed to update leave')
}

export async function deleteHrLeave(id) {
  return requireLocal(() => localApi.deleteHrLeave(id), 'Failed to delete leave')
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

export async function getHousekeeping() {
  if (!hasLocalApi) return { rooms: [], staff: [] }
  try {
    return await localApi.getHousekeeping()
  } catch (e) {
    console.warn('Local API getHousekeeping failed:', e.message)
    return { rooms: [], staff: [] }
  }
}

export async function createHousekeepingTask(payload) {
  return requireLocal(() => localApi.createHousekeepingTask(payload), 'Failed to open housekeeping task')
}

export async function updateHousekeepingTask(id, payload) {
  return requireLocal(() => localApi.updateHousekeepingTask(id, payload), 'Failed to update housekeeping')
}

export async function getCrsRates() {
  if (!hasLocalApi) return []
  try {
    return await localApi.getCrsRates()
  } catch (e) {
    console.warn('Local API getCrsRates failed:', e.message)
    return []
  }
}

export async function createCrsRate(payload) {
  return requireLocal(() => localApi.createCrsRate(payload), 'Failed to save rate plan')
}

export async function updateCrsRate(id, payload) {
  return requireLocal(() => localApi.updateCrsRate(id, payload), 'Failed to update rate plan')
}

export async function deleteCrsRate(id) {
  return requireLocal(() => localApi.deleteCrsRate(id), 'Failed to delete rate plan')
}

export async function getCrsChannels() {
  if (!hasLocalApi) return []
  try {
    return await localApi.getCrsChannels()
  } catch (e) {
    console.warn('Local API getCrsChannels failed:', e.message)
    return []
  }
}

export async function createCrsChannel(payload) {
  return requireLocal(() => localApi.createCrsChannel(payload), 'Failed to add channel')
}

export async function updateCrsChannel(id, payload) {
  return requireLocal(() => localApi.updateCrsChannel(id, payload), 'Failed to update channel')
}

export async function deleteCrsChannel(id) {
  return requireLocal(() => localApi.deleteCrsChannel(id), 'Failed to delete channel')
}

export async function getCrsAvailability(params) {
  if (!hasLocalApi) return { dates: [], rooms: [], counts: {} }
  try {
    return await localApi.getCrsAvailability(params)
  } catch (e) {
    console.warn('Local API getCrsAvailability failed:', e.message)
    return { dates: [], rooms: [], counts: {} }
  }
}

export async function closeCrsDates(payload) {
  return requireLocal(() => localApi.closeCrsDates(payload), 'Failed to close dates')
}

export async function openCrsDates(id) {
  return requireLocal(() => localApi.openCrsDates(id), 'Failed to open dates')
}

export async function getCrsQuote(params) {
  return requireLocal(() => localApi.getCrsQuote(params), 'Those dates are not available')
}

export async function getCrmLoyalty() {
  if (!hasLocalApi) return { guests: [], transactions: [] }
  try {
    return await localApi.getCrmLoyalty()
  } catch (e) {
    console.warn('Local API getCrmLoyalty failed:', e.message)
    return { guests: [], transactions: [] }
  }
}

export async function adjustCrmLoyalty(payload) {
  return requireLocal(() => localApi.adjustCrmLoyalty(payload), 'Failed to update loyalty points')
}

export async function getCrmCampaigns() {
  if (!hasLocalApi) return []
  try {
    return await localApi.getCrmCampaigns()
  } catch (e) {
    console.warn('Local API getCrmCampaigns failed:', e.message)
    return []
  }
}

export async function createCrmCampaign(payload) {
  return requireLocal(() => localApi.createCrmCampaign(payload), 'Failed to save campaign')
}

export async function sendCrmCampaign(id) {
  return requireLocal(() => localApi.sendCrmCampaign(id), 'Failed to send campaign')
}

export async function deleteCrmCampaign(id) {
  return requireLocal(() => localApi.deleteCrmCampaign(id), 'Failed to delete campaign')
}

export async function getCrmCommunications() {
  if (!hasLocalApi) return []
  try {
    return await localApi.getCrmCommunications()
  } catch (e) {
    console.warn('Local API getCrmCommunications failed:', e.message)
    return []
  }
}

export async function createCrmCommunication(payload) {
  return requireLocal(() => localApi.createCrmCommunication(payload), 'Failed to send message')
}

export async function getMaintenanceRequests() {
  if (!hasLocalApi) return { requests: [], rooms: [], staff: [] }
  try {
    return await localApi.getMaintenanceRequests()
  } catch (e) {
    console.warn('Local API getMaintenanceRequests failed:', e.message)
    return { requests: [], rooms: [], staff: [] }
  }
}

export async function createMaintenanceRequest(payload) {
  return requireLocal(() => localApi.createMaintenanceRequest(payload), 'Failed to open work order')
}

export async function updateMaintenanceRequest(id, payload) {
  return requireLocal(() => localApi.updateMaintenanceRequest(id, payload), 'Failed to update work order')
}

export async function deleteMaintenanceRequest(id) {
  return requireLocal(() => localApi.deleteMaintenanceRequest(id), 'Failed to delete work order')
}

export async function getMaintenanceSchedule() {
  if (!hasLocalApi) return { schedules: [], rooms: [], staff: [] }
  try {
    return await localApi.getMaintenanceSchedule()
  } catch (e) {
    console.warn('Local API getMaintenanceSchedule failed:', e.message)
    return { schedules: [], rooms: [], staff: [] }
  }
}

export async function createMaintenanceSchedule(payload) {
  return requireLocal(() => localApi.createMaintenanceSchedule(payload), 'Failed to save schedule')
}

export async function updateMaintenanceSchedule(id, payload) {
  return requireLocal(() => localApi.updateMaintenanceSchedule(id, payload), 'Failed to update schedule')
}

export async function logMaintenanceService(id) {
  return requireLocal(() => localApi.logMaintenanceService(id), 'Failed to log service')
}

export async function deleteMaintenanceSchedule(id) {
  return requireLocal(() => localApi.deleteMaintenanceSchedule(id), 'Failed to delete schedule')
}

export async function getMaintenanceInventory() {
  if (!hasLocalApi) return []
  try {
    return await localApi.getMaintenanceInventory()
  } catch (e) {
    console.warn('Local API getMaintenanceInventory failed:', e.message)
    return []
  }
}

export async function createMaintenancePart(payload) {
  return requireLocal(() => localApi.createMaintenancePart(payload), 'Failed to add part')
}

export async function updateMaintenancePart(id, payload) {
  return requireLocal(() => localApi.updateMaintenancePart(id, payload), 'Failed to update stock')
}

export async function deleteMaintenancePart(id) {
  return requireLocal(() => localApi.deleteMaintenancePart(id), 'Failed to remove part')
}

export async function getAnalytics(params) {
  if (!hasLocalApi) return {}
  try {
    return await localApi.getAnalytics(params)
  } catch (e) {
    console.warn('Local API getAnalytics failed:', e.message)
    return {}
  }
}

export async function createGuestSatisfaction(payload) {
  return requireLocal(() => localApi.createGuestSatisfaction(payload), 'Failed to save survey')
}
