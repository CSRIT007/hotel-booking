<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">KPIs</h1>
    <p class="mt-1 text-stone-600">
      Occupancy, ADR, and RevPAR use confirmed and completed stays in the selected dates. Comparison is the previous period of the same length.
    </p>

    <FinanceDateFilter v-model:from="from" v-model:to="to" />

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="card in headline" :key="card.key" class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">{{ card.label }}</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ card.display }}</p>
        <p class="mt-1 text-xs" :class="deltaClass(card.delta, card.invert)">{{ formatDelta(card.delta) }} vs prior period</p>
      </div>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Arrivals</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ num(data.kpis?.arrivals?.value) }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Departures</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ num(data.kpis?.departures?.value) }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Guests stayed</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ num(data.kpis?.guests?.value) }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Repeat guests</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ formatPct(data.kpis?.repeat_rate?.value) }}</p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-stone-800">Tonight</h2>
        <ul class="mt-4 space-y-2 text-sm text-stone-600">
          <li class="flex justify-between"><span>In-house</span><span class="font-medium text-stone-800">{{ data.operations?.in_house || 0 }}</span></li>
          <li class="flex justify-between"><span>Rooms available</span><span class="font-medium text-stone-800">{{ data.operations?.available || 0 }} / {{ data.operations?.rooms || 0 }}</span></li>
          <li class="flex justify-between"><span>Out of order</span><span class="font-medium text-stone-800">{{ data.operations?.maintenance || 0 }}</span></li>
          <li class="flex justify-between"><span>Housekeeping open</span><span class="font-medium text-stone-800">{{ data.operations?.dirty || 0 }}</span></li>
          <li class="flex justify-between"><span>Open work orders</span><span class="font-medium text-stone-800">{{ data.operations?.work_orders || 0 }}</span></li>
          <li class="flex justify-between"><span>Pending bookings</span><span class="font-medium text-stone-800">{{ data.operations?.pending || 0 }}</span></li>
        </ul>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-stone-800">Period result</h2>
        <ul class="mt-4 space-y-2 text-sm text-stone-600">
          <li class="flex justify-between"><span>Room revenue</span><span class="font-medium text-stone-800">{{ formatMoney(data.kpis?.room_revenue?.value) }}</span></li>
          <li class="flex justify-between"><span>+ POS (paid)</span><span class="font-medium text-stone-800">{{ formatMoney(data.profit?.pos) }}</span></li>
          <li class="flex justify-between"><span>− Expenses</span><span class="font-medium text-red-600">{{ formatMoney(data.profit?.expenses) }}</span></li>
          <li class="flex justify-between border-t border-stone-200 pt-2"><span>Net</span><span class="font-semibold" :class="(data.profit?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'">{{ formatMoney(data.profit?.profit) }}</span></li>
          <li class="flex justify-between"><span>Margin</span><span class="font-medium text-stone-800">{{ formatPct(data.profit?.margin) }}</span></li>
          <li class="flex justify-between"><span>Loyalty members / VIP</span><span class="font-medium text-stone-800">{{ data.loyalty?.members || 0 }} / {{ data.loyalty?.vip || 0 }}</span></li>
        </ul>
        <p class="mt-3 text-xs text-stone-400">Prior period {{ data.range?.previous_from }} → {{ data.range?.previous_to }}</p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="saveSurvey">
        <h2 class="text-sm font-semibold text-stone-800">Log guest survey</h2>
        <p class="mt-1 text-xs text-stone-500">Completed stays only. One survey per booking.</p>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Stay</label>
            <select v-model.number="survey.booking_id" required class="field">
              <option disabled :value="0">________Selection________</option>
              <option v-for="row in queue" :key="row.id" :value="row.id">#{{ row.id }} {{ row.username }} — {{ row.room_name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">Overall</label>
              <input v-model.number="survey.overall_rating" type="number" min="1" max="5" step="0.5" required class="field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Clean</label>
              <input v-model.number="survey.cleanliness_rating" type="number" min="1" max="5" step="0.5" class="field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Service</label>
              <input v-model.number="survey.service_rating" type="number" min="1" max="5" step="0.5" class="field" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Comment</label>
            <input v-model="survey.feedback" type="text" class="field" placeholder="Optional" />
          </div>
          <label class="flex items-center gap-2 text-sm text-stone-700">
            <input v-model="survey.would_recommend" type="checkbox" class="rounded border-stone-300" />
            Would recommend
          </label>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="mt-3 text-sm text-green-600">{{ success }}</p>
        <button type="submit" class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving || !survey.booking_id">
          {{ saving ? 'Saving…' : 'Save survey' }}
        </button>
      </form>

      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-stone-800">Guest satisfaction</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-xs uppercase text-stone-500">Average score</p>
            <p class="text-3xl font-bold text-stone-800">{{ data.satisfaction?.responses ? Number(data.satisfaction.overall).toFixed(1) : '—' }}</p>
            <p class="text-xs text-stone-400">{{ data.satisfaction?.responses || 0 }} responses in this period</p>
          </div>
          <ul class="space-y-2 text-sm text-stone-600">
            <li class="flex justify-between"><span>Cleanliness</span><span>{{ rating(data.satisfaction?.cleanliness) }}</span></li>
            <li class="flex justify-between"><span>Service</span><span>{{ rating(data.satisfaction?.service) }}</span></li>
            <li class="flex justify-between"><span>Would recommend</span><span>{{ formatPct(data.satisfaction?.recommend_rate) }}</span></li>
          </ul>
        </div>
        <p v-if="!queue.length" class="mt-4 text-sm text-stone-500">No completed stays waiting for a survey.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import FinanceDateFilter from '../../components/FinanceDateFilter.vue'
import { createGuestSatisfaction, getAnalytics } from '../../services/data'
import { dateRangePresets } from '../../services/finance'
import { formatMoney } from '../../utils/money'

const month = dateRangePresets().month
const from = ref(month.from)
const to = ref(month.to)
const data = ref({})
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const survey = reactive({
  booking_id: 0,
  overall_rating: 5,
  cleanliness_rating: 5,
  service_rating: 5,
  feedback: '',
  would_recommend: true,
})

const queue = computed(() => data.value.satisfaction?.queue || [])

const headline = computed(() => [
  { key: 'occupancy', label: 'Occupancy', display: formatPct(data.value.kpis?.occupancy?.value), delta: data.value.kpis?.occupancy?.delta },
  { key: 'adr', label: 'ADR', display: formatMoney(data.value.kpis?.adr?.value), delta: data.value.kpis?.adr?.delta },
  { key: 'revpar', label: 'RevPAR', display: formatMoney(data.value.kpis?.revpar?.value), delta: data.value.kpis?.revpar?.delta },
  { key: 'cancel', label: 'Cancellation rate', display: formatPct(data.value.kpis?.cancel_rate?.value), delta: data.value.kpis?.cancel_rate?.delta, invert: true },
])

function num(v) {
  return Number(v || 0)
}

function formatPct(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return `${Number(n).toFixed(1)}%`
}

function rating(n) {
  if (!data.value.satisfaction?.responses) return '—'
  return Number(n || 0).toFixed(1)
}

function formatDelta(delta) {
  if (delta == null || Number.isNaN(Number(delta))) return '—'
  const n = Number(delta)
  if (Math.abs(n) < 0.05) return 'No change'
  return `${n > 0 ? '▲' : '▼'} ${Math.abs(n).toFixed(1)}%`
}

function deltaClass(delta, invert) {
  if (delta == null || Math.abs(Number(delta)) < 0.05) return 'text-stone-500'
  const up = Number(delta) > 0
  const good = invert ? !up : up
  return good ? 'text-green-600' : 'text-red-600'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    data.value = await getAnalytics({ from: from.value, to: to.value })
    if (!queue.value.some((row) => row.id === survey.booking_id)) survey.booking_id = 0
  } catch (e) {
    error.value = e.message
  }
  loading.value = false
}

async function saveSurvey() {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    await createGuestSatisfaction({ ...survey })
    survey.feedback = ''
    survey.booking_id = 0
    success.value = 'Survey saved.'
    await load()
  } catch (e) {
    error.value = e.message
  }
  saving.value = false
}

watch([from, to], load, { immediate: true })
</script>

<style scoped>
.field {
  @apply mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
}
</style>
