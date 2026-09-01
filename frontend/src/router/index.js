import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'Home', component: () => import('../views/HomeView.vue'), meta: { title: 'Home' } },
    { path: '/rooms', name: 'Rooms', component: () => import('../views/RoomsView.vue'), meta: { title: 'Rooms' } },
    { path: '/rooms/:id', name: 'RoomDetail', component: () => import('../views/RoomDetailView.vue'), meta: { title: 'Room' } },
    { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue'), meta: { title: 'Login', guestOnly: true } },
    { path: '/register', name: 'Register', component: () => import('../views/RegisterView.vue'), meta: { title: 'Register', guestOnly: true } },
    { path: '/contact', name: 'Contact', component: () => import('../views/ContactView.vue'), meta: { title: 'Contact' } },
    { path: '/about', name: 'About', component: () => import('../views/AboutView.vue'), meta: { title: 'About' } },
    { path: '/services', name: 'Services', component: () => import('../views/ServicesView.vue'), meta: { title: 'Services' } },
    { path: '/my-bookings', name: 'MyBookings', component: () => import('../views/MyBookingsView.vue'), meta: { title: 'My bookings', requiresAuth: true } },
    { path: '/admin/login', name: 'AdminLogin', component: () => import('../views/AdminLoginView.vue'), meta: { title: 'Admin Login' } },
    {
      path: '/admin',
      component: () => import('../layouts/AdminLayout.vue'),
      meta: { requiresStaff: true, title: 'Admin' },
      children: [
        { path: '', name: 'AdminDashboard', component: () => import('../views/admin/AdminDashboardView.vue'), meta: { title: 'Dashboard' } },
        { path: 'rooms', name: 'AdminRooms', component: () => import('../views/admin/AdminRoomsView.vue'), meta: { title: 'Rooms' } },
        { path: 'bookings', name: 'AdminBookings', component: () => import('../views/admin/AdminBookingsView.vue'), meta: { title: 'Bookings' } },
        { path: 'guests', name: 'AdminGuests', component: () => import('../views/admin/AdminGuestsView.vue'), meta: { title: 'Guests' } },
        { path: 'contacts', name: 'AdminContacts', component: () => import('../views/admin/AdminContactsView.vue'), meta: { title: 'Messages' } },
        { path: 'housekeeping', name: 'AdminHousekeeping', component: () => import('../views/admin/AdminPlaceholder.vue'), meta: { title: 'Housekeeping' } },
        { path: 'pos-sales', name: 'AdminPosSales', component: () => import('../views/admin/AdminPosSalesView.vue'), meta: { title: 'POS Sales' } },
        { path: 'pos-products', name: 'AdminPosProducts', component: () => import('../views/admin/AdminPosProductsView.vue'), meta: { title: 'POS Products' } },
        { path: 'pos-transactions', name: 'AdminPosTransactions', component: () => import('../views/admin/AdminPosTransactionsView.vue'), meta: { title: 'POS Transactions' } },
        { path: 'crs-rates', name: 'AdminCrsRates', component: () => import('../views/admin/AdminPlaceholder.vue'), meta: { title: 'CRS Rates' } },
        { path: 'crs-channels', name: 'AdminCrsChannels', component: () => import('../views/admin/AdminPlaceholder.vue'), meta: { title: 'CRS Channels' } },
        { path: 'crs-availability', name: 'AdminCrsAvailability', component: () => import('../views/admin/AdminPlaceholder.vue'), meta: { title: 'CRS Availability' } },
        { path: 'crm-campaigns', name: 'AdminCrmCampaigns', component: () => import('../views/admin/AdminPlaceholder.vue'), meta: { title: 'CRM Campaigns' } },
        { path: 'crm-loyalty', name: 'AdminCrmLoyalty', component: () => import('../views/admin/AdminPlaceholder.vue'), meta: { title: 'CRM Loyalty' } },
        { path: 'crm-communications', name: 'AdminCrmCommunications', component: () => import('../views/admin/AdminPlaceholder.vue'), meta: { title: 'CRM Communications' } },
        { path: 'finance-revenue', name: 'AdminFinanceRevenue', component: () => import('../views/admin/AdminFinanceRevenueView.vue'), meta: { title: 'Revenue' } },
        { path: 'finance-expense', name: 'AdminFinanceExpense', component: () => import('../views/admin/AdminFinanceExpenseView.vue'), meta: { title: 'Expenses' } },
        { path: 'finance-profit', name: 'AdminFinanceProfit', component: () => import('../views/admin/AdminFinanceProfitView.vue'), meta: { title: 'Profit' } },
        { path: 'hr-employees', name: 'AdminHrEmployees', component: () => import('../views/admin/AdminPlaceholder.vue'), meta: { title: 'Employees' } },
        { path: 'hr-schedules', name: 'AdminHrSchedules', component: () => import('../views/admin/AdminPlaceholder.vue'), meta: { title: 'Schedules' } },
        { path: 'hr-payroll', name: 'AdminHrPayroll', component: () => import('../views/admin/AdminPlaceholder.vue'), meta: { title: 'Payroll' } },
        { path: 'hr-leaves', name: 'AdminHrLeaves', component: () => import('../views/admin/AdminPlaceholder.vue'), meta: { title: 'Leaves' } },
        { path: 'maintenance-requests', name: 'AdminMaintenanceRequests', component: () => import('../views/admin/AdminPlaceholder.vue'), meta: { title: 'Maintenance Requests' } },
        { path: 'maintenance-schedule', name: 'AdminMaintenanceSchedule', component: () => import('../views/admin/AdminPlaceholder.vue'), meta: { title: 'Maintenance Schedule' } },
        { path: 'maintenance-inventory', name: 'AdminMaintenanceInventory', component: () => import('../views/admin/AdminPlaceholder.vue'), meta: { title: 'Maintenance Inventory' } },
        { path: 'reports', name: 'AdminReports', component: () => import('../views/admin/AdminReportsView.vue'), meta: { title: 'Reports' } },
        { path: 'analytics-kpi', name: 'AdminAnalyticsKpi', component: () => import('../views/admin/AdminPlaceholder.vue'), meta: { title: 'KPIs' } },
      ],
    },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFoundView.vue'), meta: { title: 'Not found' } },
  ],
})

router.beforeEach((to, _from, next) => {
  const title = to.meta.title ?? (to.matched[to.matched.length - 1]?.meta?.title)
  document.title = title ? `${title} — Smile Hotel` : 'Smile Hotel'
  const { isLoggedIn, isStaff } = useAuth()
  if (to.meta.guestOnly && isLoggedIn.value) {
    next({ name: 'Home' })
    return
  }
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  if (to.meta.requiresStaff) {
    if (!isLoggedIn.value) {
      next({ name: 'AdminLogin', query: { redirect: to.fullPath } })
      return
    }
    if (!isStaff.value) {
      next({ name: 'Home' })
      return
    }
  }
  next()
})

export default router
