import { createApp } from 'vue';
import '@/styles/style.css';
import '@/styles/tailwindcss.css';
import '@/styles/design-system.css';
import 'element-plus/dist/index.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import App from './App.vue';
import router from './router';
import ElementPlus from 'element-plus';
import { createPinia } from 'pinia';
const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(ElementPlus);
app.use(router);
app.mount('#app');
