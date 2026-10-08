export function opsStatusLabel(status) {
  const map = {
    clean: 'Clean',
    dirty: 'Dirty',
    occupied: 'Occupied',
    out_of_order: 'Out of order',
    cleaning: 'Cleaning',
    in_service: 'In service',
  }
  return map[status] || status || 'Clean'
}

export function opsStatusClass(status) {
  const map = {
    clean: 'bg-green-100 text-green-800',
    dirty: 'bg-red-100 text-red-800',
    occupied: 'bg-blue-100 text-blue-800',
    out_of_order: 'bg-stone-200 text-stone-700',
    cleaning: 'bg-amber-100 text-amber-800',
    in_service: 'bg-green-100 text-green-800',
  }
  return map[status] || 'bg-stone-100 text-stone-700'
}
