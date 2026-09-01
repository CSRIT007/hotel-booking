<template>
  <div>
    <section class="bg-stone-800 py-12">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <p class="text-brand-300 text-sm">
          <router-link to="/" class="hover:text-brand-200">Home</router-link>
          <span class="mx-2">/</span>
          Contact
        </p>
        <h1 class="mt-2 font-display text-3xl font-bold text-white">Contact us</h1>
      </div>
    </section>

    <section class="py-12">
      <div class="mx-auto max-w-2xl px-4 sm:px-6">
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium text-stone-700">Name</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700">Email</label>
            <input
              v-model="form.email"
              type="email"
              required
              class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700">Subject</label>
            <input
              v-model="form.subject"
              type="text"
              class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700">Message</label>
            <textarea
              v-model="form.message"
              rows="5"
              required
              class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
          <p v-if="success" class="text-sm text-green-600">{{ success }}</p>
          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {{ loading ? 'Sending…' : 'Send message' }}
          </button>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { createContact } from '../services/data'

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})
const error = ref('')
const success = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    await createContact(form)
    success.value = 'Message sent. We will get back to you soon.'
    form.name = ''
    form.email = ''
    form.subject = ''
    form.message = ''
  } catch (e) {
    error.value = e.message || 'Failed to send message.'
  }
  loading.value = false
}
</script>
