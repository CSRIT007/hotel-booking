<template>
  <div v-if="canSeeView || canSeeExport" class="inline-flex overflow-hidden rounded-lg border border-stone-300 bg-white text-sm font-medium">
    <button
      v-if="canSeeView"
      type="button"
      class="px-3 py-1.5 text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="disabled"
      @click="run('view')"
    >View</button>
    <button
      v-if="canSeeExport"
      type="button"
      class="border-l border-stone-300 px-3 py-1.5 text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="disabled"
      @click="run('csv')"
    >CSV</button>
    <button
      v-if="canSeeExport"
      type="button"
      class="border-l border-stone-300 px-3 py-1.5 text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="disabled"
      @click="run('pdf')"
    >PDF</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { downloadReportCsv, openStaffReport } from '../utils/reportPrint'
import { getReport } from '../utils/reports'
import { roleLabel } from '../utils/roles'

const props = defineProps({
  reportId: { type: String, required: true },
  filename: { type: String, default: '' },
  title: { type: String, default: '' },
  from: { type: String, default: '' },
  to: { type: String, default: '' },
  rows: { type: Array, default: () => [] },
  columns: { type: Array, required: true },
  disabled: { type: Boolean, default: false },
})

const { canView, canExport, currentUser } = useAuth()
const canSeeView = computed(() => canView(props.reportId))
const canSeeExport = computed(() => canExport(props.reportId))

function payload() {
  const report = getReport(props.reportId)
  const user = currentUser.value
  const who = [user?.username, roleLabel(user?.role)].filter(Boolean).join(' · ')
  return {
    title: props.title || report?.label || props.filename || 'Report',
    from: props.from,
    to: props.to,
    exportedBy: who || 'Staff',
    rows: props.rows,
    columns: props.columns,
  }
}

function run(mode) {
  if (props.disabled) return
  const options = payload()
  if (mode === 'view' && canSeeView.value) {
    openStaffReport(options, { autoPrint: false })
    return
  }
  if (!canSeeExport.value) return
  if (mode === 'csv') downloadReportCsv(options)
  else openStaffReport(options, { autoPrint: true })
}
</script>
