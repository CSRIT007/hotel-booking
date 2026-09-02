<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Departments & positions</h1>
    <p class="mt-1 text-stone-600">
      These lists feed Employee information, schedules, payroll, and leave. Add or rename departments and positions as the hotel grows.
    </p>

    <form class="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm" @submit.prevent="addDepartment">
      <div class="min-w-[16rem] flex-1">
        <label class="block text-xs font-medium text-stone-700">New department</label>
        <input v-model="newDepartment" type="text" required class="field" placeholder="e.g. Sales" />
      </div>
      <button type="submit" class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving">
        Add department
      </button>
    </form>
    <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
    <p v-if="success" class="mt-3 text-sm text-green-600">{{ success }}</p>

    <div class="mt-6 grid gap-4 md:grid-cols-2">
      <article v-for="dept in org" :key="dept.id" class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <label class="block text-xs font-medium text-stone-500">Department</label>
            <input
              :value="dept.name"
              class="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800"
              @change="renameDepartment(dept, $event.target.value)"
            />
          </div>
          <button type="button" class="mt-6 text-xs text-red-600 hover:underline" @click="removeDepartment(dept)">Delete</button>
        </div>
        <ul class="mt-4 space-y-2">
          <li v-for="pos in dept.positions" :key="pos.id" class="flex items-center gap-2">
            <input
              :value="pos.name"
              class="flex-1 rounded-md border border-stone-300 px-3 py-1.5 text-sm"
              @change="renamePosition(pos, $event.target.value)"
            />
            <button type="button" class="text-xs text-red-600 hover:underline" @click="removePosition(pos)">Remove</button>
          </li>
        </ul>
        <form class="mt-4 flex gap-2" @submit.prevent="addPosition(dept)">
          <input v-model="newPosition[dept.id]" type="text" class="field !mt-0" :placeholder="`Add position in ${dept.name}`" />
          <button type="submit" class="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Add</button>
        </form>
      </article>
    </div>
    <p v-if="org.length === 0" class="mt-6 text-sm text-stone-500">No departments yet. Add one above.</p>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  createHrDepartment,
  createHrPosition,
  deleteHrDepartment,
  deleteHrPosition,
  getHrOrg,
  updateHrDepartment,
  updateHrPosition,
} from '../../services/data'

const org = ref([])
const newDepartment = ref('')
const newPosition = reactive({})
const saving = ref(false)
const error = ref('')
const success = ref('')

async function load() {
  org.value = await getHrOrg()
  org.value.forEach((d) => {
    if (newPosition[d.id] == null) newPosition[d.id] = ''
  })
}

async function addDepartment() {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    await createHrDepartment({ name: newDepartment.value.trim() })
    newDepartment.value = ''
    success.value = 'Department added.'
    await load()
  } catch (e) {
    error.value = e.message
  }
  saving.value = false
}

async function renameDepartment(dept, name) {
  const next = String(name || '').trim()
  if (!next || next === dept.name) return
  error.value = ''
  try {
    await updateHrDepartment(dept.id, { name: next })
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function removeDepartment(dept) {
  if (!window.confirm(`Delete department “${dept.name}”? Positions in it will also be removed.`)) return
  error.value = ''
  try {
    await deleteHrDepartment(dept.id)
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function addPosition(dept) {
  const name = String(newPosition[dept.id] || '').trim()
  if (!name) return
  error.value = ''
  try {
    await createHrPosition(dept.id, { name })
    newPosition[dept.id] = ''
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function renamePosition(pos, name) {
  const next = String(name || '').trim()
  if (!next || next === pos.name) return
  error.value = ''
  try {
    await updateHrPosition(pos.id, { name: next })
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function removePosition(pos) {
  if (!window.confirm(`Remove position “${pos.name}”?`)) return
  error.value = ''
  try {
    await deleteHrPosition(pos.id)
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
