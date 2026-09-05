<template>
  <div>
    <PageHero title="Contact us" subtitle="Write to the desk, call during house hours, or send a booking question. We usually reply within one working day." image="/images/image_3.jpg">
      <template #crumbs>
        <router-link to="/" class="hover:text-white">Home</router-link>
        <span class="mx-2 text-white/40">/</span>
        Contact
      </template>
    </PageHero>

    <section class="py-16">
      <div class="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div class="space-y-6">
          <div class="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
            <h2 class="font-display text-xl font-semibold text-stone-800">Visit or write</h2>
            <p class="mt-3 leading-relaxed text-stone-600">
              Smile Hotel<br />
              Head office: Sangkat Tul Kok, Khan Tul Kok<br />
              Phnom Penh, Cambodia
            </p>
            <dl class="mt-6 space-y-3 text-sm">
              <div class="flex justify-between gap-4 border-b border-stone-100 pb-3">
                <dt class="text-stone-500">Email</dt>
                <dd>
                  <a href="mailto:noreply@smilerental.com" class="font-medium text-brand-700 hover:underline">noreply@smilerental.com</a>
                </dd>
              </div>
              <div class="flex justify-between gap-4 border-b border-stone-100 pb-3">
                <dt class="text-stone-500">Front desk</dt>
                <dd>
                  <a href="tel:+85598944686" class="font-medium text-brand-700 hover:underline">+855 98 944 686</a>
                </dd>
              </div>
              <div class="flex justify-between gap-4 border-b border-stone-100 pb-3">
                <dt class="text-stone-500">House hours</dt>
                <dd class="font-medium text-stone-800">Daily, 7:00 am – 10:00 pm</dd>
              </div>
              <div class="flex justify-between gap-4 border-b border-stone-100 pb-3">
                <dt class="text-stone-500">Check-in</dt>
                <dd class="font-medium text-stone-800">From 2:00 pm</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-stone-500">Check-out</dt>
                <dd class="font-medium text-stone-800">Until 12:00 pm</dd>
              </div>
            </dl>
            <p class="mt-6 text-sm leading-relaxed text-stone-500">
              For booking questions, include your preferred dates, number of guests, and room type if you have one. Staff confirm availability from the dashboard and reply to the email you leave here.
            </p>
          </div>

          <div class="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
            <h3 class="font-display text-lg font-semibold text-stone-800">Who can help</h3>
            <ul class="mt-4 space-y-3 text-sm text-stone-600">
              <li><span class="font-medium text-stone-800">Reservations</span> — new stays, date changes, and cancellations</li>
              <li><span class="font-medium text-stone-800">Front desk</span> — arrival time, late check-in, and directions</li>
              <li><span class="font-medium text-stone-800">Housekeeping</span> — extra linen, stay-over clean, or a room note</li>
              <li><span class="font-medium text-stone-800">Maintenance</span> — something in the room that needs repair</li>
            </ul>
          </div>
        </div>

        <form class="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200 space-y-4 h-fit" @submit.prevent="handleSubmit">
          <h2 class="font-display text-xl font-semibold text-stone-800">Send a message</h2>
          <p class="text-sm text-stone-500">Messages appear in the staff inbox. Use the subject so we can route it quickly.</p>
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
            <select v-model="form.subject" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option value="">________Selection________</option>
              <option>New booking</option>
              <option>Change dates</option>
              <option>Arrival time</option>
              <option>Room question</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700">Message</label>
            <textarea v-model="form.message" rows="6" required class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="Dates, guests, and anything we should prepare." />
          </div>
          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
          <p v-if="success" class="text-sm text-green-600">{{ success }}</p>
          <button type="submit" :disabled="loading" class="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {{ loading ? 'Sending…' : 'Send message' }}
          </button>
        </form>
      </div>
    </section>

    <section class="border-t border-stone-200 bg-white py-16">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-medium uppercase tracking-widest text-brand-600">Before you write</p>
          <h2 class="mt-2 font-display text-3xl font-semibold text-stone-800">Useful details to include</h2>
        </div>
        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article v-for="tip in tips" :key="tip.title" class="rounded-3xl border border-stone-200 bg-warm-50 p-6">
            <h3 class="font-display text-lg font-semibold text-stone-800">{{ tip.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-stone-600">{{ tip.text }}</p>
          </article>
        </div>
        <p class="mt-10 text-center text-sm text-stone-500">
          You can also
          <router-link to="/rooms" class="font-medium text-brand-700 hover:underline">browse rooms</router-link>
          and book online if the dates are already open.
        </p>
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

const tips = [
  {
    title: 'Dates',
    text: 'Write check-in and check-out. If dates can move by a day, say so — it helps when a room is already held.',
  },
  {
    title: 'Guests',
    text: 'How many adults and children, and whether you need one bed or two. Room limits are listed on each room page.',
  },
  {
    title: 'Arrival',
    text: 'Tell us if you land late. The desk can hold the room and note a late key collection.',
  },
]

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
