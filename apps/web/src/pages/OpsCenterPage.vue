<template>
  <section style="display: grid; gap: 16px">
    <h2>{{ t('ops.title') }}</h2>
    <p>{{ t('ops.description') }}</p>

    <div style="display: grid; gap: 8px; border: 1px solid #ddd; padding: 12px">
      <h3>{{ t('ops.jobs') }}</h3>
      <button @click="loadJobHealth">{{ t('ops.loadHealth') }}</button>
      <pre>{{ jobHealth }}</pre>
    </div>

    <div style="display: grid; gap: 8px; border: 1px solid #ddd; padding: 12px">
      <h3>{{ t('ops.notifications') }}</h3>
      <div style="display: flex; gap: 8px; flex-wrap: wrap">
        <input v-model="notifyTo" :placeholder="t('ops.to')" />
        <input v-model="notifyTitle" :placeholder="t('ops.notifyTitle')" />
        <input v-model="notifyContent" :placeholder="t('ops.notifyContent')" />
        <button @click="sendNotification">{{ t('ops.send') }}</button>
      </div>
      <pre>{{ notificationResult }}</pre>
    </div>

    <div style="display: grid; gap: 8px; border: 1px solid #ddd; padding: 12px">
      <h3>{{ t('ops.files') }}</h3>
      <div style="display: flex; gap: 8px; flex-wrap: wrap">
        <input v-model="fileName" :placeholder="t('ops.fileName')" />
        <input v-model="fileContent" :placeholder="t('ops.fileContent')" />
        <button @click="uploadFile">{{ t('ops.upload') }}</button>
        <button @click="loadFiles">{{ t('ops.refreshList') }}</button>
      </div>
      <pre>{{ filesResult }}</pre>
    </div>

    <div style="display: grid; gap: 8px; border: 1px solid #ddd; padding: 12px">
      <h3>{{ t('ops.audit') }}</h3>
      <button @click="loadAudit">{{ t('ops.loadAudit') }}</button>
      <pre>{{ auditResult }}</pre>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3010';
const auth = useAuthStore();
const { t } = useI18n();

const notifyTo = ref('owner@example.com');
const notifyTitle = ref(t('ops.defaultNotifyTitle'));
const notifyContent = ref(t('ops.defaultNotifyContent'));
const fileName = ref(t('ops.defaultFileName'));
const fileContent = ref(t('ops.defaultFileContent'));

const jobHealth = ref(t('app.na'));
const notificationResult = ref(t('app.na'));
const filesResult = ref(t('app.na'));
const auditResult = ref(t('app.na'));

function getHeaders(withJson = false) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.accessToken ?? ''}`,
    'x-tenant-id': auth.profile?.tenantId ?? 't1',
  };

  if (withJson) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

async function loadJobHealth() {
  const resp = await fetch(`${API_BASE}/jobs/health`, {
    headers: getHeaders(),
  });
  jobHealth.value = JSON.stringify(await resp.json(), null, 2);
}

async function sendNotification() {
  const resp = await fetch(`${API_BASE}/notifications/send`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({
      channel: 'email',
      to: notifyTo.value,
      title: notifyTitle.value,
      content: notifyContent.value,
    }),
  });

  notificationResult.value = JSON.stringify(await resp.json(), null, 2);
}

async function uploadFile() {
  const resp = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({
      fileName: fileName.value,
      content: fileContent.value,
      contentType: 'text/plain',
    }),
  });

  filesResult.value = JSON.stringify(await resp.json(), null, 2);
}

async function loadFiles() {
  const resp = await fetch(`${API_BASE}/files/list`, {
    headers: getHeaders(),
  });

  filesResult.value = JSON.stringify(await resp.json(), null, 2);
}

async function loadAudit() {
  const resp = await fetch(`${API_BASE}/audit/entries`, {
    headers: getHeaders(),
  });

  auditResult.value = JSON.stringify(await resp.json(), null, 2);
}
</script>
