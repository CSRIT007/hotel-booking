export function positionsForDepartment(org, departmentName) {
  const dept = (org || []).find((d) => d.name === departmentName)
  return dept?.positions || []
}

export const HR_SHIFT_TYPES = ['morning', 'afternoon', 'evening', 'night']
export const HR_LEAVE_TYPES = ['vacation', 'sick', 'personal', 'unpaid', 'other']
export const HR_SALARY_TYPES = ['hourly', 'monthly', 'annual']
export const HR_PAY_METHODS = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
]

export { formatMoney } from '../utils/money'

export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function monthStartKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function lastMonthRange() {
  const d = new Date()
  const start = new Date(d.getFullYear(), d.getMonth() - 1, 1)
  const end = new Date(d.getFullYear(), d.getMonth(), 0)
  const key = (value) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  return { start: key(start), end: key(end) }
}

export function daysInclusive(start, end) {
  if (!start || !end) return 0
  const a = new Date(`${start}T00:00:00`)
  const b = new Date(`${end}T00:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0
  return Math.round((b - a) / 86400000) + 1
}

export function shiftHours(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = String(start).split(':').map(Number)
  const [eh, em] = String(end).split(':').map(Number)
  let hours = eh + em / 60 - (sh + sm / 60)
  if (hours <= 0) hours += 24
  return hours
}

export function hoursInPeriod(schedules, employeeId, periodStart, periodEnd) {
  return (schedules || [])
    .filter((s) =>
      Number(s.employee_id) === Number(employeeId)
      && s.shift_date >= periodStart
      && s.shift_date <= periodEnd
      && s.status !== 'cancelled'
      && s.status !== 'absent'
    )
    .reduce((sum, s) => sum + shiftHours(s.shift_start, s.shift_end), 0)
}

export function suggestedBasePay(employee, periodStart, periodEnd, schedules = []) {
  if (!employee) return 0
  const salary = Number(employee.salary || 0)
  const days = daysInclusive(periodStart, periodEnd)
  if (employee.salary_type === 'hourly') {
    const hours = hoursInPeriod(schedules, employee.id, periodStart, periodEnd)
    return Math.round(salary * hours * 100) / 100
  }
  if (employee.salary_type === 'annual') {
    return Math.round((salary * (days || 0) / 365) * 100) / 100
  }
  return salary
}

export function payrollNet(base, overtime, bonuses, deductions) {
  return Number(base || 0) + Number(overtime || 0) + Number(bonuses || 0) - Number(deductions || 0)
}

export function statusClass(status) {
  const map = {
    active: 'bg-green-100 text-green-800',
    on_leave: 'bg-amber-100 text-amber-800',
    terminated: 'bg-stone-200 text-stone-700',
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    cancelled: 'bg-stone-200 text-stone-700',
    draft: 'bg-stone-100 text-stone-700',
    approved: 'bg-green-100 text-green-800',
    paid: 'bg-brand-100 text-brand-800',
    pending: 'bg-amber-100 text-amber-800',
    rejected: 'bg-red-100 text-red-800',
  }
  return map[status] || 'bg-stone-100 text-stone-700'
}

export function labelize(value) {
  return String(value || '').replace(/_/g, ' ')
}
