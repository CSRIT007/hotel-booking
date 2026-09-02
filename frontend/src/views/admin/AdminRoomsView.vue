<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-stone-800">Rooms</h1>
        <p class="mt-1 text-stone-600">Add or remove rooms for a property. They appear on the public rooms page when available.</p>
      </div>
      <router-link to="/admin/properties" class="text-sm font-medium text-brand-600 hover:underline">← Properties</router-link>
    </div>

    <p v-if="!loading && hotels.length === 0" class="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      Add a property first, then you can add rooms.
      <router-link to="/admin/properties" class="font-medium underline">Go to Properties</router-link>
    </p>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="save">
        <h2 class="text-sm font-semibold text-stone-800">{{ editingId ? 'Edit room' : 'Add room' }}</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Property</label>
            <select v-model.number="form.hotel_id" required class="field" :disabled="saving || hotels.length === 0">
              <option disabled value="">Select property</option>
              <option v-for="h in hotels" :key="h.id" :value="h.id">{{ h.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Room name</label>
            <input v-model="form.name" type="text" required class="field" :disabled="saving" placeholder="e.g. Deluxe King" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Description</label>
            <textarea v-model="form.description" rows="2" class="field" :disabled="saving" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">Price / night</label>
              <input v-model.number="form.price" type="number" min="0" step="0.01" required class="field" :disabled="saving" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Max guests</label>
              <input v-model.number="form.max_persons" type="number" min="1" class="field" :disabled="saving" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Size</label>
              <input v-model="form.size" type="text" class="field" :disabled="saving" placeholder="45 m2" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Beds</label>
              <input v-model.number="form.beds" type="number" min="1" class="field" :disabled="saving" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">View</label>
            <input v-model="form.view_type" type="text" class="field" :disabled="saving" placeholder="City view" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Status</label>
            <select v-model="form.status" class="field" :disabled="saving">
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <AdminPhotoFields v-model:image="form.image" v-model:images="form.images" :stock="ROOM_IMAGES" :disabled="saving" />
        </div>
        <p v-if="formError" class="mt-3 text-sm text-red-600">{{ formError }}</p>
        <p v-if="formSuccess" class="mt-3 text-sm text-green-600">{{ formSuccess }}</p>
        <div class="mt-4 flex gap-2">
          <button type="submit" class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50" :disabled="saving || hotels.length === 0">
            {{ saving ? 'Saving…' : editingId ? 'Save changes' : 'Add room' }}
          </button>
          <button v-if="editingId" type="button" class="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50" @click="resetForm">
            Cancel
          </button>
        </div>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Room</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Property</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Price</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="r in rooms" :key="r.id" class="hover:bg-stone-50">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="h-12 w-16 flex-shrink-0 rounded bg-stone-200 bg-cover bg-center" :style="{ backgroundImage: `url(${r.image || '/images/room-1.jpg'})` }" />
                    <div>
                      <p class="font-medium text-stone-800">{{ r.name }}</p>
                      <p class="text-xs text-stone-500">{{ r.max_persons }} guests · {{ r.size || '—' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-stone-600">{{ r.hotel_name || '—' }}</td>
                <td class="px-4 py-3 text-right">{{ formatMoney(r.price) }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-800': r.status === 'available',
                      'bg-amber-100 text-amber-800': r.status === 'booked',
                      'bg-stone-100 text-stone-600': r.status === 'maintenance',
                    }"
                  >{{ r.status || 'available' }}</span>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <button type="button" class="mr-3 text-brand-600 hover:underline" @click="edit(r)">Edit</button>
                  <button type="button" class="text-red-600 hover:underline" @click="askRemove(r)">Remove</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="rooms.length === 0 && !loading" class="p-4 text-center text-stone-500">No rooms yet.</p>
        <p v-if="loading" class="p-4 text-center text-stone-500">Loading…</p>
      </div>
    </div>

    <ConfirmModal
      :open="!!pendingDelete"
      title="Remove this room?"
      :message="pendingDelete ? `“${pendingDelete.name}” will be removed from the website. Related bookings will also be deleted.` : ''"
      confirm-text="Remove"
      cancel-text="Keep"
      @confirm="remove"
      @cancel="pendingDelete = null"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { createRoom, deleteRoom, getHotels, getRooms, updateRoom } from '../../services/data'
import { ROOM_IMAGES } from '../../constants/media'
import ConfirmModal from '../../components/ConfirmModal.vue'
import AdminPhotoFields from '../../components/AdminPhotoFields.vue'
import { formatMoney } from '../../utils/money'

const hotels = ref([])
const rooms = ref([])
const loading = ref(true)
const saving = ref(false)
const formError = ref('')
const formSuccess = ref('')
const editingId = ref(null)
const pendingDelete = ref(null)

const form = reactive({
  hotel_id: '',
  name: '',
  description: '',
  price: 100,
  max_persons: 2,
  size: '30 m2',
  view_type: 'City View',
  beds: 1,
  image: ROOM_IMAGES[0].value,
  images: [],
  status: 'available',
})

function resetForm() {
  editingId.value = null
  form.hotel_id = hotels.value[0]?.id || ''
  form.name = ''
  form.description = ''
  form.price = 100
  form.max_persons = 2
  form.size = '30 m2'
  form.view_type = 'City View'
  form.beds = 1
  form.image = ROOM_IMAGES[0].value
  form.images = []
  form.status = 'available'
  formError.value = ''
}

function edit(r) {
  editingId.value = r.id
  form.hotel_id = r.hotel_id
  form.name = r.name || ''
  form.description = r.description || ''
  form.price = Number(r.price || 0)
  form.max_persons = Number(r.max_persons || 2)
  form.size = r.size || ''
  form.view_type = r.view_type || ''
  form.beds = Number(r.beds || 1)
  form.image = r.image || ROOM_IMAGES[0].value
  form.images = Array.isArray(r.images) ? [...r.images] : []
  form.status = r.status || 'available'
  formError.value = ''
  formSuccess.value = ''
}

async function load() {
  loading.value = true
  try {
    const [hotelList, roomList] = await Promise.all([getHotels(), getRooms()])
    hotels.value = hotelList
    rooms.value = roomList
    if (!form.hotel_id && hotelList[0]) form.hotel_id = hotelList[0].id
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
    const payload = { ...form, name: form.name.trim() }
    if (editingId.value) await updateRoom(editingId.value, payload)
    else await createRoom(payload)
    formSuccess.value = editingId.value ? 'Room updated.' : 'Room added. Guests can book it when status is available.'
    resetForm()
    await load()
  } catch (e) {
    formError.value = e.message || 'Could not save room.'
  }
  saving.value = false
}

function askRemove(r) {
  pendingDelete.value = r
}

async function remove() {
  const row = pendingDelete.value
  pendingDelete.value = null
  if (!row) return
  try {
    await deleteRoom(row.id)
    if (editingId.value === row.id) resetForm()
    await load()
  } catch (e) {
    formError.value = e.message || 'Could not remove room.'
  }
}

onMounted(load)
</script>

<style scoped>
.field {
  @apply mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
}
</style>
