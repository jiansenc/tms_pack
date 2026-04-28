import { getProjectByUID, BaiduTranslate, cleanToEnglishSlug, escapeRegExp } from '@/utils/index.js';
import { createCallbackLogger } from '@/utils/logger.js';
import { join } from 'path';
import { Glob } from 'bun';
import { normalize } from 'node:path';

let tmsPrefix = 'tms';

async function tran({ uid }, callback) {
  // Create logger with callback
  const logger = createCallbackLogger(callback);

  const JOB = getProjectByUID(uid);
  tmsPrefix = JOB.prefix;

  let tmsContent = {};

  for (let i = 0; i < JOB.language_zh_path.length; i++) {
    const path = JOB.language_zh_path[i];
    const url = `${JOB.path}${path}`;
    const suffix = url.substring(url.lastIndexOf('.') + 1);
    const file = Bun.file(url);
    const writePath = join(import.meta.dirname, `../tms/${JOB.uid}_tms_${i}.${suffix}`);
    await Bun.write(writePath, file);

    let tms = await import(writePath);
    const keyCount = Object.keys(tms.default).length;
    tmsContent = { ...tmsContent, ...tms.default };
  }
  // 2.扫描项目文件
  logger.section(`开始扫描翻译项目 ${JOB.uid}`);

  const glob = new Glob(`${JOB.path}${JOB.glob}`);
  const translationList = [];
  let processedFiles = 0;
  let totalTranslations = 0;

  // 同步遍历（适合脚本、小项目）
  for (const fileUrl of glob.scanSync('.')) {
    let content = await Bun.file(fileUrl).text();
    let arr = extractChineseFrom(content);

    if (arr.length) {
      processedFiles++;
      totalTranslations += arr.length;
      for (let i = 0; i < arr.length; i++) {
        let key = arr[i];
        let obj = {
          processed: false, // 是否已经处理
          path: normalize(fileUrl),
          key: key, // key 是原文key
          uid: `uid_${Bun.MD5.hash(key, 'hex')}`,
        };
        const escapedKey = escapeRegExp(key);
        const regex = new RegExp(`(\\$t\\(['"])(?:${escapedKey})(['"]\\))`, 'g');
        // 判断是否存在已翻译的Key
        let find = findPathToValue(tmsContent, key);
        if (find) {
          content = content.replace(regex, `$1${find}$2`);
        } else {
          translationList.push(obj);
          content = content.replace(regex, `$1${obj.uid}$2`);
        }
        await Bun.write(obj.path, content);
      }
    }
  }

  // 3.百度翻译
  let translation = translationList.map((item) => item.key);
  // 去重
  translation = [...new Set(translation)];

  logger.info(`扫描完成: 处理 ${processedFiles} 个文件，共 ${translation.length} 个翻译文本`);
  if (translation.length > 0) {
    try {
      logger.info(`正在调用百度翻译API`);
      const baiduResult = await BaiduTranslate(translation);
      const jsonData = {};
      baiduResult.map((item) => {
        let tempkey = cleanToEnglishSlug(item.dst);
        // 如果已经存在的key 会加上时间戳，避免重复的key
        item.key = is_attribute_exists(tmsContent, tempkey);
        item.usekey = item.key;
        item.uid = `uid_${Bun.MD5.hash(item.src, 'hex')}`;
        if (JOB.prefix) {
          item.usekey = `${JOB.prefix}.${item.key}`;
        }
      });

      const translationMap = new Map();
      baiduResult.forEach((item) => {
        translationMap.set(item.uid, item);
      });
      // 写入Tms
      let writeCount = 0;
      for (translation of translationList) {
        let fileContent = await Bun.file(translation.path).text();
        let find = translationMap.get(translation.uid);

        if (find) {
          const relativePath = translation.path.replace(/\\/g, '/');
          logger.info(`写入文件: ${relativePath}`);
          fileContent = fileContent.replace(new RegExp(translation.uid, 'g'), find.usekey);
          jsonData[find.key] = repSymbol(translation.key);
          writeCount++;
        }
        await Bun.write(translation.path, fileContent);
      }
      await writeTmsFile(JOB, jsonData);
      logger.info(`扫描翻译完成, 总处理数: ${translationList.length}, 新增翻译: ${Object.keys(jsonData).length}`);
      callback({ json: jsonData, status: 'success' });
    } catch (error) {
      logger.error('翻译过程出错:', error.message);
      callback({ log: '翻译失败: ' + error.message, status: 'error' });
    }
  } else {
    logger.info('没有需要翻译的内容');
    callback({ status: 'success' });
  }
}

function removeSymbols(str) {
  return str.replace(/[^\u4e00-\u9fff]/g, '');
}

// 匹配中文
function extractChineseFrom(text) {
  const results = new Set();

  // 正则核心：
  // \$[^(\s]*t\s*  → 匹配 $xxx t  （允许 $this.$t $app.$t 等）
  // \(\s*         → 括号后空格
  // (['"])        → 引号
  // ([\s\S]*?)    → 内容（非贪婪）
  // \1\s*\)       → 对应引号 + 右括号
  const regex = /\$[^(\s]*t\s*\(\s*(['"])([\s\S]*?)\1\s*\)/gi;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const content = match[2].trim(); // 引号里面的内容
    // 基本过滤：必须有中文，且内容不为空
    if (!content || !/[\u4e00-\u9fff]/.test(content)) {
      continue;
    }
    // 强过滤：排除明显不是静态 key 的情况
    if (
      content.includes('\n') || // 包含换行（多行字符串很少是 key）
      content.includes('\r')
    ) {
      continue;
    }

    results.add(content);
  }

  return Array.from(results).sort();
}

/**
 * 在对象中查找指定值的路径
 * @param {Object} obj - 要搜索的对象
 * @param {*} targetValue - 要查找的目标值
 * @returns {string|null} 找到的路径（例如 "a.b.c"），没找到返回 null
 */
function findPathToValue(obj, targetValue, currentPath = []) {
  // 如果当前是基本类型或 null，直接比较
  if (obj === null || typeof obj !== 'object') {
    if (obj === targetValue) {
      let path = currentPath.join('.');
      if (path.indexOf('.') === -1) {
        return `${tmsPrefix}.${path}`;
      } else {
        return path;
      }
    } else {
      return null;
    }
  }

  // 遍历对象的所有键
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newPath = [...currentPath, key];
      const result = findPathToValue(obj[key], targetValue, newPath);

      if (result !== null) {
        return result;
      }
    }
  }

  return null;
}

// 判断key 是否存在

function is_attribute_exists(obj, key) {
  if (typeof obj.tms === 'object') {
    if (obj.tms[key] !== undefined) {
      return `${key}_${new Date().getTime()}`;
    } else {
      return key;
    }
  } else {
    return obj[key] !== undefined ? `${key}_${new Date().getTime()}` : key;
  }
}

function repSymbol(str) {
  return str.replace(/\"/g, '');
}

// 写到TMS ZH 文件
async function writeTmsFile(JOB, jsonData) {
  const tmsPath = `${JOB.path}${JOB.language_zh_path[JOB.language_zh_path.length - 1]}`;
  const is_json = tmsPath.substring(tmsPath.lastIndexOf('.') + 1) === 'json';
  let chatF = is_json ? '"' : '';
  let str = '';
  for (let key in jsonData) {
    str += `${chatF}${key}${chatF}:"${jsonData[key]}",\n`;
  }
  str = str.substring(0, str.length - 2);

  // 查找最后一行
  let content = await Bun.file(tmsPath).text();
  const lines = content.split('\n');

  for (let i = lines.length - 1; i >= 0; i--) {
    // 检查该行是否包含中文字符
    if (/[\u4e00-\u9fa5]/.test(lines[i])) {
      let line = lines[i].trim().replace(/\s/, '');
      let hasDouhao = line.charAt(line.length - 1) === ',';
      content = content.replace(lines[i], lines[i].trim() + (!hasDouhao ? ',\n' : '') + str);
      await Bun.write(tmsPath, content);
      return;
    }
  }

  // 如果没找到中文行，直接追加到末尾
  await Bun.write(tmsPath, content + '\n' + str);
}

export default tran;
