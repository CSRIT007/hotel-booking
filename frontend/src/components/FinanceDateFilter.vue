<template>
  <div class="sticky top-14 z-20 mt-4 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="(preset, key) in presets"
        :key="key"
        type="button"
        class="rounded-md border px-2.5 py-1.5 text-xs font-medium transition"
        :class="!open && activePreset === key
          ? 'border-stone-800 bg-stone-800 text-white'
          : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'"
        @click="applyPreset(key)"
      >
        {{ preset.label }}
      </button>

      <button
        ref="triggerRef"
        type="button"
        class="ml-auto inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium"
        :class="open ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50'"
        @click="toggleOpen"
      >
        {{ appliedLabel }}
        <span class="text-xs text-stone-500">{{ open ? 'Close' : 'Pick dates' }}</span>
      </button>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[60]">
      <button type="button" class="absolute inset-0 cursor-default bg-black/20" aria-label="Close calendar" @click="close" />
      <div
        class="absolute w-[20.5rem] rounded-xl border border-stone-200 bg-white p-4 shadow-xl"
        :style="popoverStyle"
        @click.stop
      >
        <p class="text-sm font-medium text-stone-800">Select dates</p>
        <p class="mt-1 text-xs text-stone-500">Click start, then end. The list updates only when you apply.</p>

        <div class="mt-3 flex items-center gap-2 text-sm">
          <span class="flex-1 rounded-md bg-stone-50 px-2 py-1.5 font-medium text-stone-800">{{ formatLabel(draftFrom) || 'Start' }}</span>
          <span class="text-stone-400">→</span>
          <span class="flex-1 rounded-md bg-stone-50 px-2 py-1.5 font-medium text-stone-800">{{ formatLabel(draftTo) || 'End' }}</span>
        </div>

        <div class="mt-3 select-none">
          <div class="mb-2 flex items-center gap-2">
            <button type="button" class="rounded-md border border-stone-300 px-2 py-1 text-sm hover:bg-stone-50" aria-label="Previous month" @click="shiftMonth(-1)">‹</button>
            <select v-model.number="viewMonth" class="flex-1 rounded-md border border-stone-300 bg-white px-2 py-1 text-sm" aria-label="Month">
              <option v-for="(name, idx) in MONTHS" :key="name" :value="idx">{{ name }}</option>
            </select>
            <select v-model.number="viewYear" class="w-20 rounded-md border border-stone-300 bg-white px-2 py-1 text-sm" aria-label="Year">
              <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
            </select>
            <button type="button" class="rounded-md border border-stone-300 px-2 py-1 text-sm hover:bg-stone-50" aria-label="Next month" @click="shiftMonth(1)">›</button>
          </div>
          <div class="grid grid-cols-7 text-center text-[11px] font-medium uppercase text-stone-500">
            <span v-for="d in WEEKDAYS" :key="d" class="py-1">{{ d }}</span>
          </div>
          <div class="grid grid-cols-7">
            <button
              v-for="day in calendarDays"
              :key="day.key"
              type="button"
              class="h-9 rounded-md text-sm"
              :class="dayClass(day)"
              :disabled="day.muted"
              @mouseenter="onHover(day)"
              @mousedown.prevent
              @click="onSelect(day)"
            >
              {{ day.date }}
            </button>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-end gap-2">
          <button type="button" class="rounded-md px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50" @click="close">Cancel</button>
          <button
            type="button"
            class="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
            :disabled="!canApply"
            @click="applyDraft"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref } from 'vue'
import { dateRangePresets, localDateKey } from '../services/finance'

const from = defineModel('from', { type: String, default: '' })
const to = defineModel('to', { type: String, default: '' })

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const presets = dateRangePresets()
const today = localDateKey()
const now = new Date()

const triggerRef = ref(null)
const open = ref(false)
const picking = ref(false)
const draftFrom = ref(from.value)
const draftTo = ref(to.value)
const hoverKey = ref('')
const popoverStyle = ref({})
const viewYear = ref((parseKey(from.value) || now).getFullYear())
const viewMonth = ref((parseKey(from.value) || now).getMonth())

const years = computed(() => {
  const current = now.getFullYear()
  const list = []
  for (let y = current + 1; y >= current - 8; y -= 1) list.push(y)
  return list
})

const activePreset = computed(() =>
  Object.keys(presets).find((key) => presets[key].from === from.value && presets[key].to === to.value) || ''
)

const appliedLabel = computed(() => {
  if (!from.value && !to.value) return 'All dates'
  if (from.value && to.value) return `${formatLabel(from.value)} – ${formatLabel(to.value)}`
  return formatLabel(from.value || to.value)
})

const visualEnd = computed(() => {
  if (picking.value) return hoverKey.value || draftFrom.value
  return draftTo.value
})

const visualRange = computed(() => {
  const start = draftFrom.value
  const end = visualEnd.value
  if (!start) return { from: '', to: '' }
  if (!end) return { from: start, to: start }
  return start <= end ? { from: start, to: end } : { from: end, to: start }
})

const canApply = computed(() => (!draftFrom.value && !draftTo.value) || (draftFrom.value && draftTo.value))

const calendarDays = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const days = []
  for (let i = 0; i < startOffset; i += 1) {
    days.push({ key: `pad-${i}`, date: '', muted: true })
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    days.push({
      key: `${viewYear.value}-${pad(viewMonth.value + 1)}-${pad(d)}`,
      date: d,
      muted: false,
    })
  }
  return days
})

function pad(n) {
  return String(n).padStart(2, '0')
}

function parseKey(key) {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatLabel(key) {
  const d = parseKey(key)
  if (!d) return ''
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

function dayClass(day) {
  if (day.muted) return 'text-transparent cursor-default'
  const start = visualRange.value.from
  const end = visualRange.value.to
  const inRange = start && end && day.key >= start && day.key <= end
  const isEdge = day.key === start || day.key === end
  if (isEdge) return 'bg-brand-600 font-semibold text-white'
  if (inRange) return 'bg-brand-100 text-brand-800'
  if (day.key === today) return 'font-semibold text-brand-700 hover:bg-stone-100'
  return 'text-stone-700 hover:bg-stone-100'
}

function shiftMonth(delta) {
  const next = new Date(viewYear.value, viewMonth.value + delta, 1)
  viewYear.value = next.getFullYear()
  viewMonth.value = next.getMonth()
}

function onHover(day) {
  if (!picking.value || day.muted) return
  hoverKey.value = day.key
}

function onSelect(day) {
  if (day.muted) return
  if (!picking.value) {
    picking.value = true
    draftFrom.value = day.key
    draftTo.value = ''
    hoverKey.value = day.key
    return
  }
  const range = day.key < draftFrom.value
    ? { from: day.key, to: draftFrom.value }
    : { from: draftFrom.value, to: day.key }
  draftFrom.value = range.from
  draftTo.value = range.to
  picking.value = false
  hoverKey.value = ''
}

function keepScroll(update) {
  const y = window.scrollY
  const x = window.scrollX
  update()
  nextTick(() => {
    window.scrollTo({ top: y, left: x, behavior: 'instant' })
  })
}

function positionPopover() {
  const el = triggerRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const width = 328
  const height = 430
  let left = Math.min(r.right - width, window.innerWidth - width - 12)
  left = Math.max(12, left)
  let top = r.bottom + 8
  if (top + height > window.innerHeight - 8) {
    top = Math.max(8, r.top - height - 8)
  }
  popoverStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  }
}

function addOverlayListeners() {
  window.addEventListener('scroll', positionPopover, true)
  window.addEventListener('resize', positionPopover)
}

function removeOverlayListeners() {
  window.removeEventListener('scroll', positionPopover, true)
  window.removeEventListener('resize', positionPopover)
}

function toggleOpen() {
  if (open.value) {
    close()
    return
  }
  draftFrom.value = from.value
  draftTo.value = to.value
  picking.value = false
  hoverKey.value = ''
  const anchor = parseKey(from.value || to.value || today)
  viewYear.value = anchor.getFullYear()
  viewMonth.value = anchor.getMonth()
  open.value = true
  nextTick(() => {
    positionPopover()
    addOverlayListeners()
  })
}

function close() {
  open.value = false
  picking.value = false
  hoverKey.value = ''
  removeOverlayListeners()
}

function applyDraft() {
  keepScroll(() => {
    from.value = draftFrom.value
    to.value = draftTo.value
    close()
  })
}

function applyPreset(key) {
  const preset = presets[key]
  if (!preset) return
  draftFrom.value = preset.from
  draftTo.value = preset.to
  keepScroll(() => {
    from.value = preset.from
    to.value = preset.to
    close()
  })
}

onUnmounted(removeOverlayListeners)
</script>
