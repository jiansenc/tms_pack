import { getTMSSessionID, getProjectByUID, language } from '@/utils/index.js';
import { createCallbackLogger } from '@/utils/logger.js';

let JSESSIONID = '';

/**
 * Download language package from TMS
 * @param {Object} project - Project configuration
 * @param {number} languageId - Language ID
 * @returns {Promise<Object>} Response from TMS API
 */
async function downloadLanguage(project, languageId) {
  const params = new URLSearchParams();
  params.append('projectId', project.projectId);
  params.append('languageId', languageId);
  params.append('type', '1');

  const response = await fetch(`${Bun.env.TMS_URL}/admin/import/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      cookie: JSESSIONID,
    },
    body: params.toString(),
  });
  const data = await response.json();
  return data;
}

/**
 * Synchronize language packages
 * @param {string} projectId - Project UID
 * @param {Function} callback - Callback function for WebSocket communication
 */
export default async function asyncLanguage(projectId, options, callback) {
  // Create logger with callback
  const logger = createCallbackLogger(callback);

  try {
    const project = getProjectByUID(projectId);
    logger.debug('连接 TMS 服务器');

    JSESSIONID = await getTMSSessionID();
    let languages = [
      { id: language.zh, name: 'Chinese', path: project.language_zh_path[0] },
      { id: language.en, name: 'English', path: project.language_en_path },
      { id: language.th, name: 'Thai', path: project.language_th_path },
    ];
    if (options.useLanguage === '1') {
      languages = languages.filter((item) => item.id !== 2);
    }

    let successCount = 0;
    let failCount = 0;

    for (const lang of languages) {
      logger.info(`开始处理 ${lang.name} 语言包 (ID: ${lang.name})`);
      try {
        let result = await downloadLanguage(project, lang.id);
        if (result.success) {
          const filePath = lang.path;
          const file = Bun.file(`${project.path}${filePath}`);
          let json = JSON.parse(result.data);
          const keyCount = Object.keys(json).length;
          await file.write(project.tms_content.replace('__TMS_CONTENT__', JSON.stringify(json, null, 2)));
          logger.success(`完成 ${lang.name} 翻译更新`);
          successCount++;
        } else {
          callback({
            log: `下载 ${lang.name} 语言包失败:${result}`,
            status: 'error',
          });
          failCount++;
        }
      } catch (error) {
        logger.error(`${lang.name} 语言包处理出错:`, error.message);
        logger.debug(error.stack);
        failCount++;
      }
    }

    // Summary
    logger.section('语言包同步完成');
    logger.info(`成功: ${successCount}, 失败: ${failCount}`);

    callback({
      log: `完成所有语言包下载和翻译更新`,
      status: 'success',
    });
    if (failCount > 0) {
      logger.warning(`有 ${failCount} 个语言包同步失败`);
    }
  } catch (error) {
    logger.error('语言同步过程出错:', error.message);
    logger.error(error.stack);
    callback({
      log: '同步失败: ' + error.message,
      loading: false,
      done: true,
      status: 'error',
      type: 'error',
    });
  }
}
