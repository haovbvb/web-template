<template>
  <section>
    <h2>{{ t('forbidden.title') }}</h2>
    <p>{{ t('forbidden.description') }}</p>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
