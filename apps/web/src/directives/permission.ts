import type { App, DirectiveBinding } from 'vue';
import { useAuthStore } from '../stores/auth';

function applyPermission(el: HTMLElement, permission: string | undefined) {
  if (!permission) {
    return;
  }

  const auth = useAuthStore();
  if (!auth.hasPermission(permission)) {
    el.style.display = 'none';
  } else {
    el.style.display = '';
  }
}

export function registerPermissionDirective(app: App) {
  app.directive('permission', {
    mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
      applyPermission(el, binding.value);
    },
    updated(el: HTMLElement, binding: DirectiveBinding<string>) {
      applyPermission(el, binding.value);
    },
  });
}
