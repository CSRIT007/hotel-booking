<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Loyalty</h1>
    <p class="mt-1 text-stone-600">
      Guests earn 1 point per $1 when a stay is checked out. Silver 500, Gold 1,000, Platinum 2,500. You can also add or redeem points here.
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Members</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ guests.length }}</p>
      </div>
      <div class="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">VIP</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">{{ guests.filter((g) => g.vip_status !== 'regular').length }}</p>
      </div>
      <div class="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Points issued</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ totalPoints }}</p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="adjust">
        <h2 class="text-sm font-semibold text-stone-800">Adjust points</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Guest</label>
            <select v-model.number="form.user_id" required class="field">
              <option disabled :value="0">________Selection________</option>
              <option v-for="g in guests" :key="g.id" :value="g.id">{{ g.username }} — {{ g.loyalty_points }} pts</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Action</label>
            <select v-model="form.type" class="field">
              <option value="earn">Add (earn)</option>
              <option value="redeem">Redeem</option>
              <option value="adjustment">Manual adjustment (+)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Points</label>
            <input v-model.number="form.points" type="number" min="1" required class="field" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Note</label>
            <input v-model="form.description" type="text" class="field" placeholder="Optional" />
          </div>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="mt-3 text-sm text-green-600">{{ success }}</p>
        <button type="submit" class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving || !form.user_id">
          {{ saving ? 'Saving…' : 'Apply' }}
        </button>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Guest</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Tier</th>
              <th class="px-3 py-3 text-right font-medium text-stone-700">Points</th>
              <th class="px-3 py-3 text-right font-medium text-stone-700">Stays</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="g in guests" :key="g.id" class="hover:bg-stone-50">
              <td class="px-4 py-3">
                <p class="font-semibold text-stone-900">{{ g.username }}</p>
                <p class="text-xs text-stone-500">{{ g.email }}</p>
              </td>
              <td class="px-3 py-3 capitalize">
                <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold" :class="tierClass(g.vip_status)">{{ g.vip_status }}</span>
              </td>
              <td class="px-3 py-3 text-right font-medium">{{ g.loyalty_points }}</td>
              <td class="px-3 py-3 text-right text-stone-600">{{ g.stays }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="guests.length === 0 && !loading" class="p-4 text-center text-stone-500">No guest members yet.</p>
        <div v-if="transactions.length" class="border-t border-stone-200 px-4 py-3">
          <p class="text-xs font-medium uppercase text-stone-500">Recent activity</p>
          <ul class="mt-2 space-y-1 text-sm text-stone-600">
            <li v-for="t in transactions.slice(0, 8)" :key="t.id">
              {{ t.username || 'Guest' }} · {{ t.type }} {{ t.points }} · {{ t.description || '—' }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { adjustCrmLoyalty, getCrmLoyalty } from '../../services/data'

const guests = ref([])
const transactions = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = reactive({ user_id: 0, type: 'earn', points: 50, description: '' })

const totalPoints = computed(() => guests.value.reduce((sum, g) => sum + Number(g.loyalty_points || 0), 0))

function tierClass(status) {
  const map = {
    platinum: 'bg-slate-800 text-white',
    gold: 'bg-amber-100 text-amber-800',
    silver: 'bg-stone-200 text-stone-800',
    regular: 'bg-stone-100 text-stone-600',
  }
  return map[status] || map.regular
}

async function load() {
  loading.value = true
  try {
    const data = await getCrmLoyalty()
    guests.value = data.guests || []
    transactions.value = data.transactions || []
  } catch (e) {
    error.value = e.message
  }
  loading.value = false
}

async function adjust() {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    await adjustCrmLoyalty({
      user_id: form.user_id,
      type: form.type,
      points: form.points,
      description: form.description || null,
    })
    form.description = ''
    success.value = 'Points updated.'
    await load()
  } catch (e) {
    error.value = e.message
  }
  saving.value = false
}

onMounted(load)
</script>

<style scoped>
.field {
  @apply mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
}
</style>
