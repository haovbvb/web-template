<template>
  <section>
    <h2>Login</h2>
    <form @submit.prevent="submit" style="display: grid; gap: 8px; max-width: 360px">
      <input v-model="email" placeholder="email" />
      <input v-model="password" type="password" placeholder="password" />
      <input v-model="tenantId" placeholder="tenantId" />
      <button type="submit">Sign In</button>
      <p v-if="error" style="color: #b00020">{{ error }}</p>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

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
    error.value = 'Login failed';
  }
}
</script>
