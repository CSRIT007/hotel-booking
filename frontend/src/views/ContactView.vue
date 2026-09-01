<template>
  <div>
    <PageHero title="Contact us" subtitle="Tell us about your stay. We usually reply within one working day." image="/images/image_3.jpg">
      <template #crumbs>
        <router-link to="/" class="hover:text-white">Home</router-link>
        <span class="mx-2 text-white/40">/</span>
        Contact
      </template>
    </PageHero>

    <section class="py-16">
      <div class="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div class="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
          <h2 class="font-display text-xl font-semibold text-stone-800">Visit or write</h2>
          <p class="mt-3 text-stone-600">Phnom Penh, Cambodia</p>
          <p class="text-stone-600">noreply@smilerental.com</p>
          <p class="mt-6 text-sm leading-relaxed text-stone-500">
            For booking questions, include your preferred dates. Staff will confirm availability from the dashboard.
          </p>
        </div>
        <form class="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200 space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium text-stone-700">Name</label>
            <input v-model="form.name" type="text" required class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700">Email</label>
            <input v-model="form.email" type="email" required class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700">Subject</label>
            <input v-model="form.subject" type="text" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700">Message</label>
            <textarea v-model="form.message" rows="5" required class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
          <p v-if="success" class="text-sm text-green-600">{{ success }}</p>
          <button type="submit" :disabled="loading" class="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
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
import PageHero from '../components/PageHero.vue'

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
