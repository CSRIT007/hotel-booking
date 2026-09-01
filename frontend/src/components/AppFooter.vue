<template>
  <footer class="border-t border-stone-200 bg-stone-100 py-12 dark:border-stone-800 dark:bg-stone-900">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 class="font-display text-lg font-semibold text-brand-800">Smile Hotel</h3>
          <p class="mt-2 text-sm text-stone-600">
            Comfort and hospitality in the heart of the city.
          </p>
        </div>
        <div>
          <h4 class="font-medium text-stone-800">Quick links</h4>
          <ul class="mt-2 space-y-1 text-sm text-stone-600">
            <li><router-link to="/rooms" class="hover:text-brand-600">Rooms</router-link></li>
            <li><router-link to="/services" class="hover:text-brand-600">Services</router-link></li>
            <li><router-link to="/about" class="hover:text-brand-600">About</router-link></li>
            <li><router-link to="/contact" class="hover:text-brand-600">Contact</router-link></li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-stone-800">Contact</h4>
          <p class="mt-2 text-sm text-stone-600">Phnom Penh, Cambodia</p>
          <p class="text-sm text-stone-600">noreply@smilerental.com</p>
        </div>
      </div>
      <p class="mt-8 border-t border-stone-200 pt-8 text-center text-sm text-stone-500">
        © {{ new Date().getFullYear() }} Smile Hotel. All rights reserved.
      </p>
    </div>
  </footer>
</template>
