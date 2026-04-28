<template>
  <div class="index">
    <ScheduledTask />
  </div>
</template>
<script setup>
import { ref } from 'vue';
import ScheduledTask from './module/scheduledTask.vue';
</script>
<style lang="scss">
.index {
  padding: 10px;
}
</style>
