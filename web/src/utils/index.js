import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';
import { useWebSocketStore } from '@/store/useWebSocketStore.js';
const wsStore = useWebSocketStore();
/**
 * 消息提示工具
 */
export const message = {
  /**
   * 成功消息
   * @param {string} msg - 消息内容
   * @param {number} duration - 持续时间(ms)
   */
  success(msg, duration = 3000) {
    return ElMessage.success({ message: msg, duration });
  },

  /**
   * 警告消息
   * @param {string} msg - 消息内容
   * @param {number} duration - 持续时间(ms)
   */
  warning(msg, duration = 3000) {
    return ElMessage.warning({ message: msg, duration });
  },

  /**
   * 错误消息
   * @param {string} msg - 消息内容
   * @param {number} duration - 持续时间(ms)
   */
  error(msg, duration = 3000) {
    return ElMessage.error({ message: msg, duration });
  },

  /**
   * 信息消息
   * @param {string} msg - 消息内容
   * @param {number} duration - 持续时间(ms)
   */
  info(msg, duration = 3000) {
    return ElMessage.info({ message: msg, duration });
  },

  /**
   * 关闭所有消息
   */
  closeAll() {
    ElMessage.closeAll();
  },
};

/**
 * 确认对话框
 * @param {string} content - 提示内容
 * @param {string} title - 标题
 * @param {string} confirmButtonText - 确认按钮文字
 * @param {string} cancelButtonText - 取消按钮文字
 * @param {string} type - 类型: warning / success / info / error
 */
export const confirm = (content, title = '提示', confirmButtonText = '确定', cancelButtonText = '取消', type = 'warning') => {
  return ElMessageBox.confirm(content, title, {
    confirmButtonText,
    cancelButtonText,
    type,
  });
};

/**
 * 提示框
 * @param {string} message - 消息内容
 * @param {string} title - 标题
 * @param {string} type - 类型: success / warning / info / error
 */
export const alert = (message, title = '提示', type = 'warning') => {
  return ElMessageBox.alert(message, title, { type });
};

/**
 * 通知提示
 */
export const notify = {
  /**
   * 成功通知
   * @param {string} title - 标题
   * @param {string} message - 消息内容
   * @param {number} duration - 持续时间(ms)
   */
  success(title, message, duration = 3000) {
    return ElNotification.success({ title, message, duration });
  },

  /**
   * 警告通知
   * @param {string} title - 标题
   * @param {string} message - 消息内容
   * @param {number} duration - 持续时间(ms)
   */
  warning(title, message, duration = 3000) {
    return ElNotification.warning({ title, message, duration });
  },

  /**
   * 错误通知
   * @param {string} title - 标题
   * @param {string} message - 消息内容
   * @param {number} duration - 持续时间(ms)
   */
  error(title, message, duration = 3000) {
    return ElNotification.error({ title, message, duration });
  },

  /**
   * 信息通知
   * @param {string} title - 标题
   * @param {string} message - 消息内容
   * @param {number} duration - 持续时间(ms)
   */
  info(title, message, duration = 3000) {
    return ElNotification.info({ title, message, duration });
  },
};

// 延时函数
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 加入日志
export const addLog = (message) => {
  wsStore.addLog(message);
};

/**
 * 日志工具
 * 用于在 LogPanel 中输出结构化日志
 */
export const logger = {
  /**
   * 信息日志
   * @param {...any} args - 日志消息，支持多个参数
   */
  info(...args) {
    const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');
    wsStore.addLog({ log: message, type: 'info' });
    console.info(...args);
  },

  /**
   * 成功日志
   * @param {...any} args - 日志消息，支持多个参数
   */
  success(...args) {
    const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');
    wsStore.addLog({ log: message, type: 'success' });
    console.log(`✓`, ...args);
  },

  /**
   * 警告日志
   * @param {...any} args - 日志消息，支持多个参数
   */
  warning(...args) {
    const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');
    wsStore.addLog({ log: message, type: 'warn' });
    console.warn(...args);
  },

  /**
   * 错误日志
   * @param {...any} args - 日志消息，支持多个参数
   */
  error(...args) {
    const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');
    wsStore.addLog({ log: message, type: 'error' });
    console.error(...args);
  },

  /**
   * 调试日志
   * @param {...any} args - 日志消息，支持多个参数
   */
  debug(...args) {
    const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');
    wsStore.addLog({ log: message, type: 'debug' });
    console.debug(...args);
  },

  /**
   * 原始日志
   * @param {string} message - 日志消息
   * @param {string} type - 日志类型
   */
  raw(message, type = 'log') {
    wsStore.addLog({ log: message, type });
  },
};
