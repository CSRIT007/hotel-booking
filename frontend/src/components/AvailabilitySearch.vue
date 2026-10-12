<template>
  <form
    class="availability-search"
    :class="variant === 'hero'
      ? 'rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xl shadow-stone-950/25 sm:p-5'
      : 'rounded-2xl border border-stone-200 bg-white p-4 shadow-sm'"
    @submit.prevent="onSubmit"
  >
    <div
      class="grid gap-3"
      :class="variant === 'hero'
        ? (hotels.length ? 'sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1fr_0.75fr_auto]' : 'sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.75fr_auto]')
        : 'sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end'"
    >
      <div v-if="hotels.length" class="lg:min-w-[11rem] lg:flex-1">
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">Property</label>
        <select
          :value="hotelId"
          class="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          @change="$emit('update:hotelId', $event.target.value)"
        >
          <option value="">All properties</option>
          <option v-for="hotel in hotels" :key="hotel.id" :value="String(hotel.id)">{{ hotel.name }}</option>
        </select>
      </div>
      <div class="lg:min-w-[10rem] lg:flex-1">
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">Check-in</label>
        <input
          :value="checkIn"
          type="date"
          :min="minDate"
          :required="variant === 'hero'"
          class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          @input="$emit('update:checkIn', $event.target.value)"
        />
      </div>
      <div class="lg:min-w-[10rem] lg:flex-1">
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">Check-out</label>
        <input
          :value="checkOut"
          type="date"
          :min="checkOutMin"
          :required="variant === 'hero'"
          class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          @input="$emit('update:checkOut', $event.target.value)"
        />
      </div>
      <div class="lg:min-w-[8rem] lg:w-36">
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">Guests</label>
        <select
          :value="guests"
          class="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          @change="$emit('update:guests', Number($event.target.value))"
        >
          <option v-for="n in guestOptions" :key="n" :value="n">{{ n }} {{ n === 1 ? 'guest' : 'guests' }}</option>
        </select>
      </div>
      <div class="flex items-end gap-2 sm:col-span-2 lg:col-auto">
        <button
          type="submit"
          class="w-full rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 lg:w-auto lg:whitespace-nowrap"
        >
          {{ submitLabel }}
        </button>
        <button
          v-if="showClear && (checkIn || checkOut)"
          type="button"
          class="rounded-lg border border-stone-300 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
          @click="$emit('clear')"
        >
          Clear
        </button>
      </div>
    </div>
    <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
  </form>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  checkIn: { type: String, default: '' },
  checkOut: { type: String, default: '' },
  guests: { type: [Number, String], default: 2 },
  hotelId: { type: [Number, String], default: '' },
  hotels: { type: Array, default: () => [] },
  variant: { type: String, default: 'hero' },
  submitLabel: { type: String, default: 'Check availability' },
  showClear: { type: Boolean, default: false },
  error: { type: String, default: '' },
  minDate: { type: String, default: '' },
  maxGuests: { type: Number, default: 8 },
})

const emit = defineEmits(['update:checkIn', 'update:checkOut', 'update:guests', 'update:hotelId', 'submit', 'clear'])

const guestOptions = computed(() => {
  const max = Math.max(1, Number(props.maxGuests) || 8)
  return Array.from({ length: max }, (_, i) => i + 1)
})

function addDays(ymd, n) {
  const [y, m, d] = String(ymd).split('-').map(Number)
  if (!y || !m || !d) return ymd
  const dt = new Date(y, m - 1, d + n)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

const checkOutMin = computed(() => {
  if (props.checkIn) return addDays(props.checkIn, 1)
  return props.minDate || ''
})

function onSubmit() {
  emit('submit')
}
</script>
