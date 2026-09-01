<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Messages</h1>
    <p class="mt-1 text-stone-600">Contact form submissions.</p>

    <div class="mt-6 space-y-4">
      <div
        v-for="c in contacts"
        :key="c.id"
        class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
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
        <p class="mt-2 text-xs text-stone-400">{{ c.created_at }}</p>
      </div>
    </div>
    <p v-if="contacts.length === 0 && !loading" class="text-stone-500">No messages.</p>
    <p v-if="loading" class="text-stone-500">Loading…</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getContacts, updateContactStatus } from '../../services/data'

const contacts = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
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
    await load()
  } catch (e) {
    alert(e.message || 'Update failed')
  }
}

onMounted(load)
</script>
