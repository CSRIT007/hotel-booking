<template>
  <div class="admin-nav-search relative w-56 max-w-[16rem]">
    <input
      ref="inputEl"
      v-model="query"
      type="text"
      placeholder="Search"
      class="w-full rounded-full border border-stone-300 bg-stone-50 py-1.5 pl-4 pr-14 text-sm text-stone-800 shadow-sm outline-none ring-0 placeholder:text-stone-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-200 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-400 dark:focus:border-brand-400 dark:focus:bg-stone-800"
      aria-label="Search the manage portal"
      @focus="open = true"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="go(activeIndex >= 0 ? matches[activeIndex] : matches[0])"
      @keydown.escape="close"
    />
    <kbd
      v-show="!query.trim()"
      class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-stone-300 bg-white px-1.5 py-0.5 text-[10px] font-medium leading-none text-stone-500 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-300"
    >{{ shortcut }}</kbd>
    <ul
      v-if="open && query.trim() && matches.length"
      class="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-auto rounded-2xl border border-stone-200 bg-white py-1 shadow-lg dark:border-stone-700 dark:bg-stone-900"
    >
      <li v-for="(item, i) in matches" :key="item.to">
        <button
          type="button"
          class="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-800"
          :class="i === activeIndex ? 'bg-stone-100 dark:bg-stone-800' : ''"
          @mousedown.prevent="go(item)"
        >
          <span class="font-medium text-stone-800 dark:text-stone-100">{{ item.label }}</span>
          <span class="text-[11px] text-stone-500">{{ item.group }}</span>
        </button>
      </li>
    </ul>
    <p
      v-else-if="open && query.trim() && !matches.length"
      class="absolute left-0 right-0 z-50 mt-1 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-500 shadow-lg dark:border-stone-700 dark:bg-stone-900"
    >
      No match for “{{ query.trim() }}”
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const PAGES = [
  { to: '/admin', label: 'Dashboard', group: 'Home', keys: 'home summary' },
  { to: '/admin/properties', label: 'Properties', group: 'Property', keys: 'hotel' },
  { to: '/admin/rooms', label: 'Rooms', group: 'Property', keys: 'room' },
  { to: '/admin/bookings', label: 'Bookings', group: 'Property', keys: 'stay reservation' },
  { to: '/admin/guests', label: 'Guests', group: 'Property', keys: 'guest customer' },
  { to: '/admin/housekeeping', label: 'Housekeeping', group: 'Property', keys: 'clean' },
  { to: '/admin/slides', label: 'Slideshow', group: 'Property', keys: 'slide photo hero' },
  { to: '/admin/pos-sales', label: 'Sales', group: 'POS', keys: 'pos' },
  { to: '/admin/pos-products', label: 'Products', group: 'POS', keys: 'pos product' },
  { to: '/admin/pos-transactions', label: 'Transactions', group: 'POS', keys: 'pos' },
  { to: '/admin/crs-rates', label: 'Rates', group: 'Reservations', keys: 'crs price' },
  { to: '/admin/crs-channels', label: 'Channels', group: 'Reservations', keys: 'crs' },
  { to: '/admin/crs-availability', label: 'Availability', group: 'Reservations', keys: 'crs' },
  { to: '/admin/crm-campaigns', label: 'Campaigns', group: 'CRM', keys: 'crm' },
  { to: '/admin/crm-loyalty', label: 'Loyalty', group: 'CRM', keys: 'points' },
  { to: '/admin/crm-communications', label: 'Communications', group: 'CRM', keys: 'email' },
  { to: '/admin/finance-revenue', label: 'Revenue', group: 'Finance', keys: 'money income' },
  { to: '/admin/finance-expense', label: 'Expenses', group: 'Finance', keys: 'cost' },
  { to: '/admin/finance-profit', label: 'Profit', group: 'Finance', keys: 'profit' },
  { to: '/admin/hr-employees', label: 'Employee information', group: 'HR', keys: 'staff' },
  { to: '/admin/hr-org', label: 'Departments', group: 'HR', keys: 'org' },
  { to: '/admin/hr-schedules', label: 'Schedules', group: 'HR', keys: 'shift' },
  { to: '/admin/hr-payroll', label: 'Payroll', group: 'HR', keys: 'salary' },
  { to: '/admin/hr-leaves', label: 'Leaves', group: 'HR', keys: 'vacation' },
  { to: '/admin/maintenance-requests', label: 'Requests', group: 'Maintenance', keys: 'repair' },
  { to: '/admin/maintenance-schedule', label: 'Schedule', group: 'Maintenance', keys: 'work' },
  { to: '/admin/maintenance-inventory', label: 'Inventory', group: 'Maintenance', keys: 'parts' },
  { to: '/admin/reports', label: 'Reports', group: 'Analytics', keys: 'report' },
  { to: '/admin/analytics-kpi', label: 'KPIs', group: 'Analytics', keys: 'kpi' },
  { to: '/admin/users', label: 'User management', group: 'Admin', keys: 'account' },
  { to: '/admin/audit-log', label: 'Audit log', group: 'Admin', keys: 'log' },
  { to: '/admin/login-activity', label: 'Login activity', group: 'Admin', keys: 'login' },
  { to: '/admin/security', label: 'Security', group: 'Admin', keys: 'lock' },
  { to: '/admin/contacts', label: 'Messages', group: 'Inbox', keys: 'contact message inbox' },
]

const router = useRouter()
const query = ref('')
const open = ref(false)
const activeIndex = ref(0)
const inputEl = ref(null)
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)
const shortcut = isMac ? '⌘K' : 'Ctrl+K'

const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return PAGES.filter((item) => {
    const hay = `${item.label} ${item.group} ${item.keys}`.toLowerCase()
    return hay.includes(q)
  }).slice(0, 8)
})

watch(matches, () => {
  activeIndex.value = 0
})

function move(step) {
  if (!matches.value.length) return
  open.value = true
  activeIndex.value = (activeIndex.value + step + matches.value.length) % matches.value.length
}

function go(item) {
  if (!item) return
  router.push(item.to)
  close()
}

function close() {
  open.value = false
  query.value = ''
  activeIndex.value = 0
}

function onDocClick(e) {
  if (!e.target.closest?.('.admin-nav-search')) close()
}

function onGlobalKey(e) {
  if ((e.key === 'k' || e.key === 'K') && (isMac ? e.metaKey : e.ctrlKey) && !e.altKey) {
    e.preventDefault()
    inputEl.value?.focus()
    open.value = true
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onGlobalKey)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onGlobalKey)
})
</script>
