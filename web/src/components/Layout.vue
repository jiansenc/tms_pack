<template>
  <div class="layout">
    <Nav />
    <div class="content">
      <Header />
      <main class="main-content" :style="{ height: mainContentHeight }">
        <router-view />
      </main>
      <LogPanel @height-change="handleHeightChange" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Nav from '@/components/Nav.vue';
import Header from '@/components/Header.vue';
import LogPanel from '@/components/LogPanel.vue';
import { useWebSocketStore } from '@/store/useWebSocketStore.js';

const wsStore = useWebSocketStore();
const mainContentHeight = ref('calc(100vh - 64px - 200px)');

// 处理日志面板高度变化
const handleHeightChange = (height) => {
  mainContentHeight.value = `calc(100vh - 64px - ${height}px)`;
};
</script>

<style lang="scss" scoped>
.layout {
  height: 100vh;
  display: flex;
  background: var(--bg-secondary);
  overflow: hidden;

  .nav {
    width: 240px;
    flex-shrink: 0;
    height: 100vh;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg-secondary);
    height: 100vh;

    .main-content {
      /* padding: 10px; */
      overflow-y: auto;
      scroll-behavior: smooth;

      /* Custom Scrollbar */
      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background: var(--color-gray-100);
        border-radius: var(--radius-full);
      }

      &::-webkit-scrollbar-thumb {
        background: var(--color-gray-300);
        border-radius: var(--radius-full);

        &:hover {
          background: var(--color-gray-400);
        }
      }
    }
  }
}
</style>
