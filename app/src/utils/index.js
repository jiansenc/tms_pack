import data from '../../projects.toml';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import querystring from 'querystring';

// 1英文 2 中文,3泰文
export const language = {
  en: 1,
  zh: 2,
  th: 3,
  1: 'en',
  2: 'zh',
  3: 'th',
};
export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export function getProjectByUID(uid) {
  let project = data.projects.find((item) => item.uid === uid);
  return project;
}

export async function BaiduTranslate(textArr) {
  const salt = new Date().getTime();
  const query = textArr.map((i) => i).join('\n');
  const str1 = `${Bun.env.BAIDU_APP_APPID}${query}${salt}${Bun.env.BAIDU_SECRET_KEY}`;
  const sign = Bun.MD5.hash(str1, 'hex');

  const params = new URLSearchParams({
    q: query,
    appid: Bun.env.BAIDU_APP_APPID,
    salt,
    from: 'zh',
    to: 'en',
    sign,
  });
  const url = `${Bun.env.BAIDU_API_URL}?${params}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.trans_result || [];
}

export function cleanToEnglishSlug(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // 常见的英文停用词（可根据需要增删）
  const stopWords = new Set([
    'at',
    'the',
    'be',
    'this',
    'is',
    'for',
    'in',
    'by',
    'of',
    'a',
    'to',
    'of',
    'if',
    'are',
    'it',
    'with',
    'that',
    'as',
    'or',
    'on',
    'at',
    'but',
    'not',
    'and',
    'no',
    'be',
    'was',
    'have',
    'will',
    'just',
    'now',
    'can',
    'you',
    'our',
    'some',
    'over',
    'then',
    'there',
    'these',
    'what',
    'which',
    'who',
    'where',
    'when',
    'how',
    'why',
    'more',
    'most',
    'other',
    'some',
    'such',
    'only',
    'same',
    'do',
    'if',
    'and',
    '"',
  ]);

  // 1. 只保留英文字符、数字、下划线、空格、单引号
  let cleaned = text.replace(/[^a-zA-Z0-9\s_']/g, '');

  // 2. 空格、单引号等分隔符 → 下划线
  cleaned = cleaned.replace(/[\s']+/g, '_');

  // 3. 连续下划线合并 + 去首尾下划线
  cleaned = cleaned.replace(/_+/g, '_').replace(/^_+|_+$/g, '');

  // 4. 转小写 & 按下划线拆成单词数组
  const words = cleaned.toLowerCase().split('_');

  // 5. 过滤掉停用词 & 空字符串
  const filtered = words.filter((word) => word.length > 0 && !stopWords.has(word));

  // 6. 重新用下划线连接
  let result = filtered.join('_');

  // 7. 如果结果长度 > 20，则截取前20字符 + 当前时间戳（毫秒）
  if (result.length > 30) {
    const timestamp = Date.now();
    // 尽量保持最后一个完整的单词边界，但这里简单截取前20
    result = result.slice(0, 30) + '_' + timestamp;
  }

  return result;
}

// 向ws发送日志
export function sendLog(ws, log, type = 'info') {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

  let logData;
  if (typeof log === 'string') {
    logData = { log, type, time };
  } else if (typeof log === 'object' && log !== null) {
    logData = { ...log, time: log.time || time, type: log.type || type };
  } else {
    logData = { log: String(log), type, time };
  }

  ws.send(JSON.stringify(logData));
}

export async function getTMSSessionID() {
  const formData = new URLSearchParams();
  formData.append('username', Bun.env.TMS_USER); // 或 email
  formData.append('password', Bun.env.TMS_PASSWORD);
  const response = await fetch(`${Bun.env.TMS_URL}/admin/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(), // 或者直接传 formData 对象（Bun 支持）
    redirect: 'manual',
  });

  const setCookieHeaders = response.headers.getSetCookie()[0]; // string[]
  return setCookieHeaders.split(';')[0];
}
