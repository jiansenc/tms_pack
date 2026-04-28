
<template>
  <div class="packaged-page">
      <div class="page-header">
          <el-button type="primary" @click="openExplorer">Explorer</el-button>
      </div>
    <div class="page-content">
      <div class="commands-grid">
        <div v-for="(row, index) in tableData" :key="index" class="command-card" ">
          <!-- Card Header -->
          <div class="card-header">
            <div class="env-badge" :class="row.env">
              <i :class="getEnvIcon(row.env)"></i>
              <span>{{ row.env }}</span>
            </div>
            <el-switch
              v-model="row.autoUpload"
              size="small"
              @change="saveAutoUpload(row.env, row.autoUpload)"
            />
          </div>

          <!-- Card Content -->
          <div class="card-content">
            <div class="command-display">
              <code class="command-text">{{ row.command }}</code>
            </div>

            <div class="script-display">
              <div class="script-content">
                {{ row.script }}
              </div>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="card-footer">
            <Button v-if="row.status === 'running'" />
            <button
            v-else
             @click="executeCommand(row, index)"
             class="execute-button"
             :class="{
               'button-loading': row.status === 'running',
               'button-success': row.status === 'success',
             }">
             <span class="button-content">
               <span class="button-text">{{ getButtonText(row.status) }}</span>
             </span>
           </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useWebSocketStore } from '@/store/useWebSocketStore.js';
import { useProjectStore } from '@/store/useProjectStore.js';
import { ElMessage } from 'element-plus';
import request from '@/utils/request.js';
import Button from '@/components/Button.vue'

const ws = useWebSocketStore();
const JOB = useProjectStore();
const tableData = ref([]);
const hoveredIndex = ref(null);

// Generate localStorage key for auto-upload setting
const getAutoUploadKey = (projectId, env) => {
  return `autoUpload_${projectId}_${env}`;
};

function openExplorer() {
  request.get(`/explorerPackDir`);
}

// Save auto-upload setting to localStorage
const saveAutoUpload = (env, value) => {
  if (!JOB.currentProject?.uid) return;
  const key = getAutoUploadKey(JOB.currentProject.uid, env);
  localStorage.setItem(key, value.toString());
};

// Initialize table data with status
const initializeData = (data) => {
  if (!data) return [];
  const projectId = JOB.currentProject?.uid || '';
  return data.map((item) => {
    const key = getAutoUploadKey(projectId, item.env);
    const savedValue = localStorage.getItem(key);
    return {
      ...item,
      status: 'idle',
      message: '',
      timestamp: null,
      autoUpload: savedValue === 'true',
    };
  });
};

// Computed running count
// const runningCount = computed(() => {
//   return tableData.value.filter((row) => row.status === 'loading' || row.status === 'running').length;
// });

watch(
  () => JOB.currentProject,
  async (newVal, oldVal) => {
    if (newVal) {
      tableData.value = initializeData(newVal.buildCommand);
    }
  },
  { immediate: true },
);

// Watch for auto-upload changes and execute command automatically
// watch(
//   () => tableData.value.map(row => ({ env: row.env, autoUpload: row.autoUpload, status: row.status })),
//   (newRows, oldRows) => {
//     if (!oldRows) return;

//     newRows.forEach((newRow, index) => {
//       const oldRow = oldRows[index];
//       if (newRow.autoUpload && !oldRow.autoUpload && newRow.status === 'idle') {
//         // Auto-upload was enabled, execute the command
//         executeCommand(tableData.value[index], index);
//       }
//     });
//   },
//   { deep: true },
// );

function executeCommand(row, index) {
  row.status = 'running';
  hoveredIndex.value = index;
  ws.send({
    type: 'packaged',
    env: row.env,
    autoUpload: row.autoUpload,
    command: row.command.trim(),
    projectId: JOB.currentProject.uid,
    index: index,
  });
}

function getEnvIcon(env) {
  const iconMap = {
    build: 'bi bi-code-square',
    sit: 'bi bi-flask',
    beta: 'bi bi-layers',
    prod: 'bi bi-box-seam',
  };
  return iconMap[env.toLowerCase()] || 'bi bi-gear';
}

function getStatusMessage(status, message) {
  const messages = {
    loading: 'Executing...',
    running: 'Running...',
    success: message || 'Build completed successfully',
    error: message || 'Build failed',
    idle: '',
  };
  return messages[status] || '';
}

function getButtonText(status) {
  const texts = {
    loading: 'Running',
    running: 'Running',
    success: 'Success',
    error: 'Retry',
    idle: 'Execute',
  };
  return texts[status] || 'Execute';
}

// WebSocket subscription
ws.subscription('packaged', (data) => {
  if (data.status === 'success') {
    tableData.value[hoveredIndex.value].status = 'success';
  }
});
</script>

<style lang="scss" scoped>
.packaged-page {
  margin: 0 auto;
  padding: var(--spacing-4);
}

.page-header {
  margin-bottom: var(--spacing-4);
  margin-bottom: 10px;
  }


.page-content {
  .commands-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--spacing-4);
  }

  .command-card {
    background: var(--color-white);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
      border-color: var(--color-primary-200);
    }

    &.card-hover {
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--env-color);
      }
    }

    &.card-loading {
      border-color: var(--color-primary-300);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    &.card-success {
      border-color: var(--color-success-300);
      box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.1);
    }

    &.card-error {
      border-color: var(--color-error-300);
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-2) var(--spacing-3);
      border-bottom: 1px solid var(--border-light);
      background: var(--color-gray-50);

      .env-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-1);
        padding: var(--spacing-1) var(--spacing-2);
        border-radius: var(--radius-sm);
        font-size: 12px;
        font-weight: var(--font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;

        i {
          font-size: 13px;
        }
        &.build {
          background: #eff6ff;
          color: #3b82f6;
        }

        &.sit {
            background: #fff18aa6;
                color: #6f4f30;
        }

        &.beta {
          background: #f3e8ff;
          color: #a855f7;
        }

        &.prod {
            background: #43ff203d;
            color: #087c27;
        }
      }

      .status-indicator {
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 12px;
        transition: all 0.3s ease;

        &.idle {
          color: var(--color-gray-400);
        }

        &.loading,
        &.running {
          color: var(--color-primary-600);
        }

        &.success {
          color: var(--color-success-500);
        }

        &.error {
          color: var(--color-error-500);
        }

        .rotating {
          animation: rotate 1s linear infinite;
        }
      }
    }

    .card-content {
      padding: var(--spacing-3);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);

      .command-display {
        .command-text {
          display: block;
          padding: var(--spacing-2);
          background: var(--color-gray-50);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
          color: var(--color-primary-600);
          line-height: 1.5;
          word-break: break-all;
        }
      }

      .script-display {
        .script-content {
          padding: var(--spacing-2);
          background: var(--color-gray-50);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          word-break: break-all;
          max-height: 80px;
          overflow-y: auto;
        }
      }
    }

    .card-footer {
      padding: var(--spacing-2) var(--spacing-3);
      border-top: 1px solid var(--border-light);
      background: var(--color-gray-50);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);

      .status-text {
        padding: var(--spacing-1) var(--spacing-2);
        background: var(--color-gray-100);
        border-radius: var(--radius-sm);
        font-size: 12px;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: var(--spacing-1);

        .status-message {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .execute-button {
        width: 100%;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-1);
        padding: var(--spacing-2);
        background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
        color: var(--color-white);
        border: none;
        border-radius: var(--radius-sm);
        font-size: 13px;
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        transition: all 0.3s ease;
        overflow: hidden;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        &.button-success {
          background: linear-gradient(135deg, var(--color-success-500), var(--color-success-600));
          color: var(--color-white);
        }

        &.button-loading {
          background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-500));
        }

        .button-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-1);

          i {
            font-size: 14px;
          }

          .rotating {
            animation: rotate 1s linear infinite;
          }
        }

        .progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          background: rgba(255, 255, 255, 0.8);
          animation: progress 2s ease-in-out infinite;
        }
      }
    }

    // Environment-specific colors
    &.card-dev {
      --env-color: #3b82f6;
    }

    &.card-test {
      --env-color: #eab308;
    }

    &.card-staging {
      --env-color: #a855f7;
    }

    &.card-prod {
      --env-color: #ef4444;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes progress {
  0% {
    width: 0;
    left: 0;
  }
  50% {
    width: 100%;
    left: 0;
  }
  100% {
    width: 0;
    left: 100%;
  }
}
</style>
