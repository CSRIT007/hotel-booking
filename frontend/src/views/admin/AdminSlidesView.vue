<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Slideshow</h1>
    <p class="mt-1 text-stone-600">
      The home page shows up to 5 active slides. Use Inactive to hide a slide without deleting it. Active slides can be 5 or fewer.
    </p>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="save">
        <h2 class="text-sm font-semibold text-stone-800">{{ editingId ? `Edit slide #${editingId}` : 'New slide' }}</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Photo</label>
            <select v-model="form.image" class="field">
              <option v-for="img in photoChoices" :key="img.value" :value="img.value">{{ img.label }}</option>
            </select>
            <label class="mt-2 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-stone-300 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50">
              <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif" class="hidden" :disabled="uploading" @change="onUpload" />
              {{ uploading ? 'Uploading to the server…' : 'Upload a photo' }}
            </label>
            <p class="mt-1 text-[11px] leading-snug text-stone-500">JPG, PNG, WebP, or GIF, up to 12 MB. Uploaded photos stay in this list for later slides. On the live server, upload here — a git push from your PC does not copy the photo.</p>
            <div class="mt-2 h-28 rounded-lg bg-stone-200 bg-cover bg-center" :style="{ backgroundImage: `url(${form.image})` }" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Small line</label>
            <input v-model="form.eyebrow" type="text" class="field" placeholder="Phnom Penh, Cambodia" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Title</label>
            <input v-model="form.title" type="text" required class="field" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Subtitle</label>
            <textarea v-model="form.subtitle" rows="3" class="field" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">Button text</label>
              <input v-model="form.button_label" type="text" class="field" placeholder="Browse rooms" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Button link</label>
              <input v-model="form.button_link" type="text" class="field" placeholder="/rooms" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">Order</label>
              <select v-model.number="form.sort_order" class="field">
                <option v-for="n in SLIDE_MAX" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Status</label>
              <select v-model="form.status" class="field">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="mt-3 text-sm text-green-600">{{ success }}</p>
        <div class="mt-4 flex gap-2">
          <button type="submit" class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving || (!editingId && slides.length >= SLIDE_MAX)">
            {{ saving ? 'Saving…' : editingId ? 'Save changes' : 'Add slide' }}
          </button>
          <button v-if="editingId" type="button" class="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700" @click="resetForm">Cancel</button>
        </div>
        <p v-if="!editingId && slides.length >= SLIDE_MAX" class="mt-2 text-xs text-stone-500">Five slides are in use. Edit one, or remove it to add another.</p>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Slide</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Order</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Status</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="row in slides" :key="row.id" class="hover:bg-stone-50">
              <td class="px-4 py-3">
                <div class="flex gap-3">
                  <div class="h-14 w-20 flex-shrink-0 rounded bg-stone-200 bg-cover bg-center" :style="{ backgroundImage: `url(${row.image})` }" />
                  <div>
                    <p class="font-semibold text-stone-900">{{ row.title }}</p>
                    <p class="text-xs text-stone-500">{{ row.eyebrow || '—' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3">{{ row.sort_order }}</td>
              <td class="px-3 py-3">
                <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold" :class="row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-700'">{{ row.status }}</span>
              </td>
              <td class="whitespace-nowrap px-3 py-3">
                <button type="button" class="mr-2 text-brand-700 hover:underline" @click="edit(row)">Edit</button>
                <button type="button" class="mr-2 text-stone-600 hover:underline" @click="toggle(row)">{{ row.status === 'active' ? 'Inactive' : 'Active' }}</button>
                <button type="button" class="text-red-600 hover:underline" @click="remove(row)">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="slides.length === 0 && !loading" class="p-4 text-center text-stone-500">No slides yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { PROPERTY_IMAGES } from '../../constants/media'
import { createSlide, deleteSlide, getSlides, getUploadedPhotos, updateSlide, uploadImage } from '../../services/data'

const SLIDE_MAX = 5
const slides = ref([])
const uploadedPhotos = ref([])
const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const error = ref('')
const success = ref('')
const editingId = ref(null)
const form = reactive(emptyForm())

const photoChoices = computed(() => {
  const seen = new Set()
  const list = []
  for (const img of PROPERTY_IMAGES) {
    if (seen.has(img.value)) continue
    seen.add(img.value)
    list.push(img)
  }
  for (const img of uploadedPhotos.value) {
    if (!img?.value || seen.has(img.value)) continue
    seen.add(img.value)
    list.push(img)
  }
  if (form.image && !seen.has(form.image) && String(form.image).startsWith('/uploads/')) {
    list.push({ value: form.image, label: 'Uploaded photo' })
  }
  return list
})

function emptyForm() {
  return {
    eyebrow: '',
    title: '',
    subtitle: '',
    image: PROPERTY_IMAGES[1].value,
    button_label: 'Browse rooms',
    button_link: '/rooms',
    sort_order: 1,
    status: 'active',
  }
}

function resetForm() {
  editingId.value = null
  Object.assign(form, emptyForm())
}

async function load() {
  loading.value = true
  try {
    const [rows, photos] = await Promise.all([getSlides({ all: true }), getUploadedPhotos()])
    slides.value = rows
    uploadedPhotos.value = photos
  } catch (e) {
    error.value = e.message
  }
  loading.value = false
}

function edit(row) {
  editingId.value = row.id
  Object.assign(form, {
    eyebrow: row.eyebrow,
    title: row.title,
    subtitle: row.subtitle,
    image: row.image,
    button_label: row.button_label,
    button_link: row.button_link,
    sort_order: row.sort_order,
    status: row.status,
  })
  error.value = ''
  success.value = ''
}

async function onUpload(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  error.value = ''
  uploading.value = true
  try {
    const data = await uploadImage(file)
    form.image = data.url
    const photos = Array.isArray(data.photos) ? [...data.photos] : []
    if (data.url && !photos.some((img) => img.value === data.url)) {
      photos.unshift({ value: data.url, label: 'Uploaded photo' })
    }
    uploadedPhotos.value = photos
  } catch (err) {
    error.value = err.message || 'Could not upload photo.'
  }
  uploading.value = false
}

async function save() {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    if (editingId.value) {
      await updateSlide(editingId.value, { ...form })
      success.value = 'Slide updated. Check the home page.'
    } else {
      await createSlide({ ...form })
      success.value = 'Slide added.'
    }
    resetForm()
    await load()
  } catch (e) {
    error.value = e.message
  }
  saving.value = false
}

async function toggle(row) {
  error.value = ''
  try {
    await updateSlide(row.id, { status: row.status === 'active' ? 'inactive' : 'active' })
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function remove(row) {
  error.value = ''
  try {
    await deleteSlide(row.id)
    if (editingId.value === row.id) resetForm()
    await load()
  } catch (e) {
    error.value = e.message
  }
}

onMounted(load)
</script>

<style scoped>
.field {
  @apply mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
}
</style>
