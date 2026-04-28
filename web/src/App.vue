<template>
  <router-view />
</template>
<script setup>
import { useWebSocketStore } from '@/store/useWebSocketStore.js'
import { onMounted } from 'vue'
import { useProjectStore } from '@/store/useProjectStore.js'
const projectStore = useProjectStore();
const wsStore = useWebSocketStore();
projectStore.init()
wsStore.connect();
</script>