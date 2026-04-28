import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useWebSocketStore = defineStore('websocket', () => {
  // WebSocket 实例
  const ws = ref(null);
  // 连接状态
  const isConnected = ref(false);
  // 错误信息
  const error = ref(null);

  const subscriptions = new Map();

  // WebSocket 服务器地址
  const WS_URL = import.meta.env.VITE_WS_URI;

  const logEvent = ref([]);

  // 重连相关状态
  const reconnectAttempts = ref(0);
  const maxReconnectAttempts = ref(5); // 最大重连次数
  const reconnectDelay = ref(1000); // 初始重连延迟 1 秒
  const autoReconnect = ref(true); // 是否启用自动重连
  const isReconnecting = ref(false); // 是否正在重连
  let reconnectTimer = null;

  // 连接 WebSocket
  const connect = () => {
    if (ws.value && (ws.value.readyState === WebSocket.CONNECTING || ws.value.readyState === WebSocket.OPEN)) {
      console.log('WebSocket 已连接或正在连接');
      return;
    }

    // 启用自动重连
    autoReconnect.value = true;
    // 重置重连尝试次数
    reconnectAttempts.value = 0;
    reconnectDelay.value = 1000;

    ws.value = new WebSocket(WS_URL);

    ws.value.onopen = () => {
      console.log('WebSocket 连接成功');
      isConnected.value = true;
      isReconnecting.value = false;
      error.value = null;
      // 重置重连延迟
      reconnectDelay.value = 1000;
    };

    ws.value.onerror = (err) => {
      console.error('WebSocket 错误:', err);
      error.value = '连接错误';
    };

    ws.value.onclose = () => {
      console.log('WebSocket 连接关闭');
      isConnected.value = false;
      ws.value = null;

      // 如果启用自动重连，则尝试重连
      if (autoReconnect.value) {
        attemptReconnect();
      }
    };

    ws.value.onmessage = (event) => {
      const message = JSON.parse(event.data);
      addLog(message);
      if (subscriptions.get(message.subscription)) {
        subscriptions.get(message.subscription)(message);
      }
    };
  };

  // 断开连接
  const disconnect = () => {
    // 禁用自动重连（用户主动断开）
    autoReconnect.value = false;

    // 清除重连定时器
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    isReconnecting.value = false;

    if (ws.value) {
      ws.value.close();
      ws.value = null;
    }
  };

  const subscription = (type, callback) => {
    subscriptions.set(type, callback);
  };

  // 发送消息
  const send = (message) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(message));
    } else {
      console.error('WebSocket 未连接，无法发送消息');
      error.value = '未连接到服务器';
    }
  };

  const addLog = (message) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

    // 如果传入的是带 log 属性的对象，直接添加并添加时间戳
    if (message && typeof message === 'object' && message.log) {
      logEvent.value.push({
        ...message,
        time,
      });
    } else if (typeof message === 'string') {
      // 如果传入的是字符串，包装成对象格式并添加时间戳
      logEvent.value.push({
        log: message,
        type: 'log',
        time,
      });
    }
  };

  // 尝试重连（内部使用）
  const attemptReconnect = () => {
    // 检查是否超过最大重连次数
    if (reconnectAttempts.value >= maxReconnectAttempts.value) {
      console.log(`已达到最大重连次数 (${maxReconnectAttempts.value})，停止重连`);
      isReconnecting.value = false;
      error.value = '连接已断开，请手动重连';
      return;
    }

    isReconnecting.value = true;
    reconnectAttempts.value++;
    console.log(`正在尝试第 ${reconnectAttempts.value} 次重连，延迟 ${reconnectDelay.value}ms...`);

    reconnectTimer = setTimeout(() => {
      connect();
      // 使用指数退避策略增加重连延迟（最大不超过 30 秒）
      reconnectDelay.value = Math.min(reconnectDelay.value * 2, 30000);
    }, reconnectDelay.value);
  };

  // 手动重连
  const reconnect = () => {
    disconnect();
    // 清除之前的重连定时器
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    // 重置重连状态
    reconnectAttempts.value = 0;
    reconnectDelay.value = 1000;
    // 延迟 1 秒后重连
    reconnectTimer = setTimeout(() => {
      connect();
    }, 1000);
  };

  // 组件卸载时自动断开连接
  const cleanup = () => {
    // 禁用自动重连
    autoReconnect.value = false;
    disconnect();
  };

  return {
    logEvent,
    addLog,
    ws,
    isConnected,
    isReconnecting,
    error,
    reconnectAttempts,
    maxReconnectAttempts,
    subscription,
    connect,
    disconnect,
    send,
    reconnect,
    cleanup,
  };
});
