<template>
  <div class="log-panel-wrapper">
    <div class="resize-handle" @mousedown="startResize" @dblclick="resetLogPanel" title="Double-click to reset">
      <div class="handle-line"></div>
    </div>
    <div class="log-panel" :style="{ height: isLogPanelVisible ? currentHeight : '0px' }">
      <div class="log-panel-header">
        <span class="log-title">Logs</span>
        <div class="header-actions">
          <button @click="clearLogs" class="action-btn clear-btn" title="Clear logs">
            <i class="bi bi-trash"></i>
          </button>
          <button @click="toggleLogPanel" class="action-btn toggle-btn" :title="isLogPanelVisible ? 'Hide' : 'Show'">
            <i v-if="isLogPanelVisible" class="bi bi-chevron-up"></i>
            <i v-else class="bi bi-chevron-down"></i>
          </button>
        </div>
      </div>
      <div class="log-panel-content" ref="logContent">
        <div v-if="logs.length === 0" class="log-empty">
          <span>No logs</span>
        </div>
        <div v-for="(log, index) in logs" :key="index" class="log-entry" :class="[`log-type-${log.type}`]">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useWebSocketStore } from '@/store/useWebSocketStore.js';

// 日志面板状态
const wsStore = useWebSocketStore();
const logContent = ref(null);
const isLogPanelVisible = ref(true);
const currentHeight = ref('200px');
const isResizing = ref(false);
const startY = ref(0);
const startHeight = ref(0);

// 定义事件
const emit = defineEmits(['height-change']);

// 使用 WebSocketStore 中的日志
const logs = computed(() => {
  return wsStore.logEvent.map((log) => ({
    time: log.time || new Date().toLocaleTimeString(),
    message: log.log,
    type: log.type || 'log',
  }));
});

// 监听日志变化，自动滚动到底部
watch(
  logs,
  () => {
    nextTick(() => {
      if (logContent.value) {
        logContent.value.scrollTop = logContent.value.scrollHeight;
      }
    });
  },
  { deep: true },
);

// 清空日志
const clearLogs = () => {
  wsStore.logEvent = [];
};

// 切换日志面板显示/隐藏
const toggleLogPanel = () => {
  isLogPanelVisible.value = !isLogPanelVisible.value;
  emitHeightChange();
};

// 重置日志面板高度
const resetLogPanel = () => {
  currentHeight.value = '200px';
  isLogPanelVisible.value = true;
  emitHeightChange();
};

// 开始调整大小
const startResize = (e) => {
  isResizing.value = true;
  startY.value = e.clientY;
  startHeight.value = parseInt(currentHeight.value);
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
  e.preventDefault();
};

// 调整大小中
const onResize = (e) => {
  if (!isResizing.value) return;

  const deltaY = startY.value - e.clientY;
  const newHeight = startHeight.value + deltaY;

  if (newHeight > 0) {
    currentHeight.value = `${newHeight}px`;
    isLogPanelVisible.value = newHeight > 0;
    emitHeightChange();
  }
};

// 停止调整大小
const stopResize = () => {
  isResizing.value = false;
  startY.value = 0;
  startHeight.value = 0;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
};

// 发射高度变化事件
const emitHeightChange = () => {
  const height = isLogPanelVisible.value ? parseInt(currentHeight.value) : 0;
  emit('height-change', height);
};

// 测试日志功能
onMounted(() => {
  console.log('LogPanel mounted, wsStore.logEvent.length:', wsStore.logEvent.length);
  wsStore.addLog({ log: '日志面板已启动，准备接收日志...', type: 'success' });
});

onUnmounted(() => {
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
});

// 暴露方法给父组件
defineExpose({
  clearLogs,
});
</script>

<style lang="scss" scoped>
.log-panel-wrapper {
  display: flex;
  flex-direction: column;

  .resize-handle {
    height: 6px;
    background: var(--color-gray-200);
    cursor: ns-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid var(--border-light);

    &:hover {
      background: var(--color-gray-300);
    }

    .handle-line {
      width: 30px;
      height: 2px;
      background: var(--color-gray-400);
      border-radius: var(--radius-full);
    }
  }

  .log-panel {
    background: #ffffff;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .log-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 var(--spacing-3);
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      height: 28px;

      .log-title {
        font-size: 12px;
        color: #333333;
        font-weight: var(--font-weight-medium);
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-2);

        .action-btn {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          color: #666666;
          border-radius: var(--radius-sm);
          cursor: pointer;

          i {
            font-size: 10px;
          }

          &:hover {
            background: rgba(0, 0, 0, 0.08);
            color: #000000;
          }

          &.clear-btn:hover {
            background: rgba(220, 38, 38, 0.1);
            color: #dc2626;
          }
        }
      }
    }

    .log-panel-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-2);
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;
      line-height: 1.5;

      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background: #f0f0f0;
      }

      &::-webkit-scrollbar-thumb {
        background: #c0c0c0;
        border-radius: var(--radius-full);

        &:hover {
          background: #a0a0a0;
        }
      }

      .log-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-6);
        color: #999999;
        font-size: 12px;
      }

      .log-entry {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-3);
        padding: 2px 0;

        .log-time {
          color: #999999;
          min-width: 85px;
          user-select: none;
          font-size: 11px;
        }

        .log-message {
          flex: 1;
          word-break: break-all;
          white-space: pre-wrap;
          color: #333333;
        }

        // 默认日志 - 黑色
        &.log-type-log {
          .log-message {
            color: #333333;
          }
        }

        // Info 日志 - 蓝色
        &.log-type-info {
          .log-message {
            color: #2563eb;
          }
        }

        // Success 日志 - 绿色
        &.log-type-success {
          .log-message {
            color: #16a34a;
          }
        }

        // Warning 日志 - 橙色
        &.log-type-warn,
        &.log-type-warning {
          .log-message {
            color: #d97706;
          }
        }

        // Error 日志 - 红色
        &.log-type-error {
          .log-message {
            color: #dc2626;
            font-weight: var(--font-weight-medium);
          }
        }

        // Debug 日志 - 灰色
        &.log-type-debug {
          .log-message {
            color: #6b7280;
            font-style: italic;
          }
        }
      }
    }
  }
}
</style>
