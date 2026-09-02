<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Reports</h1>
    <p class="mt-1 text-stone-600">
      Occupancy by night, revenue by property and channel, and the bookings that produced those nights.
    </p>

    <FinanceDateFilter v-model:from="from" v-model:to="to" />

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Occupancy</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ formatPct(data.totals?.occupancy) }}</p>
        <p class="text-xs text-stone-400">{{ data.totals?.occupied_nights || 0 }} of {{ data.totals?.available_nights || 0 }} room nights</p>
      </div>
      <div class="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Room revenue</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ formatMoney(data.totals?.room_revenue) }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">ADR / RevPAR</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ formatMoney(data.totals?.adr) }}</p>
        <p class="text-xs text-stone-400">RevPAR {{ formatMoney(data.totals?.revpar) }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Stays</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ data.totals?.recognized || 0 }}</p>
        <p class="text-xs text-stone-400">{{ data.totals?.cancelled || 0 }} cancelled · ALOS {{ Number(data.totals?.alos || 0).toFixed(1) }} nights</p>
      </div>
    </div>

    <div class="mt-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 class="text-sm font-semibold text-stone-800">Occupancy by night</h2>
      <div class="mt-4 space-y-2">
        <div v-for="row in data.daily" :key="row.date" class="grid grid-cols-[6.5rem_minmax(0,1fr)_7rem] items-center gap-3 text-sm">
          <span class="text-stone-600">{{ row.date }}</span>
          <div class="h-6 overflow-hidden rounded-full bg-stone-100">
            <div class="h-full rounded-full bg-brand-500" :style="{ width: Math.min(100, row.occupancy) + '%' }" />
          </div>
          <span class="text-right text-stone-700">{{ row.occupied }}/{{ row.available }} · {{ formatPct(row.occupancy) }}</span>
        </div>
        <p v-if="!(data.daily || []).length && !loading" class="text-sm text-stone-500">No nights in this range.</p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <h2 class="border-b border-stone-200 px-4 py-3 text-sm font-semibold text-stone-800">By property</h2>
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Property</th>
              <th class="px-3 py-3 text-right font-medium text-stone-700">Nights</th>
              <th class="px-3 py-3 text-right font-medium text-stone-700">Revenue</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="row in data.properties" :key="row.name">
              <td class="px-4 py-3">{{ row.name }}</td>
              <td class="px-3 py-3 text-right">{{ row.nights }}</td>
              <td class="px-3 py-3 text-right font-medium">{{ formatMoney(row.revenue) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!(data.properties || []).length && !loading" class="p-4 text-center text-stone-500">No recognized stays.</p>
      </div>
      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <h2 class="border-b border-stone-200 px-4 py-3 text-sm font-semibold text-stone-800">By channel</h2>
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Channel</th>
              <th class="px-3 py-3 text-right font-medium text-stone-700">Stays</th>
              <th class="px-3 py-3 text-right font-medium text-stone-700">Revenue</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="row in data.channels" :key="row.name">
              <td class="px-4 py-3">{{ row.name }}</td>
              <td class="px-3 py-3 text-right">{{ row.bookings }}</td>
              <td class="px-3 py-3 text-right font-medium">{{ formatMoney(row.revenue) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!(data.channels || []).length && !loading" class="p-4 text-center text-stone-500">No recognized stays.</p>
      </div>
    </div>

    <div class="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <h2 class="border-b border-stone-200 px-4 py-3 font-semibold text-stone-800">Bookings in range</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">ID</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Guest</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Room</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Channel</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Stay</th>
              <th class="px-4 py-3 text-right font-medium text-stone-700">Total</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="b in data.bookings" :key="b.id" class="hover:bg-stone-50">
              <td class="px-4 py-3">{{ b.id }}</td>
              <td class="px-4 py-3">{{ b.username }}</td>
              <td class="px-4 py-3">{{ b.room_name }}</td>
              <td class="px-4 py-3">{{ b.channel_name }}</td>
              <td class="whitespace-nowrap px-4 py-3">{{ b.check_in }} → {{ b.check_out }}</td>
              <td class="px-4 py-3 text-right">{{ formatMoney(b.total_price) }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                  :class="{
                    'bg-amber-100 text-amber-800': b.status === 'pending',
                    'bg-green-100 text-green-800': b.status === 'confirmed' || b.status === 'completed',
                    'bg-red-100 text-red-800': b.status === 'cancelled',
                  }"
                >{{ b.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!(data.bookings || []).length && !loading" class="p-4 text-center text-stone-500">No bookings overlap these dates.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import FinanceDateFilter from '../../components/FinanceDateFilter.vue'
import { getAnalytics } from '../../services/data'
import { dateRangePresets } from '../../services/finance'
import { formatMoney } from '../../utils/money'

const month = dateRangePresets().month
const from = ref(month.from)
const to = ref(month.to)
const data = ref({ daily: [], properties: [], channels: [], bookings: [] })
const loading = ref(true)

function formatPct(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return `${Number(n).toFixed(1)}%`
}

async function load() {
  loading.value = true
  try {
    data.value = await getAnalytics({ from: from.value, to: to.value })
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
}

watch([from, to], load, { immediate: true })
</script>
