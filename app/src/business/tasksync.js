import axios from 'axios'
import { createCallbackLogger } from '@/utils/logger.js';
const sessionContext = {
    "authorizationReason": "string",
    "channel": "string",
    "entityCode": 0,
    "ipAddress": "string",
    "localDateTimeText": "string",
    "locale": "string",
    "riskMessage": "string",
    "serviceCode": "string",
    "shopId": "string",
    "superUserId": "string",
    "tokenKey": "string",
    "transactionBranch": "string",
    "userId": "string",
    "userReferenceNumber": "string"
}

const page = {
    "count": 0,
    "limit": 0,
    "offset": 0,
    "orderBy": "",
    "pageNum": 0,
    "pageSize": 10,
    "returnCount": true
}

export async function syncTask(env, callback) {
  const logger = createCallbackLogger(callback);
  let baseUrl = null
  switch (env) {
    case 'dev':
      baseUrl = Bun.env.API_DEV_SHOP
      break
    case 'sit':
      baseUrl = Bun.env.API_SIT_SHOP
      break
    default:
      logger.error(`未知环境[${env}]..`);
      return false
  }
  logger.info(`正在执行task..`);
  const response = await axios.post(`${baseUrl}/shop/item/import/or/export/task/n`, {
    sessionContext
  })
  const { data } = response
  if (!data.transactionStatus.success) {
    logger.error(`task执行失败  ${JSON.stringify(data.transactionStatus)}`);
    return false
  }
  logger.success(`task执行完成,等待查询剩余任务..`);

  await new Promise(resolve => setTimeout(resolve, 2000));
  const list = await axios.post(`${baseUrl}/shop/download/center/list`, {
    sessionContext:Object.assign(sessionContext,{serviceCode:'SP436'}),
    page,
    taskStatus: 1
  })
  const { data: listData } = list
  if (listData.page.count > 0) {
    logger.info(`剩余任务[${listData.page.count}]个`);
  } else {
    logger.success(`任务已完成`);
  }
  return data.transactionStatus.success
}
