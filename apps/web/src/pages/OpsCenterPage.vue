<template>
  <section style="display: grid; gap: 16px">
    <h2>Ops Center</h2>
    <p>Notification / File / Job / Audit unified management page.</p>

    <div style="display: grid; gap: 8px; border: 1px solid #ddd; padding: 12px">
      <h3>Jobs</h3>
      <button @click="loadJobHealth">Load Job Health</button>
      <pre>{{ jobHealth }}</pre>
    </div>

    <div style="display: grid; gap: 8px; border: 1px solid #ddd; padding: 12px">
      <h3>Notifications</h3>
      <div style="display: flex; gap: 8px; flex-wrap: wrap">
        <input v-model="notifyTo" placeholder="to" />
        <input v-model="notifyTitle" placeholder="title" />
        <input v-model="notifyContent" placeholder="content" />
        <button @click="sendNotification">Send</button>
      </div>
      <pre>{{ notificationResult }}</pre>
    </div>

    <div style="display: grid; gap: 8px; border: 1px solid #ddd; padding: 12px">
      <h3>Files</h3>
      <div style="display: flex; gap: 8px; flex-wrap: wrap">
        <input v-model="fileName" placeholder="fileName" />
        <input v-model="fileContent" placeholder="content" />
        <button @click="uploadFile">Upload</button>
        <button @click="loadFiles">Refresh List</button>
      </div>
      <pre>{{ filesResult }}</pre>
    </div>

    <div style="display: grid; gap: 8px; border: 1px solid #ddd; padding: 12px">
      <h3>Audit</h3>
      <button @click="loadAudit">Load Audit Entries</button>
      <pre>{{ auditResult }}</pre>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3010';
const auth = useAuthStore();

const notifyTo = ref('owner@example.com');
const notifyTitle = ref('Hello');
const notifyContent = ref('Welcome');
const fileName = ref('readme.txt');
const fileContent = ref('hello template');

const jobHealth = ref('-');
const notificationResult = ref('-');
const filesResult = ref('-');
const auditResult = ref('-');

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
