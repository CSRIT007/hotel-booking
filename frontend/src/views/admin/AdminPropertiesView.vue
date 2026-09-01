<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-stone-800">Properties</h1>
        <p class="mt-1 text-stone-600">Add or remove hotels. Guests see these on the home page.</p>
      </div>
      <router-link to="/admin/rooms" class="text-sm font-medium text-brand-600 hover:underline">Manage rooms →</router-link>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="save">
        <h2 class="text-sm font-semibold text-stone-800">{{ editingId ? 'Edit property' : 'Add property' }}</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Name</label>
            <input v-model="form.name" type="text" required class="field" :disabled="saving" placeholder="e.g. Smile Riverside" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Location</label>
            <input v-model="form.location" type="text" required class="field" :disabled="saving" placeholder="Phnom Penh" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Description</label>
            <textarea v-model="form.description" rows="3" class="field" :disabled="saving" placeholder="Short description for the website" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Photo</label>
            <select v-model="form.image" class="field" :disabled="saving">
              <option v-for="img in PROPERTY_IMAGES" :key="img.value" :value="img.value">{{ img.label }}</option>
            </select>
            <div class="mt-2 h-28 rounded-lg bg-stone-200 bg-cover bg-center" :style="{ backgroundImage: `url(${form.image})` }" />
          </div>
        </div>
        <p v-if="formError" class="mt-3 text-sm text-red-600">{{ formError }}</p>
        <p v-if="formSuccess" class="mt-3 text-sm text-green-600">{{ formSuccess }}</p>
        <div class="mt-4 flex gap-2">
          <button type="submit" class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50" :disabled="saving">
            {{ saving ? 'Saving…' : editingId ? 'Save changes' : 'Add property' }}
          </button>
          <button v-if="editingId" type="button" class="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50" @click="resetForm">
            Cancel
          </button>
        </div>
      </form>

      <div class="grid gap-4 sm:grid-cols-2">
        <article v-for="h in hotels" :key="h.id" class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div class="h-36 bg-stone-200 bg-cover bg-center" :style="{ backgroundImage: `url(${h.image || '/images/services-1.jpg'})` }" />
          <div class="p-4">
            <h3 class="font-semibold text-stone-800">{{ h.name }}</h3>
            <p class="text-sm text-stone-500">{{ h.location }}</p>
            <p class="mt-1 line-clamp-2 text-sm text-stone-600">{{ h.description }}</p>
            <div class="mt-3 flex gap-3 text-sm">
              <button type="button" class="text-brand-600 hover:underline" @click="edit(h)">Edit</button>
              <button type="button" class="text-red-600 hover:underline" @click="askRemove(h)">Remove</button>
            </div>
          </div>
        </article>
        <p v-if="!loading && hotels.length === 0" class="sm:col-span-2 text-sm text-stone-500">No properties yet. Add one on the left.</p>
        <p v-if="loading" class="sm:col-span-2 text-sm text-stone-500">Loading…</p>
      </div>
    </div>

    <ConfirmModal
      :open="!!pendingDelete"
      title="Remove this property?"
      :message="pendingDelete ? `“${pendingDelete.name}” and all of its rooms and bookings will be removed from the website.` : ''"
      confirm-text="Remove"
      cancel-text="Keep"
      @confirm="remove"
      @cancel="pendingDelete = null"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { createHotel, deleteHotel, getHotels, updateHotel } from '../../services/data'
import { PROPERTY_IMAGES } from '../../constants/media'
import ConfirmModal from '../../components/ConfirmModal.vue'

const hotels = ref([])
const loading = ref(true)
const saving = ref(false)
const formError = ref('')
const formSuccess = ref('')
const editingId = ref(null)
const pendingDelete = ref(null)

const form = reactive({
  name: '',
  location: '',
  description: '',
  image: PROPERTY_IMAGES[0].value,
})

function resetForm() {
  editingId.value = null
  form.name = ''
  form.location = ''
  form.description = ''
  form.image = PROPERTY_IMAGES[0].value
  formError.value = ''
}

function edit(h) {
  editingId.value = h.id
  form.name = h.name || ''
  form.location = h.location || ''
  form.description = h.description || ''
  form.image = h.image || PROPERTY_IMAGES[0].value
  formError.value = ''
  formSuccess.value = ''
}

async function load() {
  loading.value = true
  try {
    hotels.value = await getHotels()
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
}

async function save() {
  formError.value = ''
  formSuccess.value = ''
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      image: form.image,
    }
    if (editingId.value) await updateHotel(editingId.value, payload)
    else await createHotel(payload)
    formSuccess.value = editingId.value ? 'Property updated.' : 'Property added. Guests can see it on the home page.'
    resetForm()
    await load()
  } catch (e) {
    formError.value = e.message || 'Could not save property.'
  }
  saving.value = false
}

function askRemove(h) {
  pendingDelete.value = h
}

async function remove() {
  const row = pendingDelete.value
  pendingDelete.value = null
  if (!row) return
  try {
    await deleteHotel(row.id)
    if (editingId.value === row.id) resetForm()
    await load()
  } catch (e) {
    formError.value = e.message || 'Could not remove property.'
  }
}

onMounted(load)
</script>

<style scoped>
.field {
  @apply mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
}
</style>
