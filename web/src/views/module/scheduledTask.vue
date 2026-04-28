<template>
  <div class="scheduled-task">
    <el-card shadow="never">
      <template #header>
        <i class="bi bi-stopwatch"></i>
        定时任务
      </template>
      <ul>
        <li>
          <span>DEV 环境</span>
          <el-button @click="pay('dev')">
            <i class="bi bi-arrow-repeat"></i>
          </el-button>
        </li>
        <li>
          <span>SIT 环境</span>
          <el-button @click="pay('sit')">
            <i class="bi bi-arrow-repeat"></i>
          </el-button>
        </li>
      </ul>
    </el-card>
  </div>
</template>
<script setup>
import { useWebSocketStore } from '@/store/useWebSocketStore.js';
const ws = useWebSocketStore();

function pay(env) {
  ws.send({
    type: 'task-sync',
    env: env,
  });
}
</script>
<style lang="scss">
.scheduled-task {
  width: 400px;
  ul {
    li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px;
      border-bottom: 1px solid #f5f5f5;
      &:last-child {
        border-bottom: none;
      }
    }
  }
}
</style>
