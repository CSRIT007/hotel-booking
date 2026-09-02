<template>
  <div class="space-y-3">
    <div>
      <label class="block text-xs font-medium text-stone-700">Cover photo</label>
      <select
        :value="image"
        class="field"
        :disabled="disabled || uploading"
        @change="$emit('update:image', $event.target.value)"
      >
        <option v-for="img in coverChoices" :key="img.value" :value="img.value">{{ img.label }}</option>
      </select>
      <label class="mt-2 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-stone-300 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" :disabled="disabled || uploading" @change="onCover" />
        {{ uploading ? 'Uploading…' : 'Upload a new photo' }}
      </label>
      <div class="mt-2 h-28 rounded-lg bg-stone-200 bg-cover bg-center" :style="{ backgroundImage: `url(${image})` }" />
    </div>
    <div>
      <label class="block text-xs font-medium text-stone-700">More photos</label>
      <p class="mt-0.5 text-[11px] leading-snug text-stone-500">Add extra photos now, or open Edit later to add more.</p>
      <label class="mt-2 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-stone-300 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple class="hidden" :disabled="disabled || uploading" @change="onExtras" />
        Add photos
      </label>
      <div v-if="images.length" class="mt-2 grid grid-cols-3 gap-2">
        <div v-for="(src, i) in images" :key="src + i" class="relative">
          <div class="h-16 rounded bg-stone-200 bg-cover bg-center" :style="{ backgroundImage: `url(${src})` }" />
          <button type="button" class="absolute right-1 top-1 rounded bg-white/90 px-1 text-[10px] font-semibold text-red-600" :disabled="disabled" @click="removeAt(i)">×</button>
        </div>
      </div>
    </div>
    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { uploadImage } from '../services/data'

const props = defineProps({
  image: { type: String, default: '' },
  images: { type: Array, default: () => [] },
  stock: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:image', 'update:images'])
const uploading = ref(false)
const error = ref('')

const coverChoices = computed(() => {
  const list = [...props.stock]
  if (props.image && !list.some((img) => img.value === props.image)) {
    list.unshift({ value: props.image, label: 'Uploaded photo' })
  }
  return list
})

async function uploadFile(file) {
  return uploadImage(file)
}

async function onCover(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  error.value = ''
  uploading.value = true
  try {
    const { url } = await uploadFile(file)
    emit('update:image', url)
  } catch (err) {
    error.value = err.message || 'Could not upload photo.'
  }
  uploading.value = false
}

async function onExtras(e) {
  const files = [...(e.target.files || [])]
  e.target.value = ''
  if (!files.length) return
  error.value = ''
  uploading.value = true
  try {
    const urls = []
    for (const file of files) {
      const { url } = await uploadFile(file)
      urls.push(url)
    }
    emit('update:images', [...props.images, ...urls])
  } catch (err) {
    error.value = err.message || 'Could not upload photo.'
  }
  uploading.value = false
}

function removeAt(i) {
  const removed = props.images[i]
  const next = props.images.filter((_, idx) => idx !== i)
  emit('update:images', next)
  if (removed && removed === props.image && props.stock[0]?.value) {
    emit('update:image', props.stock[0].value)
  }
}
</script>

<style scoped>
.field {
  @apply mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
}
</style>
