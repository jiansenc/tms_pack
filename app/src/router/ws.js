import { Elysia } from 'elysia';
import scanTranslation from '@/business/scanTranslation.js';
import packaged from '@/business/packaged.js';
import asyncLanguage from '@/business/asyncLanguage.js';
import { createWSLogger } from '@/utils/logger.js';
import { syncTask } from '@/business/tasksync.js';


const app = new Elysia();

app.ws('/chat', {
  open(ws) {
    console.log('[WebSocket] 新客户端连接', ws.id);
    const logger = createWSLogger(ws);
    logger.info('WebSocket 连接已建立');
  },

  close(ws) {
    console.log('[WebSocket] 客户端断开连接', ws.id);
  },

  message(ws, message) {
    console.log('[WebSocket] 收到消息:', message.type);
    const logger = createWSLogger(ws);

    try {
      switch (message.type) {
        case 'scanTranslation': // 扫描翻译
          scanTranslation({ uid: message.projectId }, (logData) => {
            logData.subscription = message.type;
            ws.send(JSON.stringify(logData));
          });
          break;
        case 'packaged': // 打包
          packaged(message, (logData) => {
            logData.subscription = message.type;
            ws.send(JSON.stringify(logData));
          });
          break;
        case 'asyncLanguage': // 同步语言
          asyncLanguage(message.projectId, message, (logData) => {
            logData.subscription = message.type;
            ws.send(JSON.stringify(logData));
          });
          break;
        case 'task-sync': // 任务同步
          syncTask(message.env, (logData) => {
            logData.subscription = message.type;
            ws.send(JSON.stringify(logData));
          })
          break;

        default:
          logger.warning(`未知的消息类型: ${message.type}`);
          logger.debug('消息内容:', message);
          ws.send(
            JSON.stringify({
              type: 'error',
              log: `未知的消息类型: ${message.type}`,
            }),
          );
      }
    } catch (error) {
      logger.error('处理消息时出错:', error.message);
      logger.debug('错误堆栈:', error.stack);

      try {
        ws.send(
          JSON.stringify({
            type: 'error',
            log: `处理消息失败: ${error.message}`,
            error: error.message,
          }),
        );
      } catch (e) {
        console.error('[WebSocket] 发送错误响应失败:', e);
      }
    }
  },

  error(ws, error) {
    console.error('[WebSocket] 错误:', error);

    try {
      ws.send(
        JSON.stringify({
          type: 'error',
          log: `WebSocket 错误: ${error.message}`,
        }),
      );
    } catch (e) {
      console.error('[WebSocket] 发送错误通知失败:', e);
    }
  },
});

export default app;
