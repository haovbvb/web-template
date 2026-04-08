import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { registerPermissionDirective } from './directives/permission';
import { i18n } from './i18n';
import { initWebSentry } from './observability/sentry';
import router from './router';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(i18n);
initWebSentry(app, router);
registerPermissionDirective(app);
app.mount('#app');
