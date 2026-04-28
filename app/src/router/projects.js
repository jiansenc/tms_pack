import { Elysia } from 'elysia';
import data from '../../projects.toml';
import { success, fail } from '@/utils/response.js';
import { mkdir, readdir, rm } from 'node:fs/promises';
import { getTMSSessionID, getProjectByUID, language } from '@/utils/index.js';
import { Glob } from 'bun';
import { join } from 'path';

import workers from '@/utils/workers.js';
const wk = workers();
import axios from 'axios';
const app = new Elysia({
  prefix: '/api'
});

app.get('/projects', async (ctx) => {
  return success(ctx, data);
});

app.get('/explorerPackDir', async (ctx) => {
  try {
    let dir = new Date().toLocaleDateString('en-CA').split('-').join('');
    const basePath = `xxx`;
    const nowPath = `=${basePath}\\${dir}`;
    const file = Bun.file(nowPath);
    if (!(await file.exists())) {
      await mkdir(basePath, { recursive: true });
    }
    const entries = await readdir(basePath, {
      withFileTypes: true,
    });

    // 只想要文件夹（目录）
    const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    for (const directory of directories) {
      if (Number(dir) - Number(directory) > 3) {
        await rm(join(basePath, directory), { recursive: true });
      }
    }
    Bun.spawn(['explorer.exe', nowPath]);
    return success(ctx, 'ok');
  } catch (error) {
    console.error(error);
    return fail(ctx, error);
  }
});

app.get('/getAccessToken', async (ctx) => {
  const params = new URLSearchParams();
  const appId = 'xxx';
  const userId = Bun.randomUUIDv7().replace(/-/g, '');
  console.log(userId);
  params.append('grant_type', 'client_credential');
  params.append('appId', appId);
  params.append('secret', 'xxx');
  params.append('version', '1.0.0');
  const url = 'https://kyc1.qcloud.com/api/oauth2/access_token?' + params.toString();
  const response = await axios.get(url);
  console.log(response.data);
  const ticket = await getTicket(appId, response.data.access_token, userId);
  const face = await getAdvFaceId(appId, userId);
  return ticket;
});

async function getTicket(appId, access_token, userId) {
  const params = new URLSearchParams();
  params.append('appId', appId);
  params.append('access_token', access_token);
  params.append('version', '1.0.0');
  params.append('type', 'NONCE');
  params.append('user_id', userId);
  const url = 'https://kyc1.qcloud.com/api/oauth2/api_ticket?' + params.toString();
  const response = await axios.get(url);
  console.log(response.data);
  return response.data.tickets[0];
}

async function getAdvFaceId(appId, userId) {
  const params = new URLSearchParams();
  params.append('appId', appId);
  params.append('orderNo', Bun.randomUUIDv7().replace(/-/g, ''));
  params.append('userId', userId);
  params.append('version', '1.0.0');
  params.append('type', 'NONCE');
  params.append('nonce', Bun.randomUUIDv7().replace(/-/g, ''));
  const url = 'https://kyc1.qcloud.com/api/oauth2/api_ticket?' + params.toString();
  const response = await axios.get(url);
  console.log(response.data);
  return response.data.tickets[0];
}

app.put('/tms', async (ctx) => {
  const { lang, json, projectId } = ctx.body;

  const JSESSIONID = await getTMSSessionID();

  // 使用 URLSearchParams 创建 application/x-www-form-urlencoded 格式
  const params = new URLSearchParams();
  let label = new Date().toISOString().split('T')[0].split('-').splice(0, 2).join('_');
  params.append('projectId', projectId);
  params.append('languageId', lang); // 1英文 2 中文,3泰文
  params.append('type', '1');
  params.append('labels', label);
  params.append('observers', 'super,tent,xxx');
  params.append('baseURL', Bun.env.TMS_URL + '/');
  params.append('content', JSON.stringify(json));

  const response = await fetch(`${Bun.env.TMS_URL}/admin/import/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      cookie: JSESSIONID,
    },
    body: params.toString(),
  });
  const data = await response.json();
  if (data.success) {
    return success(ctx, data.data);
  } else {
    return fail(ctx, `上传失败: ${data.msgs[0]}`, 403);
  }
});

app.get('/wk', async (ctx) => {
  const arr = wk.getWorkers();
  return success(ctx, arr);
});

// 获取项目信息
app.get('/project/info/:uid', async (ctx) => {
  const { uid } = ctx.params;
  let project = data.projects.find((item) => item.uid === uid);

  let result = {
    ...project,
  };
  const file = Bun.file(`${project.path}/.git/HEAD`);
  const text = await file.text();
  result.curBranch = text.replace('ref: refs/heads/', '').trim();

  // 查询打包命令
  const packageFile = Bun.file(`${project.path}/package.json`);
  const packageText = await packageFile.text();
  const packageJson = JSON.parse(packageText);

  // 去掉多余的打包命令,只留 build 相关
  let buildCommand = [];
  let buildkey = project.buildkey || ['build'];
  for (const key in packageJson.scripts) {
    if (buildkey.some((prefix) => key.startsWith(prefix))) {
      buildCommand.push({
        loading: false,
        env: setEnv(key),
        command: key,
        script: packageJson.scripts[key],
      });
    }
  }
  result.buildCommand = buildCommand;
  return success(ctx, result);
});

function setEnv(str) {
  if (str.indexOf('dev') >= 0) {
    return 'dev';
  }
  if (str.indexOf('sit') >= 0) {
    return 'sit';
  }
  if (str.indexOf('beta') >= 0) {
    return 'beta';
  }
  if (str.indexOf('prod') >= 0) {
    return 'prod';
  }
  return str;
}
export default app;
