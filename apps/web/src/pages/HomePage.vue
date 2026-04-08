<template>
  <section>
    <h2>{{ t('home.title') }}</h2>
    <p>{{ t('home.authenticated') }}: {{ auth.isAuthed ? t('home.yes') : t('home.no') }}</p>
    <p>{{ t('home.tenant') }}: {{ auth.profile?.tenantId ?? t('app.na') }}</p>
    <p>{{ t('home.roles') }}: {{ (auth.profile?.roles ?? []).join(', ') || t('app.na') }}</p>
    <p>{{ t('home.edition') }}: {{ capabilities.edition }}</p>
    <p>
      {{ t('home.featureOpenPlatform') }}:
      {{ capabilities.features.openPlatform ? t('home.on') : t('home.off') }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const { t } = useI18n();
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
