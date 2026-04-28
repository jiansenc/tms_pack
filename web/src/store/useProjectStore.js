import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import request from '@/utils/request.js';
export const useProjectStore = defineStore('project', () => {
  const currentProject = ref({});
  const projectsInfo = ref([]);
  const STORAGE_KEY = 'selectedProjectId';
  const CURRENT_PROJECT_KEY = 'currentProject';

  const init = async () => {
    let { projects } = await request.get('/projects');
    projectsInfo.value = projects;
    await loadSavedProject();
  };

  const setProject = (project) => {
    console.log(project);
    currentProject.value = project;
    // 保存到本地存储
    localStorage.setItem(STORAGE_KEY, project.uid);
    localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(project));
  };

  const loadSavedProject = async () => {
    try {
      // 优先从本地存储加载完整的项目信息
      const savedProject = localStorage.getItem(CURRENT_PROJECT_KEY);
      if (savedProject) {
        currentProject.value = JSON.parse(savedProject);
      }

      // 从本地存储加载项目ID并获取最新信息
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId) {
        let res = await request.get(`/project/info/${savedId}`);
        currentProject.value = res;
      }
    } catch (error) {
      console.error('加载保存的项目失败:', error);
    }
  };

  return {
    init,
    setProject,
    currentProject,
    projectsInfo,
    loadSavedProject,
  };
});
