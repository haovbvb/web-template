<template>
  <section>
    <h2>Home</h2>
    <p>Authenticated: {{ auth.isAuthed ? 'yes' : 'no' }}</p>
    <p>Tenant: {{ auth.profile?.tenantId ?? '-' }}</p>
    <p>Roles: {{ (auth.profile?.roles ?? []).join(', ') || '-' }}</p>
    <p>Edition: {{ capabilities.edition }}</p>
    <p>Feature(openPlatform): {{ capabilities.features.openPlatform ? 'on' : 'off' }}</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3010';

const capabilities = reactive({
  edition: 'community',
  features: {
    openPlatform: false,
  },
});

onMounted(async () => {
  try {
    const response = await fetch(`${API_BASE}/platform/capabilities`);
    if (response.ok) {
      const payload = await response.json();
      capabilities.edition = payload.edition ?? 'community';
      capabilities.features.openPlatform = Boolean(payload.features?.openPlatform);
    }
  } catch {
    // noop for homepage fallback
  }
});
</script>
