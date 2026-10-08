export const STAFF_ROLES = ['staff', 'owner', 'manager', 'receptionist']

export const ROLE_LABELS = {
  guest: 'Guest',
  receptionist: 'Receptionist',
  manager: 'Manager',
  owner: 'Owner',
  staff: 'Owner',
}

export function staffLevel(role) {
  const r = String(role || '').toLowerCase()
  if (r === 'owner' || r === 'staff') return 3
  if (r === 'manager') return 2
  if (r === 'receptionist') return 1
  return 0
}

export function isHotelStaff(role) {
  return staffLevel(role) >= 1
}

export function roleLabel(role) {
  return ROLE_LABELS[String(role || '').toLowerCase()] || role || 'Guest'
}

export function canAccessAdminPath(role, path) {
  const level = staffLevel(role)
  if (level < 1) return false
  if (level >= 3) return true
  const raw = String(path || '')
  const ownerOnly = ['/admin/users', '/admin/security']
  if (ownerOnly.some((p) => raw === p || raw.startsWith(`${p}/`))) return false
  if (level >= 2) return true
  const frontDesk = [
    '/admin',
    '/admin/bookings',
    '/admin/guests',
    '/admin/rooms',
    '/admin/housekeeping',
    '/admin/contacts',
    '/admin/pos-sales',
    '/admin/pos-transactions',
    '/admin/crs-availability',
    '/admin/maintenance-requests',
  ]
  if (raw === '/admin' || raw === '/admin/') return true
  return frontDesk.some((p) => p !== '/admin' && (raw === p || raw.startsWith(`${p}/`)))
}
