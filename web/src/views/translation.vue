<template>
  <div class="translation-page">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <i class="bi bi-translate header-icon"></i>
        <h1 class="header-title">Translation</h1>
      </div>
    </header>

    <!-- Main -->
    <main class="main">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-section">
          <h2 class="sidebar-section-title">Actions</h2>
          <div class="action-list">
            <button class="action-btn" :class="{ loading }" @click="scanTranslation">
              <i class="bi bi-upc-scan action-icon icon-primary"></i>
              <span class="action-text">Scan</span>
              <Loading v-if="loading" class="loading-icon" />
              <i v-else class="bi bi-chevron-right action-arrow"></i>
            </button>

            <button class="action-btn" @click="uploadTMS">
              <i class="bi bi-cloud-upload action-icon icon-success"></i>
              <span class="action-text">Upload ZH</span>
              <i class="bi bi-chevron-right action-arrow"></i>
            </button>

            <button class="action-btn" :class="{ loading: uploadEngLoading }" @click="uploadENG">
              <i class="bi bi-globe action-icon icon-info"></i>
              <span class="action-text">Upload EN/TH</span>
              <Loading v-if="uploadEngLoading" class="loading-icon" />
              <i v-else class="bi bi-chevron-right action-arrow"></i>
            </button>

            <button class="action-btn" :class="{ loading: asyncLanguageLoading }" @click="HnadleasyncLanguage">
              <i class="bi bi-arrow-repeat action-icon icon-warning"></i>
              <span class="action-text">Sync</span>
              <Loading v-if="asyncLanguageLoading" class="loading-icon" />
              <i v-else class="bi bi-chevron-right action-arrow"></i>
            </button>
          </div>
        </div>

        <div class="sidebar-section">
          <h2 class="sidebar-section-title">Tools</h2>
          <div class="action-list">
            <button class="action-btn" @click="convertToJson">
              <i class="bi bi-code-slash action-icon icon-primary"></i>
              <span class="action-text">To JSON</span>
              <i class="bi bi-chevron-right action-arrow"></i>
            </button>

            <button class="action-btn" @click="convertToCSV">
              <i class="bi bi-file-earmark-spreadsheet action-icon icon-success"></i>
              <span class="action-text">Export CSV</span>
              <i class="bi bi-chevron-right action-arrow icon-muted"></i>
            </button>
            <button class="action-btn" @click="toCoze">
              <img src="https://lf-coze-web-cdn.coze.cn/obj/coze-web-cn/obric/coze/favicon.1970.png" alt="" />
              <span class="action-text">CozeV4</span>
              <i class="bi bi-chevron-right action-arrow icon-muted"></i>
            </button>
            <button class="action-btn" @click="toTMS">
              <img src="http://192.168.50.211:8090/favicon.ico" alt="" />
              <span class="action-text">TMS</span>
              <i class="bi bi-chevron-right action-arrow icon-muted"></i>
            </button>
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="status-indicator" :class="statusClass"></div>
          <span class="status-text">{{ statusText }}</span>
        </div>
      </aside>

      <!-- Editor -->
      <section class="editor">
        <div class="editor-header">
          <span class="editor-title">editor.json</span>
          <div class="editor-actions">
            <button class="icon-btn" @click="clearEditor" :disabled="!tmsJson" title="Clear">
              <i class="bi bi-x-lg"></i>
            </button>
            <button class="icon-btn" @click="copyToClipboard" :disabled="!tmsJson" title="Copy">
              <i class="bi bi-clipboard"></i>
            </button>
          </div>
        </div>
        <el-input
          type="textarea"
          v-model="tmsJson"
          :placeholder="`1. sync: en, th
        `"
          class="json-editor" />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useWebSocketStore } from '@/store/useWebSocketStore.js';
import { useProjectStore } from '@/store/useProjectStore.js';
import request from '@/utils/request.js';
import { message, logger } from '@/utils';
import Loading from '@/components/Loading.vue';

const JOB = useProjectStore();
const ws = useWebSocketStore();

const tmsJson = ref('');
const loading = ref(false);
const asyncLanguageLoading = ref(false);
const uploadEngLoading = ref(false);
const isDirty = ref(false);

const statusClass = computed(() => {
  if (loading.value || uploadEngLoading.value || asyncLanguageLoading.value) return 'processing';
  if (isDirty.value) return 'modified';
  return 'ready';
});

const statusText = computed(() => {
  if (loading.value) return 'Scanning...';
  if (uploadEngLoading.value) return 'Uploading...';
  if (asyncLanguageLoading.value) return 'Syncing...';
  if (isDirty.value) return 'Modified';
  return 'Ready';
});

function scanTranslation() {
  loading.value = true;
  ws.send({
    type: 'scanTranslation',
    projectId: JOB.currentProject.uid,
  });
}

ws.subscription('scanTranslation', (data) => {
  if (data.status === 'success' || data.status === 'error') {
    loading.value = false;
    if (typeof data.json === 'object') {
      tmsJson.value = JSON.stringify(data.json, null, 2);
    }
  }
});

ws.subscription('asyncLanguage', (data) => {
  if (data.status === 'success' || data.status === 'error') {
    asyncLanguageLoading.value = false;
    message.success('完成更新');
  }
});

function uploadTMS() {
  if (!validateJson()) return;
  const params = {
    lang: 2,
    projectId: JOB.currentProject.projectId,
    json: JSON.parse(tmsJson.value),
  };
  request
    .put('/tms', params)
    .then((res) => {
      isDirty.value = false;
      logger.success('中文翻译上传成功');
      message.success(res.split('</h3>')[0].replace('<h3>', ''));
    })
    .catch((err) => {
      logger.error('中文翻译上传失败:', err);
      message.error('Upload failed');
    });
}

async function uploadENG() {
  if (!validateJson()) return;
  logger.info('========== 开始上传英文/泰文翻译 ==========');
  const { en, th } = JSON.parse(tmsJson.value);
  const arr = [
    { json: en, lang: 1 },
    { json: th, lang: 3 },
  ];
  logger.debug('项目ID:', JOB.currentProject.projectId);
  logger.debug('英文键值对数量:', Object.keys(en || {}).length);
  logger.debug('泰文键值对数量:', Object.keys(th || {}).length);
  uploadEngLoading.value = true;
  try {
    for (const item of arr) {
      logger.debug(`开始上传${item.lang === 1 ? '英文' : '泰文'}翻译...`);
      const params = { ...item, projectId: JOB.currentProject.projectId };
      const res = await request.put('/tms', params);
      logger.success(`上传${item.lang === 1 ? '英文' : '泰文'}完成: ${res.split('</h3>')[0].replace('<h3>', '')}`);
    }
    isDirty.value = false;
    logger.success('所有翻译上传完成');
    message.success('Upload completed');
  } catch (err) {
    logger.error('上传失败:', err);
    message.error('Upload failed');
  } finally {
    uploadEngLoading.value = false;
  }
}

function HnadleasyncLanguage() {
  logger.info('========== 开始同步语言 ==========');
  logger.debug('项目ID:', JOB.currentProject.uid);
  asyncLanguageLoading.value = true;
  ws.send({
    type: 'asyncLanguage',
    projectId: JOB.currentProject.uid,
    useLanguage: tmsJson.value.trim(),
  });
  logger.debug('已发送同步请求，等待响应...');
}

function convertToJson() {
  logger.info('========== 开始转换 CSV 到 JSON ==========');
  if (!tmsJson.value.trim()) {
    logger.warning('CSV 数据为空，请先粘贴 CSV 数据');
    message.warning('Please paste CSV data first');
    return;
  }
  try {
    logger.debug('CSV 行数:', tmsJson.value.split('\n').length);
    const arr = tmsJson.value.split('\n');

    const enjson = {};
    const thjson = {};
    const zhjson = {};
    arr.forEach((item) => {
      if (item) {
        const parts = item.split('\t');
        const key = parts[0];
        if (key) {
          zhjson[key] = parts[1] || '';
          enjson[key] = parts[5] || parts[2];
          thjson[key] = parts[6] || parts[3];
        }
      }
    });
    tmsJson.value = JSON.stringify({ zh: zhjson, en: enjson, th: thjson }, null, 2);
    isDirty.value = false;
    logger.success('转换成功');
    message.success('Converted to JSON');
  } catch (err) {
    logger.error('转换失败:', err);
    message.error('Conversion failed');
  }
}
function convertToCSV() {
  if (!validateJson()) return;
  try {
    const data = JSON.parse(tmsJson.value);
    const keyCount = Object.keys(data).length;
    // 加上 UTF-8 BOM，解决 Excel 乱码（特别是泰文、中文等）
    let csvContent = '\uFEFFKEY,中文\n';

    for (const key in data) {
      let value = data[key] ?? ''; // 防止 undefined/null

      // CSV 标准转义：如果值包含 " , 换行 等特殊字符，就包双引号
      if (typeof value === 'string' && /["\n,]/.test(value)) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }

      csvContent += `${key},${value}\n`;
    }

    // 使用 Blob + 指定 utf-8（BOM 已包含在字符串中）
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    const filename = `${JOB.currentProject.uid}_${random}.csv`;
    logger.success(`CSV exported as ${filename}`);
    link.download = filename;

    // 触发下载
    document.body.appendChild(link); // 部分浏览器需要 append 才能 click
    link.click();
    document.body.removeChild(link); // 清理
    URL.revokeObjectURL(link.href); // 释放内存
    message.success('CSV exported');
  } catch (err) {
    logger.error('导出失败:', err);
    message.error('Export failed: ' + (err.message || '未知错误'));
  }
}
function validateJson() {
  if (!tmsJson.value.trim()) {
    logger.warning('JSON 数据为空');
    message.warning('JSON data is empty');
    return false;
  }
  try {
    const parsed = JSON.parse(tmsJson.value);
    return true;
  } catch (err) {
    logger.error('JSON 验证失败:', err.message);
    message.error('Invalid JSON');
    return false;
  }
}

function clearEditor() {
  const previousLength = tmsJson.value.length;
  tmsJson.value = '';
  isDirty.value = false;
}

function toCoze() {
  window.open('https://www.coze.cn/store/agent/7602086364633022483?bot_id=true&bid=6j00f3578bg1e', '_blank');
}

function copyToClipboard() {
  navigator.clipboard
    .writeText(tmsJson.value)
    .then(() => {
      message.success('Copied');
    })
    .catch((err) => {
      message.error('Copy failed');
    });
}

function toTMS() {
  if (JOB.currentProject.projectId) {
    window.open(`http://192.168.50.211:8090/admin/translate?projectId=${JOB.currentProject.projectId}`, '_blank');
  } else {
    window.open(`http://192.168.50.211:8090/admin/translate?projectId=51&search=proxy_payment_list`, '_blank');
  }
}
</script>

<style lang="scss" scoped>
.translation-page {
  height: calc(100vh - 20px);
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 48px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .header-icon {
      font-size: 18px;
      color: #3b82f6;
    }

    .icon-primary {
      color: #3b82f6;
    }

    .icon-success {
      color: #10b981;
    }

    .icon-warning {
      color: #f59e0b;
    }

    .icon-info {
      color: #6366f1;
    }

    .icon-muted {
      color: #9ca3af;
    }

    .header-title {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }
  }

  .header-right {
    .char-count {
      font-size: 12px;
      color: #6b7280;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    }
  }
}

.main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .sidebar-section {
    padding: 16px 12px;

    .sidebar-section-title {
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 8px 0;
      padding-left: 8px;
    }

    .action-list {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .action-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        background: transparent;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
        width: 100%;
        text-align: left;
        position: relative;
        img {
          width: 16px;
          height: 16px;
          image-rendering: pixelated;
        }
        .loading-icon {
          /* position: absolute; */
          /* bottom: 2px; */
        }
        &:hover {
          background: #f3f4f6;

          .action-icon {
            transform: scale(1.1);
          }

          .action-arrow {
            color: #3b82f6;
            transform: translateX(2px);
          }

          .icon-primary {
            color: #2563eb;
          }

          .icon-success {
            color: #059669;
          }

          .icon-warning {
            color: #d97706;
          }

          .icon-info {
            color: #4f46e5;
          }

          .icon-muted {
            color: #6b7280;
          }
        }

        &:active {
          background: #e5e7eb;
        }
        .action-icon {
          font-size: 16px;
          color: #4b5563;
          flex-shrink: 0;
          width: 16px;
          text-align: center;
          transition: all 0.15s ease;

          &.icon-primary {
            color: #3b82f6;
          }

          &.icon-success {
            color: #10b981;
          }

          &.icon-warning {
            color: #f59e0b;
          }

          &.icon-info {
            color: #6366f1;
          }

          &.icon-muted {
            color: #9ca3af;
          }
        }

        .action-text {
          font-size: 13px;
          color: #374151;
          flex: 1;
          font-weight: 500;
        }

        .action-arrow {
          font-size: 14px;
          color: #9ca3af;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
      }
    }
  }

  .sidebar-footer {
    margin-top: auto;
    padding: 16px 12px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 8px;

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;

      &.ready {
        background: #10b981;
      }

      &.processing {
        background: #3b82f6;
        animation: pulse 1.5s ease-in-out infinite;
      }

      &.modified {
        background: #f59e0b;
      }
    }

    .status-text {
      font-size: 12px;
      color: #6b7280;
    }
  }
}

.editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
    height: 36px;

    .editor-title {
      font-size: 12px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      color: #6b7280;
    }

    .editor-actions {
      display: flex;
      gap: 4px;

      .icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: transparent;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        color: #6b7280;
        transition: all 0.15s ease;

        &:hover:not(:disabled) {
          background: #e5e7eb;
          color: #3b82f6;
          transform: scale(1.1);
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        i {
          font-size: 14px;
          display: inline-block;
          transition: all 0.15s ease;
        }
      }
    }
  }

  .json-editor {
    flex: 1;

    :deep(.el-textarea__inner) {
      height: 100% !important;
      border: none;
      border-radius: 0;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 12px;
      line-height: 1.6;
      color: #374151;
      resize: none;
      padding: 16px;
      background: #ffffff;

      &::placeholder {
        color: #9ca3af;
      }

      &:focus {
        box-shadow: none;
        outline: none;
      }
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
