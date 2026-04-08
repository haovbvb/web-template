<template>
  <section>
    <h2>{{ t('admin.title') }}</h2>
    <p>{{ t('admin.description') }}</p>
    <button v-permission="'org:manage'">{{ t('admin.action') }}</button>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
