<template>
  <section>
    <h2>{{ t('login.title') }}</h2>
    <form @submit.prevent="submit" style="display: grid; gap: 8px; max-width: 360px">
      <input v-model="email" :placeholder="t('login.email')" />
      <input v-model="password" type="password" :placeholder="t('login.password')" />
      <input v-model="tenantId" :placeholder="t('login.tenantId')" />
      <button type="submit">{{ t('login.signIn') }}</button>
      <p v-if="error" style="color: #b00020">{{ error }}</p>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();

const email = ref('owner@example.com');
const password = ref('pass123');
const tenantId = ref('t1');
const error = ref('');

async function submit() {
  error.value = '';

  try {
    await auth.login({
      email: email.value,
      password: password.value,
      tenantId: tenantId.value,
    });
    await router.push('/');
  } catch {
    error.value = t('login.failed');
  }
}
</script>
