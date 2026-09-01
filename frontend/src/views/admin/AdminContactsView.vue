<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Messages</h1>
    <p class="mt-1 text-stone-600">Guest contact form. New messages stay highlighted until you mark them read.</p>

    <div
      v-if="newCount > 0"
      class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      {{ newCount }} new message{{ newCount === 1 ? '' : 's' }} waiting.
    </div>

    <div class="mt-6 space-y-4">
      <div
        v-for="c in contacts"
        :key="c.id"
        class="rounded-xl border bg-white p-4 shadow-sm"
        :class="c.status === 'new' ? 'border-red-200 ring-1 ring-red-100' : 'border-stone-200'"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span class="font-medium text-stone-800">{{ c.name }}</span>
            <span class="text-stone-500"> · {{ c.email }}</span>
            <span
              class="ml-2 inline-flex rounded px-2 py-0.5 text-xs"
              :class="{
                'bg-amber-100 text-amber-800': c.status === 'new',
                'bg-stone-100 text-stone-600': c.status === 'read',
                'bg-green-100 text-green-800': c.status === 'replied',
              }"
            >
              {{ c.status }}
            </span>
          </div>
          <div class="flex gap-2">
            <button
              v-if="c.status === 'new'"
              type="button"
              class="text-sm text-stone-600 hover:underline"
              @click="setStatus(c.id, 'read')"
            >
              Mark read
            </button>
            <button
              v-if="c.status !== 'replied'"
              type="button"
              class="text-sm text-green-600 hover:underline"
              @click="setStatus(c.id, 'replied')"
            >
              Mark replied
            </button>
          </div>
        </div>
        <p v-if="c.subject" class="mt-1 text-sm font-medium text-stone-700">{{ c.subject }}</p>
        <p class="mt-2 text-sm text-stone-600">{{ c.message }}</p>
        <p class="mt-2 text-xs text-stone-400">{{ formatWhen(c.created_at) }}</p>
      </div>
    </div>
    <p v-if="contacts.length === 0 && !loading" class="text-stone-500">No messages.</p>
    <p v-if="loading" class="text-stone-500">Loading…</p>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getContacts, updateContactStatus } from '../../services/data'
import { useStaffAlerts } from '../../composables/useStaffAlerts'

const { refresh } = useStaffAlerts()
const contacts = ref([])
const loading = ref(true)
let pollTimer = null

const newCount = computed(() => contacts.value.filter((c) => c.status === 'new').length)

function formatWhen(val) {
  if (!val) return ''
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? val : d.toLocaleString()
}

async function load(showSpinner = true) {
  if (showSpinner) loading.value = true
  try {
    contacts.value = await getContacts()
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
}

async function setStatus(id, status) {
  try {
    await updateContactStatus(id, status)
    await load(false)
    await refresh()
  } catch (e) {
    alert(e.message || 'Update failed')
  }
}

onMounted(() => {
  load()
  pollTimer = setInterval(() => load(false), 10000)
})
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
