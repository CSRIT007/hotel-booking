import { canAccessAdminPath, staffLevel } from './roles'

/** Staff levels: 1 receptionist · 2 manager · 3 owner */
export const REPORTS = [
  {
    id: 'bookings',
    label: 'Bookings',
    group: 'Property',
    description: 'Stay list with status, quoted total, and folio collected.',
    path: '/admin/bookings',
    viewMin: 1,
    exportMin: 1,
  },
  {
    id: 'guests',
    label: 'Guests',
    group: 'Property',
    description: 'Guest list with phone, ID, and stay count.',
    path: '/admin/guests',
    viewMin: 1,
    exportMin: 1,
  },
  {
    id: 'housekeeping',
    label: 'Housekeeping',
    group: 'Property',
    description: 'Today’s room board, tasks, and assignments.',
    path: '/admin/housekeeping',
    viewMin: 1,
    exportMin: 1,
  },
  {
    id: 'pos-transactions',
    label: 'POS transactions',
    group: 'POS',
    description: 'Paid and pending POS sales.',
    path: '/admin/pos-transactions',
    viewMin: 1,
    exportMin: 1,
  },
  {
    id: 'occupancy',
    label: 'Occupancy',
    group: 'Analytics',
    description: 'Occupancy by night, ADR/RevPAR, by property and channel.',
    path: '/admin/reports',
    viewMin: 2,
    exportMin: 2,
  },
  {
    id: 'kpis',
    label: 'KPIs',
    group: 'Analytics',
    description: 'Period occupancy, ADR, RevPAR, arrivals, and net.',
    path: '/admin/analytics-kpi',
    viewMin: 2,
    exportMin: 2,
  },
  {
    id: 'finance-revenue',
    label: 'Revenue',
    group: 'Finance',
    description: 'Folio collections vs quoted vs outstanding, plus POS.',
    path: '/admin/finance-revenue',
    viewMin: 2,
    exportMin: 2,
  },
  {
    id: 'finance-expenses',
    label: 'Expenses',
    group: 'Finance',
    description: 'Expense register for the selected dates.',
    path: '/admin/finance-expense',
    viewMin: 2,
    exportMin: 2,
  },
  {
    id: 'finance-profit',
    label: 'Profit',
    group: 'Finance',
    description: 'Monthly P&L from collected revenue minus expenses.',
    path: '/admin/finance-profit',
    viewMin: 2,
    exportMin: 2,
  },
  {
    id: 'hr-payroll',
    label: 'Payroll',
    group: 'HR',
    description: 'Pay run with gross, net, and status.',
    path: '/admin/hr-payroll',
    viewMin: 2,
    exportMin: 2,
  },
  {
    id: 'hr-schedules',
    label: 'Schedules',
    group: 'HR',
    description: 'Shift roster by employee and date.',
    path: '/admin/hr-schedules',
    viewMin: 2,
    exportMin: 2,
  },
  {
    id: 'hr-leaves',
    label: 'Leaves',
    group: 'HR',
    description: 'Leave requests and approved time off.',
    path: '/admin/hr-leaves',
    viewMin: 2,
    exportMin: 2,
  },
  {
    id: 'maintenance-requests',
    label: 'Maintenance requests',
    group: 'Maintenance',
    description: 'Work-order log. Front desk can view; export is manager and owner.',
    path: '/admin/maintenance-requests',
    viewMin: 1,
    exportMin: 2,
  },
  {
    id: 'audit-log',
    label: 'Audit log',
    group: 'Admin',
    description: 'Who changed what, from which IP and device.',
    path: '/admin/audit-log',
    viewMin: 2,
    exportMin: 2,
  },
]

export function getReport(id) {
  return REPORTS.find((row) => row.id === id) || null
}

export function canViewReport(role, id) {
  const report = getReport(id)
  if (!report) return false
  if (staffLevel(role) < report.viewMin) return false
  return canAccessAdminPath(role, report.path)
}

export function canExportReport(role, id) {
  const report = getReport(id)
  if (!report) return false
  if (!canViewReport(role, id)) return false
  return staffLevel(role) >= report.exportMin
}

export function reportsForRole(role) {
  return REPORTS.filter((row) => canViewReport(role, row.id)).map((row) => ({
    ...row,
    canExport: canExportReport(role, row.id),
  }))
}

export function reportGroupsForRole(role) {
  const groups = []
  const index = new Map()
  for (const row of reportsForRole(role)) {
    if (!index.has(row.group)) {
      index.set(row.group, groups.length)
      groups.push({ name: row.group, items: [] })
    }
    groups[index.get(row.group)].items.push(row)
  }
  return groups
}

export function reportRoleLabel(minLevel) {
  if (minLevel >= 3) return 'Owner'
  if (minLevel >= 2) return 'Manager, Owner'
  return 'Receptionist, Manager, Owner'
}
