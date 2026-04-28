<template>
  <header class="header">
    <div class="header-left">
      <div class="connection-indicator" :class="wsStore.isConnected ? 'connected' : 'disconnected'">
        <span class="indicator-dot"></span>
        <span class="indicator-text">WS {{ wsStore.isConnected ? 'Connected' : 'Disconnected' }}</span>
      </div>
    </div>

    <div class="header-center">
      <div class="project-selector-btn" @click="showProjectDialog = true">
        <span class="project-name">{{ projectStore.currentProject?.name || 'Select Project' }}</span>
        <i class="bi bi-chevron-down arrow-icon"></i>
      </div>
    </div>

    <div class="header-right">
      <div class="branch-badge">
        <i class="bi bi-git branch-icon"></i>
        <span class="branch-text">{{ projectStore.currentProject?.curBranch }}</span>
      </div>
    </div>

    <!-- 项目选择弹窗 -->
    <el-dialog v-model="showProjectDialog" title="" width="960px" top="50px" :close-on-click-modal="false" class="project-dialog">
      <template #header>
        <div class="dialog-header">
          <h2 class="dialog-title">Select Project</h2>
          <span class="dialog-subtitle">Choose a project to work with</span>
        </div>
      </template>

      <div class="project-list">
        <template v-for="(group, groupName) in groupedProjects" :key="groupName">
          <div class="group-label">{{ groupName }}</div>
          <div class="group-projects">
          <div
            v-for="project in group"
            :key="project.uid"
            class="project-item"
            :class="{ active: project.uid === projectId }"
            @click="selectProject(project.uid)">
            <div class="item-icon"><img :src="groupIcons[groupName]" :alt="groupName" @error="$event.target.style.display='none'" /></div>
            <div class="item-content">
              <div class="item-name">{{ project.name }}</div>
              <div class="item-uid">{{ project.uid }}</div>
            </div>
            <div class="item-check">
              <i class="bi bi-check-circle"></i>
            </div>
          </div>
          </div>
        </template>
      </div>
    </el-dialog>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useWebSocketStore } from '@/store/useWebSocketStore.js';
import { useProjectStore } from '@/store/useProjectStore.js';
import request from '@/utils/request.js';

const wsStore = useWebSocketStore();
const projectStore = useProjectStore();

const projectId = ref('');
const showProjectDialog = ref(false);
const iconLoadErrors = reactive({});

const groupedProjects = computed(() => {
  const projects = projectStore.projectsInfo;
  const groups = {};
  projects.forEach((project) => {
    const groupName = project.group || 'Ungrouped';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(project);
  });
  return groups;
});

const groupIcons = computed(() => {
  const icons = {};
  for (const name of Object.keys(groupedProjects.value)) {
    icons[name] = `/images/icon/${name}.ico`;
  }
  return icons;
});

/**
 * 获取项目的 favicon URL
 * @param {string} projectUid - 项目唯一标识
 * @returns {string} favicon 的完整 URL
 */
function getProjectFaviconUrl(projectUid) {
  return `/public/${projectUid}/favicon.ico`;
}

/**
 * 处理图标加载错误
 * 当 favicon.ico 加载失败时，标记该项目使用默认图标
 * @param {string} projectUid - 项目唯一标识
 */
function handleIconError(projectUid) {
  iconLoadErrors[projectUid] = true;
  console.warn(`Favicon加载失败: ${getProjectFaviconUrl(projectUid)}`);
}

/**
 * 从本地存储加载选中的项目ID
 */
function loadSelectedProjectId() {
  try {
    const savedId = localStorage.getItem('selectedProjectId');
    if (savedId) {
      projectId.value = savedId;
    }
  } catch (error) {
    console.error('加载本地存储的项目ID失败:', error);
  }
}

/**
 * 选择项目
 * @param {string} val - 项目的唯一标识符
 */
async function selectProject(val) {
  projectId.value = val;
  showProjectDialog.value = false;

  // 保存到本地存储
  try {
    localStorage.setItem('selectedProjectId', val);
  } catch (error) {
    console.error('保存项目ID到本地存储失败:', error);
  }

  // 获取项目详细信息并更新 store
  try {
    const res = await request.get(`/project/info/${val}`);
    projectStore.setProject(res);
  } catch (error) {
    console.error('获取项目信息失败:', error);
  }
}

// 组件挂载时加载保存的项目ID
onMounted(() => {
  loadSelectedProjectId();
});
</script>

<style lang="scss" scoped>
.header {
  height: 64px;
  background: var(--color-white);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-6);
  box-shadow: var(--shadow-xs);
  position: relative;
  z-index: var(--z-sticky);

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);

    .connection-indicator {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      padding: var(--spacing-2) var(--spacing-3);
      border-radius: var(--radius-full);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      transition: all var(--transition-fast);

      &.connected {
        background: var(--color-success-50);
        color: var(--color-success-600);

        .indicator-dot {
          background: var(--color-success-500);
          animation: pulse 2s infinite;
        }
      }

      &.disconnected {
        background: var(--color-error-light);
        color: var(--color-error);

        .indicator-dot {
          background: var(--color-error);
        }
      }

      .indicator-dot {
        width: 8px;
        height: 8px;
        border-radius: var(--radius-full);
      }

      .indicator-text {
        font-size: var(--font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }
  }

  .header-center {
    flex: 1;
    display: flex;
    justify-content: center;
    max-width: 400px;

    .project-selector-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 10px;
      background: var(--color-gray-50);
      border: 1px solid var(--border-medium);
      border-radius: 3px;
      cursor: pointer;
      transition: all var(--transition-fast);
      min-width: 200px;

      &:hover {
        border-color: var(--color-primary-400);
        background: var(--color-gray-100);
      }

      .project-name {
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
        font-size: 16px;
      }

      .arrow-icon {
        color: var(--text-tertiary);
        transition: transform var(--transition-fast);
        font-size: 14px;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);

    .branch-badge {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      padding: var(--spacing-2) var(--spacing-3);
      background: var(--color-gray-50);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-base);
      font-size: var(--font-size-sm);

      .branch-icon {
        color: var(--text-tertiary);
        flex-shrink: 0;
        font-size: 16px;
      }

      .branch-text {
        font-weight: var(--font-weight-medium);
        color: var(--text-secondary);
        font-family: var(--font-family-mono);
      }
    }
  }
}

:deep(.project-dialog) {
  .el-dialog__header {
    padding: 0;
    margin-bottom: var(--spacing-6);
  }

  .el-dialog__body {
    padding: 0;
  }
}

.dialog-header {
  text-align: left;

  .dialog-title {
    font-size: 20px;
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-1) 0;
  }

  .dialog-subtitle {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
  }
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  max-height: 700px;
  overflow-y: auto;
  padding-right: 10px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-gray-300);
    border-radius: var(--radius-full);

    &:hover {
      background: var(--color-gray-400);
    }
  }

  .group-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: var(--spacing-2) 0;
    border-bottom: 1px solid var(--border-light);
    margin-top: var(--spacing-2);

    &:first-child {
      margin-top: 0;
    }
  }

  .group-projects {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-3);
  }

  .project-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-white);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-base);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      border-color: var(--color-primary-300);
      background: var(--color-gray-50);
    }

    &.active {
      border-color: var(--color-primary-500);
      background: var(--color-primary-50);

      .item-icon {
        background: var(--color-primary-100);
        color: var(--color-primary-600);
      }

      .item-check {
        opacity: 1;
      }
    }

    .item-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-gray-100);
      border-radius: var(--radius-base);
      color: var(--text-secondary);
      font-size: 20px;
      flex-shrink: 0;
      transition: all 0.2s ease;
      overflow: hidden;
      padding: 4px;

      .project-favicon {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }

      .default-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }
    }

    .item-content {
      flex: 1;
      min-width: 0;

      .item-name {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .item-uid {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
        font-family: var(--font-family-mono);
      }
    }

    .item-check {
      font-size: 20px;
      color: var(--color-primary-600);
      opacity: 0;
      transition: opacity 0.2s ease;
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
