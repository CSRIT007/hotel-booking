import { ref } from 'vue'
import { dateRangePresets } from '../services/finance'

export function useReportPeriod() {
  const month = dateRangePresets().month
  const from = ref(month.from)
  const to = ref(month.to)
  return { from, to }
}
