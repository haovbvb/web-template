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
      <RouterLink to="/">{{ t('app.home') }}</RouterLink>
      <RouterLink to="/admin">{{ t('app.admin') }}</RouterLink>
      <RouterLink to="/ops">{{ t('app.ops') }}</RouterLink>
      <RouterLink to="/login">{{ t('app.login') }}</RouterLink>
      <button v-if="auth.isAuthed" @click="logout">{{ t('app.logout') }}</button>
      <span>{{ t('app.language') }}:</span>
      <button @click="switchLocale('zh-CN')">{{ t('app.chinese') }}</button>
      <button @click="switchLocale('en-US')">{{ t('app.english') }}</button>
    </nav>
    <p>{{ t('app.permissions') }}: {{ auth.permissions.join(', ') || t('app.na') }}</p>
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { setAppLocale, type AppLocale } from './i18n';
import { useAuthStore } from './stores/auth';

const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();
const brandName = import.meta.env.VITE_BRAND_NAME ?? 'Enterprise Fullstack Template';
const brandPrimary = import.meta.env.VITE_BRAND_PRIMARY ?? '#1f6feb';

function logout() {
  auth.logout();
  void router.push('/login');
}

function switchLocale(locale: AppLocale) {
  setAppLocale(locale);
}
</script>
