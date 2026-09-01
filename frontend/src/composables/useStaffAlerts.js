import { computed, onUnmounted, ref, watch } from 'vue'
import { getStaffAlerts } from '../services/data'
import { useAuth } from './useAuth'

const alerts = ref({
  new_messages: 0,
  pending_bookings: 0,
  latest_message: null,
})
const toast = ref('')
let timer = null
let subscribers = 0
let lastMessageCount = null

async function refresh() {
  try {
    const next = await getStaffAlerts()
    const count = Number(next.new_messages || 0)
    if (lastMessageCount != null && count > lastMessageCount) {
      const from = next.latest_message?.name
      toast.value = from ? `New message from ${from}` : 'New guest message'
      setTimeout(() => {
        if (toast.value.startsWith('New')) toast.value = ''
      }, 8000)
    }
    lastMessageCount = count
    alerts.value = {
      new_messages: count,
      pending_bookings: Number(next.pending_bookings || 0),
      latest_message: next.latest_message || null,
    }
  } catch {
    /* keep last known counts */
  }
}

function startPolling() {
  subscribers += 1
  if (subscribers === 1) {
    refresh()
    timer = setInterval(refresh, 10000)
  }
}

function stopPolling() {
  subscribers = Math.max(0, subscribers - 1)
  if (subscribers === 0 && timer) {
    clearInterval(timer)
    timer = null
  }
}

export function useStaffAlerts() {
  const { isStaff } = useAuth()
  const newMessages = computed(() => alerts.value.new_messages)
  const pendingBookings = computed(() => alerts.value.pending_bookings)
  const latestMessage = computed(() => alerts.value.latest_message)

  watch(
    isStaff,
    (on, was) => {
      if (on && !was) startPolling()
      if (!on && was) stopPolling()
    },
    { immediate: true }
  )
  onUnmounted(() => {
    if (isStaff.value) stopPolling()
  })

  return {
    alerts,
    newMessages,
    pendingBookings,
    latestMessage,
    toast,
    refresh,
    dismissToast: () => { toast.value = '' },
  }
}
