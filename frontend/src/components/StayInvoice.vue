<template>
  <div class="rounded-xl border border-stone-200 bg-white p-5 text-stone-800 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-lg font-semibold">{{ invoice.hotel_name }}</p>
        <p class="text-sm text-stone-500">{{ invoice.hotel_location }}</p>
        <p class="mt-2 text-sm font-medium">{{ invoice.invoice_no }}</p>
        <p v-if="invoice.invoiced_at" class="text-xs text-stone-500">Issued {{ invoice.invoiced_at }}</p>
      </div>
      <button v-if="showPrint" type="button" class="rounded-md bg-stone-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-900" @click="printStayInvoice(invoice)">
        Print
      </button>
    </div>
    <div class="mt-4 grid gap-1 text-sm text-stone-600 sm:grid-cols-2">
      <p>{{ invoice.guest_name }}</p>
      <p>{{ invoice.guest_email }}</p>
      <p v-if="invoice.guest_id_number">ID: {{ invoice.guest_id_number }}</p>
      <p>{{ invoice.room_name }} · {{ invoice.check_in }} → {{ invoice.check_out }}</p>
    </div>
    <table class="mt-4 min-w-full divide-y divide-stone-200 text-sm">
      <thead>
        <tr class="text-left text-xs uppercase text-stone-500">
          <th class="py-2 pr-3 font-medium">When</th>
          <th class="py-2 pr-3 font-medium">Line</th>
          <th class="py-2 pr-3 font-medium">Type</th>
          <th class="py-2 text-right font-medium">Amount</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-100">
        <tr v-for="item in invoice.lines || []" :key="item.id">
          <td class="whitespace-nowrap py-2 pr-3 text-xs text-stone-500">{{ item.created_at }}</td>
          <td class="py-2 pr-3">
            {{ item.description }}
            <span v-if="item.method" class="text-xs text-stone-500"> · {{ payMethodLabel(item.method) }}</span>
          </td>
          <td class="py-2 pr-3 text-stone-600">{{ folioCategoryLabel(item.category) }}</td>
          <td class="py-2 text-right font-medium" :class="item.kind === 'payment' ? 'text-green-700' : ''">
            {{ item.kind === 'payment' ? '−' : '' }}{{ formatMoney(item.amount) }}
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!(invoice.lines || []).length" class="mt-3 text-sm text-stone-500">No folio lines yet.</p>
    <div class="mt-4 text-sm">
      <p>Charges {{ formatMoney(invoice.folio_charges) }} · Payments {{ formatMoney(invoice.folio_payments) }}</p>
      <p class="font-semibold" :class="Number(invoice.folio_balance) > 0.009 ? 'text-amber-700' : 'text-green-700'">
        Balance {{ formatMoney(invoice.folio_balance) }}
      </p>
      <p v-if="methodSummary" class="mt-1 text-xs text-stone-500">{{ methodSummary }}</p>
    </div>
    <div class="mt-6 border-t border-stone-200 pt-4 text-sm text-stone-600">
      <p class="font-semibold text-stone-800">{{ invoice.hotel_name }}</p>
      <p v-if="invoice.hotel_location">{{ invoice.hotel_location }}</p>
      <p>{{ invoice.hotel_phone || '+855 98 944 686' }}</p>
      <p>{{ invoice.hotel_email || 'noreply@smilerental.com' }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatMoney } from '../utils/money'
import { folioCategoryLabel, payMethodLabel, printStayInvoice } from '../utils/invoice'

const props = defineProps({
  invoice: { type: Object, required: true },
  showPrint: { type: Boolean, default: true },
})

const methodSummary = computed(() => {
  const methods = props.invoice.payments_by_method || {}
  return ['cash', 'bank', 'card']
    .filter((k) => Number(methods[k]) > 0)
    .map((k) => `${payMethodLabel(k)} ${formatMoney(methods[k])}`)
    .join(' · ')
})
</script>
