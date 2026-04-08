<template>
  <main
    :style="{
      fontFamily: 'sans-serif',
      padding: '24px',
      display: 'grid',
      gap: '12px',
      borderTop: `4px solid ${brandPrimary}`,
    }"
  >
    <h1 :style="{ color: brandPrimary }">{{ brandName }}</h1>
    <nav style="display: flex; gap: 12px; flex-wrap: wrap">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/admin">Admin</RouterLink>
      <RouterLink to="/ops">Ops</RouterLink>
      <RouterLink to="/login">Login</RouterLink>
      <button v-if="auth.isAuthed" @click="logout">Logout</button>
    </nav>
    <p>Permissions: {{ auth.permissions.join(', ') || '-' }}</p>
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';

const router = useRouter();
const auth = useAuthStore();
const brandName = import.meta.env.VITE_BRAND_NAME ?? 'Enterprise Fullstack Template';
const brandPrimary = import.meta.env.VITE_BRAND_PRIMARY ?? '#1f6feb';

function logout() {
  auth.logout();
  void router.push('/login');
}
</script>
