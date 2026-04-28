import request from '@/utils/request'

/**
 * GET 请求示例
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getUserList(params) {
  return request({
    url: '/users',
    method: 'get',
    params
  })
}

/**
 * POST 请求示例
 * @param {Object} data - 请求体数据
 * @returns {Promise}
 */
export function createUser(data) {
  return request({
    url: '/users',
    method: 'post',
    data
  })
}

/**
 * PUT 请求示例
 * @param {string|number} id - 资源 ID
 * @param {Object} data - 请求体数据
 * @returns {Promise}
 */
export function updateUser(id, data) {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data
  })
}

/**
 * DELETE 请求示例
 * @param {string|number} id - 资源 ID
 * @returns {Promise}
 */
export function deleteUser(id) {
  return request({
    url: `/users/${id}`,
    method: 'delete'
  })
}

/**
 * 文件上传示例
 * @param {FormData} formData - 包含文件的 FormData 对象
 * @returns {Promise}
 */
export function uploadFile(formData) {
  return request({
    url: '/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 文件下载示例
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function downloadFile(params) {
  return request({
    url: '/download',
    method: 'get',
    params,
    responseType: 'blob' // 重要：设置响应类型为 blob
  })
}

/**
 * 登录接口示例
 * @param {Object} data - 登录信息 { username, password }
 * @returns {Promise}
 */
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

/**
 * 获取用户信息示例
 * @returns {Promise}
 */
export function getUserInfo() {
  return request({
    url: '/auth/userinfo',
    method: 'get'
  })
}

/**
 * 退出登录示例
 * @returns {Promise}
 */
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}
