import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { registerPermissionDirective } from './directives/permission';
import { initWebSentry } from './observability/sentry';
import router from './router';

const app = createApp(App);
app.use(createPinia());
app.use(router);
initWebSentry(app, router);
registerPermissionDirective(app);
app.mount('#app');
