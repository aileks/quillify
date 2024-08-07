// TODO: Migrate to TypeScript
import './bootstrap';
import '../css/app.css';

import { createApp, h } from 'vue';
import { createInertiaApp, Head, Link } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import Layout from '@/Layouts/Layout.vue';
import { darkMode } from './stores/darkMode';

const appName = 'Quillify';

document.documentElement.classList.toggle('dark', darkMode.value);

createInertiaApp({
  title: title => `${appName} - ${title}`,
  resolve: name =>
    resolvePageComponent(
      `./Pages/${name}.vue`,
      import.meta.glob('./Pages/**/*.vue'),
    ),
  setup({ el, App, props, plugin }) {
    return createApp({ render: () => h(App, props) })
      .use(plugin)
      .component('Link', Link)
      .component('Head', Head)
      .component('Layout', Layout)
      .mount(el);
  },
  progress: {
    color: '#4B5563',
  },
});
