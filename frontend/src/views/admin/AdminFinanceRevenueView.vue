<template>
  <div class="finance-root">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-stone-800">Revenue</h1>
        <p class="mt-1 max-w-2xl text-stone-600">
          Summary statement, line-item detail, or both. Classify revenue as Room, POS, or both.
        </p>
      </div>
      <ReportExportButton
        report-id="finance-revenue"
        :title="exportTitle"
        :from="from"
        :to="to"
        :statement="statementLines"
        :sections="exportSections"
        :disabled="loading"
      />
    </div>

    <FinanceDateFilter v-model:from="from" v-model:to="to" />

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <div class="min-w-0">
        <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">Show</p>
        <div class="inline-flex overflow-hidden rounded-lg border border-stone-300 bg-white text-sm font-medium">
          <button
            v-for="option in viewOptions"
            :key="option.id"
            type="button"
            class="px-3 py-1.5 first:rounded-l-lg last:rounded-r-lg"
            :class="viewMode === option.id
              ? 'bg-stone-800 text-white'
              : 'border-l border-stone-300 text-stone-700 first:border-l-0 hover:bg-stone-50'"
            @click="viewMode = option.id"
          >{{ option.label }}</button>
        </div>
      </div>
      <div class="min-w-0">
        <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">Revenue</p>
        <div class="inline-flex overflow-hidden rounded-lg border border-stone-300 bg-white text-sm font-medium">
          <button
            v-for="option in sourceOptions"
            :key="option.id"
            type="button"
            class="px-3 py-1.5 first:rounded-l-lg last:rounded-r-lg"
            :class="source === option.id
              ? 'bg-stone-800 text-white'
              : 'border-l border-stone-300 text-stone-700 first:border-l-0 hover:bg-stone-50'"
            @click="source = option.id"
          >{{ option.label }}</button>
        </div>
      </div>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Total revenue</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ formatMoney(scoped.revenue) }}</p>
        <p class="mt-1 text-xs text-stone-500">{{ revenueHint }}</p>
      </div>
      <div v-if="includeRoom" class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Room collected</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ formatMoney(scoped.roomRevenue) }}</p>
        <p class="mt-1 text-xs text-stone-500">{{ scoped.counts.room }} stays · quoted {{ formatMoney(summary.roomQuoted) }}</p>
      </div>
      <div v-if="includeRoom" class="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Room outstanding</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">{{ formatMoney(summary.roomOutstanding) }}</p>
        <p class="mt-1 text-xs text-stone-500">Folio balance still due</p>
      </div>
      <div v-if="includePos" class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">POS revenue</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ formatMoney(scoped.posRevenue) }}</p>
        <p class="mt-1 text-xs text-stone-500">{{ scoped.counts.pos }} paid sales</p>
      </div>
    </div>

    <article
      v-if="showStatement"
      class="mx-auto mt-6 max-w-3xl rounded-2xl border border-stone-200 bg-white px-6 py-8 shadow-sm sm:px-10"
    >
      <header class="border-b border-stone-200 pb-5 text-center">
        <p class="text-lg font-semibold tracking-wide text-stone-800">Smile Hotel MS</p>
        <h2 class="mt-1 text-xl font-semibold text-stone-900">Revenue report</h2>
        <p class="mt-1 text-sm text-stone-500">{{ rangeLabel }}</p>
        <p class="mt-1 text-xs font-medium uppercase tracking-wide text-stone-400">{{ sourceLabel }}</p>
      </header>
      <table class="mx-auto mt-6 w-full max-w-lg text-sm">
        <tbody>
          <tr v-for="(line, i) in statementLines" :key="i" :class="lineClass(line)">
            <td v-if="line.kind === 'header' || line.kind === 'note' || line.kind === 'blank'" colspan="2" class="py-1.5">
              {{ line.label }}
            </td>
            <template v-else>
              <td class="py-1.5" :class="line.indent ? 'pl-5 text-stone-600' : 'text-stone-800'">{{ line.label }}</td>
              <td class="py-1.5 text-right font-medium tabular-nums" :class="amountClass(line)">{{ line.value }}</td>
            </template>
          </tr>
        </tbody>
      </table>
    </article>

    <div v-if="showDetail" class="mt-6 space-y-6">
      <section class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 px-4 py-3">
          <h2 class="font-semibold text-stone-800">Monthly schedule</h2>
          <p class="text-xs text-stone-500">{{ sourceLabel }}</p>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Month</th>
                <th v-if="includeRoom" class="px-4 py-3 text-right font-medium text-stone-700">Room</th>
                <th v-if="includePos" class="px-4 py-3 text-right font-medium text-stone-700">POS</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="m in scopedMonths" :key="m.month" class="hover:bg-stone-50">
                <td class="px-4 py-3 text-stone-700">{{ m.month }}</td>
                <td v-if="includeRoom" class="px-4 py-3 text-right">{{ formatMoney(m.room) }}</td>
                <td v-if="includePos" class="px-4 py-3 text-right">{{ formatMoney(m.pos) }}</td>
                <td class="px-4 py-3 text-right font-medium">{{ formatMoney(m.revenue) }}</td>
              </tr>
              <tr v-if="scopedMonths.length === 0 && !loading">
                <td :colspan="monthlyColspan" class="px-4 py-8 text-center text-stone-500">No monthly data in this date range.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        v-if="includeRoom"
        class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 px-4 py-3">
          <h2 class="font-semibold text-stone-800">Room collections</h2>
          <p class="text-xs text-stone-500">{{ scoped.counts.room }} stays · {{ formatMoney(scoped.roomRevenue) }}</p>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Date</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">ID</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Guest</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Room</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Quoted</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Collected</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="b in scoped.roomItems" :key="'b-' + b.id" class="hover:bg-stone-50">
                <td class="whitespace-nowrap px-4 py-3 text-stone-600">{{ formatDate(bookingFinanceDate(b)) }}</td>
                <td class="px-4 py-3 text-stone-500">#{{ b.id }}</td>
                <td class="px-4 py-3">{{ b.username || b.email || '—' }}</td>
                <td class="px-4 py-3">{{ b.room_name || '—' }}</td>
                <td class="px-4 py-3 capitalize">{{ b.status }}</td>
                <td class="px-4 py-3 text-right text-stone-600">{{ formatMoney(b.total_price) }}</td>
                <td class="px-4 py-3 text-right font-medium">{{ formatMoney(b.folio_payments) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="scoped.roomItems.length === 0 && !loading" class="p-4 text-center text-stone-500">
          No confirmed, in-house, or completed stays in this date range.
        </p>
      </section>

      <section
        v-if="includePos"
        class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 px-4 py-3">
          <h2 class="font-semibold text-stone-800">POS sales</h2>
          <p class="text-xs text-stone-500">{{ scoped.counts.pos }} paid sales · {{ formatMoney(scoped.posRevenue) }}</p>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Date</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">ID</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Product</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Category</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Qty</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Payment</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="t in scoped.posItems" :key="'p-' + t.id" class="hover:bg-stone-50">
                <td class="whitespace-nowrap px-4 py-3 text-stone-600">{{ formatDate(posFinanceDate(t)) }}</td>
                <td class="px-4 py-3 text-stone-500">#{{ t.id }}</td>
                <td class="px-4 py-3">{{ posProductLabel(t) }}</td>
                <td class="px-4 py-3 text-stone-600">{{ t.category || '—' }}</td>
                <td class="px-4 py-3 text-right">{{ t.quantity ?? 1 }}</td>
                <td class="px-4 py-3 capitalize">{{ String(t.payment_method || 'other').replaceAll('_', ' ') }}</td>
                <td class="px-4 py-3 capitalize">{{ t.status }}</td>
                <td class="px-4 py-3 text-right font-medium">{{ formatMoney(t.total_amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="scoped.posItems.length === 0 && !loading" class="p-4 text-center text-stone-500">
          No paid POS sales in this date range.
        </p>
      </section>
    </div>

    <p v-if="loading" class="mt-4 text-sm text-stone-500">Loading…</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FinanceDateFilter from '../../components/FinanceDateFilter.vue'
import ReportExportButton from '../../components/ReportExportButton.vue'
import { getBookings, getPosTransactions } from '../../services/data'
import {
  bookingFinanceDate,
  dateRangePresets,
  filterByDateRange,
  formatDate,
  formatMoney,
  monthlyRevenueColumnsFor,
  monthlySeries,
  posFinanceDate,
  posProductLabel,
  posRevenueExportColumns,
  revenueStatementLines,
  roomRevenueExportColumns,
  scopedFinanceSummary,
  summarizeFinance,
} from '../../services/finance'
import { formatReportRange } from '../../utils/reportPrint'

const bookings = ref([])
const transactions = ref([])
const loading = ref(true)
const monthRange = dateRangePresets().month
const from = ref(monthRange.from)
const to = ref(monthRange.to)
const viewMode = ref('summary')
const source = ref('both')

const viewOptions = [
  { id: 'summary', label: 'Summary' },
  { id: 'detail', label: 'Detail' },
  { id: 'both', label: 'Both' },
]
const sourceOptions = [
  { id: 'both', label: 'Combined' },
  { id: 'room', label: 'Room' },
  { id: 'pos', label: 'POS' },
]
const includeRoom = computed(() => source.value !== 'pos')
const includePos = computed(() => source.value !== 'room')

const rangedBookings = computed(() =>
  filterByDateRange(bookings.value, from.value, to.value, bookingFinanceDate)
)
const rangedTransactions = computed(() =>
  filterByDateRange(transactions.value, from.value, to.value, posFinanceDate)
)

const summary = computed(() =>
  summarizeFinance({ bookings: rangedBookings.value, transactions: rangedTransactions.value })
)
const scoped = computed(() =>
  scopedFinanceSummary(summary.value, {
    includeRoom: includeRoom.value,
    includePos: includePos.value,
  })
)
const months = computed(() =>
  monthlySeries({ bookings: rangedBookings.value, transactions: rangedTransactions.value })
)
const scopedMonths = computed(() =>
  months.value.map((row) => {
    const room = includeRoom.value ? row.room : 0
    const pos = includePos.value ? row.pos : 0
    return { ...row, room, pos, revenue: room + pos }
  })
)
const statementLines = computed(() =>
  revenueStatementLines(summary.value, {
    includeRoom: includeRoom.value,
    includePos: includePos.value,
  })
)
const showStatement = computed(() => viewMode.value !== 'detail')
const showDetail = computed(() => viewMode.value !== 'summary')
const rangeLabel = computed(() => formatReportRange(from.value, to.value))
const sourceLabel = computed(() => {
  if (includeRoom.value && includePos.value) return 'Room and POS'
  if (includeRoom.value) return 'Room only'
  return 'POS only'
})
const revenueHint = computed(() => {
  if (includeRoom.value && includePos.value) {
    return `Rooms ${formatMoney(scoped.value.roomRevenue)} · POS ${formatMoney(scoped.value.posRevenue)}`
  }
  if (includeRoom.value) return `${scoped.value.counts.room} stays collected`
  return `${scoped.value.counts.pos} paid sales`
})
const exportTitle = computed(() => {
  const depth = viewMode.value === 'detail' ? 'detail' : viewMode.value === 'both' ? 'statement and detail' : 'statement'
  return `Revenue — ${sourceLabel.value} (${depth})`
})
const monthlyColspan = computed(() => 2 + (includeRoom.value ? 1 : 0) + (includePos.value ? 1 : 0))
const exportSections = computed(() => {
  const sections = [
    {
      title: 'Monthly schedule',
      columns: monthlyRevenueColumnsFor({ includeRoom: includeRoom.value, includePos: includePos.value }),
      rows: scopedMonths.value,
    },
  ]
  if (showDetail.value && includeRoom.value) {
    sections.push({ title: 'Room collections', columns: roomRevenueExportColumns, rows: scoped.value.roomItems })
  }
  if (showDetail.value && includePos.value) {
    sections.push({ title: 'POS sales', columns: posRevenueExportColumns, rows: scoped.value.posItems })
  }
  return sections
})

function lineClass(line) {
  if (line.kind === 'header') return 'text-[11px] font-semibold uppercase tracking-wide text-stone-500'
  if (line.kind === 'total') return 'border-t border-stone-800 font-semibold text-stone-900'
  if (line.kind === 'note') return 'text-xs leading-5 text-stone-500'
  if (line.kind === 'blank') return 'h-3'
  return ''
}

function amountClass(line) {
  if (line.kind === 'total' && line.label === 'Total revenue') return 'font-semibold text-green-700'
  if (line.kind === 'total') return 'font-semibold'
  return 'font-medium'
}

onMounted(async () => {
  loading.value = true
  try {
    const [b, t] = await Promise.all([getBookings(), getPosTransactions()])
    bookings.value = b
    transactions.value = t
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
})
</script>

<style scoped>
.finance-root {
  overflow-anchor: none;
}
</style>
