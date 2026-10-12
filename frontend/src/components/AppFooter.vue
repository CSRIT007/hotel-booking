<template>
  <footer class="border-t border-stone-200 bg-stone-900 py-14 text-stone-300">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 class="text-white">
            <BrandLogo mark-class="h-24 w-24" />
          </h3>
          <p class="mt-3 max-w-sm text-sm leading-relaxed text-stone-400">
            Comfortable rooms and warm hospitality in Phnom Penh.
          </p>
          <p class="mt-4 text-sm text-stone-500">
            Check-in from 2:00 pm · Check-out until 12:00 pm
          </p>
        </div>
        <div>
          <h4 class="text-sm font-semibold uppercase tracking-wider text-white">Explore</h4>
          <ul class="mt-3 space-y-2 text-sm">
            <li><router-link to="/" class="hover:text-white">Home</router-link></li>
            <li><router-link to="/rooms" class="hover:text-white">Rooms</router-link></li>
            <li><router-link to="/services" class="hover:text-white">Services</router-link></li>
            <li><router-link to="/about" class="hover:text-white">About</router-link></li>
            <li><router-link to="/contact" class="hover:text-white">Contact</router-link></li>
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-semibold uppercase tracking-wider text-white">Policies</h4>
          <ul class="mt-3 space-y-2 text-sm">
            <li v-for="link in policyLinks" :key="link.id">
              <router-link :to="link.to" class="hover:text-white">{{ link.label }}</router-link>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-semibold uppercase tracking-wider text-white">Contact</h4>
          <p class="mt-3 text-sm">Sangkat Tul Kok, Khan Tul Kok, Phnom Penh</p>
          <p class="mt-2 text-sm">
            <a href="tel:+85598944686" class="hover:text-white">+855 98 944 686</a>
          </p>
          <p class="text-sm">
            <a href="mailto:noreply@smilerental.com" class="hover:text-white">noreply@smilerental.com</a>
          </p>
          <p class="mt-2 text-sm text-stone-500">Desk daily, 7:00 am – 10:00 pm</p>
        </div>
      </div>
      <div class="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-stone-500 sm:flex-row">
        <p>© {{ new Date().getFullYear() }} Smile Hotel MS. All rights reserved.</p>
        <p>
          <router-link :to="{ name: 'Policies' }" class="hover:text-stone-300">Policies</router-link>
          <span class="mx-2 text-stone-600">·</span>
          <router-link :to="{ name: 'Policies', hash: '#privacy' }" class="hover:text-stone-300">Privacy</router-link>
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { policyLinks } from '../constants/policies'
import BrandLogo from './BrandLogo.vue'
</script>
