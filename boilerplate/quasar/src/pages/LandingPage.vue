<template>
  <div class="q-pa-md">
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h5" data-testid="landing-welcome-heading">
        Welcome, {{ auth.user || 'Guest' }}
      </div>
      <q-btn
        color="negative"
        label="Logout"
        @click="handleLogout"
        data-testid="landing-logout-button"
      />
    </div>

    <div class="text-subtitle1 q-mb-md">Menu Items</div>
    <div data-testid="landing-menu-list">
      <q-btn v-for="item in menuItems" :key="item" class="q-mr-sm q-mb-sm" outline color="primary">
        {{ item }}
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const menuItems = ['Dashboard', 'Profile', 'Settings', 'Reports', 'Help']

async function handleLogout() {
  await auth.logout()
  router.push('/')
}
</script>
