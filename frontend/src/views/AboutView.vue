<template>
  <div>
    <PageHero title="About us" subtitle="Hospitality in Phnom Penh — comfortable rooms and a team that looks after every stay." image="/images/image_4.jpg">
      <template #crumbs>
        <router-link to="/" class="hover:text-white">Home</router-link>
        <span class="mx-2 text-white/40">/</span>
        About
      </template>
    </PageHero>

    <section class="py-16">
      <div class="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div
          class="h-80 rounded-3xl bg-stone-200 bg-cover bg-center shadow-sm"
          style="background-image: url('/images/image_5.jpg')"
        />
        <div>
          <p class="text-sm font-medium uppercase tracking-widest text-brand-600">Our story</p>
          <h2 class="mt-2 font-display text-3xl font-semibold text-stone-800">Welcome to Smile Hotel</h2>
          <p class="mt-4 text-lg leading-relaxed text-stone-600">
            Smile Hotel is a small city hotel in Phnom Penh. We opened so visitors could book a clean room online, arrive with a confirmed stay, and rest without fuss.
          </p>
          <p class="mt-4 leading-relaxed text-stone-600">
            Whether you are here for meetings, a family visit, or a few days in the capital, the front desk, housekeeping, and maintenance teams work from one system so your room is ready when you are.
          </p>
          <p class="mt-4 leading-relaxed text-stone-600">
            We keep the property boutique on purpose: fewer rooms, faster replies, and staff who know the house rather than a large chain script.
          </p>
        </div>
      </div>
    </section>

    <section class="border-y border-stone-200 bg-white py-16">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-medium uppercase tracking-widest text-brand-600">What we stand for</p>
          <h2 class="mt-2 font-display text-3xl font-semibold text-stone-800">How we look after a stay</h2>
        </div>
        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <article v-for="item in values" :key="item.title" class="rounded-3xl border border-stone-200 bg-warm-50 p-6">
            <h3 class="font-display text-lg font-semibold text-stone-800">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-stone-600">{{ item.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="py-16">
      <div class="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-start">
        <div>
          <p class="text-sm font-medium uppercase tracking-widest text-brand-600">Phnom Penh</p>
          <h2 class="mt-2 font-display text-3xl font-semibold text-stone-800">A calm base in the city</h2>
          <p class="mt-4 leading-relaxed text-stone-600">
            The hotel sits in the capital, close to everyday life: markets, riverside walks, offices, and evening food. Rooms are set up for rest after a long day — quiet enough to sleep, practical enough for work.
          </p>
          <ul class="mt-6 space-y-3 text-stone-600">
            <li>Easy online booking with live room dates and prices</li>
            <li>Front desk for arrivals, late check-in, and local tips</li>
            <li>Housekeeping after checkout and stay-over cleans on request</li>
            <li>On-site repairs so a room is not sold while it is out of order</li>
          </ul>
        </div>
        <div class="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <h3 class="font-display text-xl font-semibold text-stone-800">Good to know</h3>
          <dl class="mt-6 space-y-4 text-sm">
            <div class="flex justify-between gap-4 border-b border-stone-100 pb-3">
              <dt class="text-stone-500">City</dt>
              <dd class="text-right font-medium text-stone-800">Sangkat Tul Kok, Khan Tul Kok, Phnom Penh</dd>
            </div>
            <div class="flex justify-between gap-4 border-b border-stone-100 pb-3">
              <dt class="text-stone-500">Check-in</dt>
              <dd class="font-medium text-stone-800">From 2:00 pm</dd>
            </div>
            <div class="flex justify-between gap-4 border-b border-stone-100 pb-3">
              <dt class="text-stone-500">Check-out</dt>
              <dd class="font-medium text-stone-800">Until 12:00 pm</dd>
            </div>
            <div class="flex justify-between gap-4 border-b border-stone-100 pb-3">
              <dt class="text-stone-500">Guests</dt>
              <dd class="font-medium text-stone-800">Business, leisure, and families</dd>
            </div>
            <div class="flex justify-between gap-4 border-b border-stone-100 pb-3">
              <dt class="text-stone-500">Phone</dt>
              <dd class="font-medium text-stone-800">+855 98 944 686</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-stone-500">Email</dt>
              <dd class="font-medium text-stone-800">noreply@smilerental.com</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <section class="border-t border-stone-200 bg-white py-16">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-medium uppercase tracking-widest text-brand-600">The house</p>
          <h2 class="mt-2 font-display text-3xl font-semibold text-stone-800">What you can expect</h2>
        </div>
        <div class="mt-12 grid gap-8 md:grid-cols-3">
          <article v-for="block in house" :key="block.title" class="rounded-3xl border border-stone-200 p-6">
            <h3 class="font-display text-lg font-semibold text-stone-800">{{ block.title }}</h3>
            <p class="mt-3 text-sm leading-relaxed text-stone-600">{{ block.text }}</p>
          </article>
        </div>
        <div class="mt-12 flex flex-wrap justify-center gap-3">
          <router-link to="/rooms" class="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
            Browse rooms
          </router-link>
          <router-link to="/contact" class="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50">
            Contact us
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import PageHero from '../components/PageHero.vue'

const values = [
  {
    title: 'Warm service',
    text: 'Staff greet you by name when we can, answer quickly, and treat every booking as a real arrival, not a queue number.',
  },
  {
    title: 'Clean rooms',
    text: 'Housekeeping turns a room after checkout. We do not put it back on sale until it is cleaned and checked.',
  },
  {
    title: 'Fair rates',
    text: 'The price you see when you book is the nightly rate for those dates. No surprise extras at the desk for a standard stay.',
  },
  {
    title: 'Looked-after house',
    text: 'If a tap leaks or an air-con fails, maintenance takes the room off sale until the work is done.',
  },
]

const house = [
  {
    title: 'Rooms',
    text: 'Each room lists guests, size, view, and beds so you can choose before you pay. Photos on the room page match what you will find.',
  },
  {
    title: 'Dining and extras',
    text: 'Ask the desk about breakfast hours and nearby meals. In-house extras such as drinks or simple items can be added during your stay.',
  },
  {
    title: 'Returning guests',
    text: 'Completed stays earn loyalty points. Regular visitors move up in tier so we can thank people who come back.',
  },
]
</script>
