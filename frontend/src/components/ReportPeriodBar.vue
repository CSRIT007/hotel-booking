<template>
  <div class="flex flex-wrap items-end gap-2">
    <label class="block text-xs font-medium text-stone-600">
      Start
      <input v-model="from" type="date" class="mt-0.5 block rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-800" />
    </label>
    <label class="block text-xs font-medium text-stone-600">
      End
      <input v-model="to" type="date" class="mt-0.5 block rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-800" />
    </label>
    <button type="button" class="rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50" @click="thisMonth">This month</button>
    <button type="button" class="rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50" @click="allDates">All dates</button>
  </div>
</template>

<script setup>
import { dateRangePresets } from '../services/finance'

const from = defineModel('from', { type: String, default: '' })
const to = defineModel('to', { type: String, default: '' })

function thisMonth() {
  const month = dateRangePresets().month
  from.value = month.from
  to.value = month.to
}

function allDates() {
  from.value = ''
  to.value = ''
}
</script>
