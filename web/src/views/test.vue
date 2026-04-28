<!-- src/views/FaceAuth.vue -->
<template>
  <div class="face-auth-container">
    <h1>人脸核身（腾讯云慧眼）</h1>

    <div class="info-card">
      <p><strong>当前状态：</strong> {{ status }}</p>
      <p>姓名：{{ userInfo.name }}</p>
      <p>身份证：{{ userInfo.idCard }}</p>
    </div>

    <van-button type="primary" size="large" class="start-btn" :loading="isLoading" :disabled="isLoading || !!faceUrl"
      @click="startAuth">
      {{ isLoading ? '获取中...' : '开始人脸核身' }}
    </van-button>

    <van-button type="info" size="large" plain class="query-btn" :disabled="!canQuery" @click="queryResult">
      查询核身结果
    </van-button>

    <!-- 方式1：直接跳转（推荐） -->
    <!-- <a v-if="faceUrl" :href="faceUrl" target="_self" class="hidden-link">跳转刷脸</a> -->

    <!-- 方式2：iframe 内嵌（兼容性较差，仅作备选） -->
    <iframe v-if="showIframe" ref="faceIframe" :src="faceUrl" frameborder="0" class="face-iframe"></iframe>

    <div v-if="resultText" class="result-box">
      <pre>{{ resultText }}</pre>
    </div>

    <!-- 返回参数提示（开发调试用） -->
    <div v-if="returnParams" class="return-info">
      <p>检测到页面被刷脸页跳回</p>
      <p>查询参数：{{ returnParams }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { showToast } from 'vant'

// =============================================
//  ↓↓↓ 你需要修改的部分（真实项目中从 pinia / props 传入） ↓↓↓
// =============================================

const userInfo = ref({
  name: 'xxx',
  idCard: 'xxx'
})

// 后端接口地址（请替换成你自己的）
const BACKEND_API = 'https://your-domain.com/api/face-auth'

// =============================================
// ↑↑↑ 修改结束 ↑↑↑
// =============================================

const status = ref('未开始')
const isLoading = ref(false)
const faceUrl = ref('')
const showIframe = ref(false)
const canQuery = ref(false)
const resultText = ref('')
const returnParams = ref('')

const faceIframe = ref<HTMLIFrameElement | null>(null)

// 从 URL 获取跳回参数（推荐做法：redirectUrl 带上 ?from=faceback&token=xxx）
onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.has('from') && params.get('from') === 'faceback') {
    status.value = '人脸核身流程已完成（页面跳回）'
    canQuery.value = true
    returnParams.value = window.location.search
    showToast('检测到刷脸页返回，可查询结果')
  }
})

const startAuth = async () => {
  isLoading.value = true
  status.value = '正在请求刷脸链接...'

  try {
    const res = await fetch(BACKEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: userInfo.value.name,
        idCard: userInfo.value.idCard,
        // 建议带上当前页面完整路径 + query，便于跳回识别
        redirectUrl: `${window.location.origin}${window.location.pathname}?from=faceback`
        // 可选：orderId、userId、bizTag 等业务字段
      })
    })

    if (!res.ok) throw new Error('网络响应失败')

    const data = await res.json()

    if (data.code !== 0) {
      throw new Error(data.message || '获取刷脸链接失败')
    }

    faceUrl.value = data.data?.Url || ''

    if (!faceUrl.value) {
      throw new Error('未返回有效的刷脸URL')
    }

    status.value = '即将进入人脸核身页面'

    // 推荐方式：直接跳转（体验最佳）
    window.location.href = faceUrl.value

    // 如果业务不允许跳转，可使用 iframe（但摄像头兼容性较差）
    // showIframe.value = true
    // 如果需要延迟加载：nextTick(() => { if (faceIframe.value) faceIframe.value.src = faceUrl.value })

  } catch (err: any) {
    status.value = '获取失败'
    showToast(err.message || '请求出错，请稍后重试')
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

const queryResult = () => {
  // 实际项目中应调用后端接口查询腾讯云 GetDetectInfo
  // 这里仅做前端提示演示
  resultText.value = `模拟查询结果（真实项目请调用后端 /api/face-result 接口）：

{
  "Code": "0",
  "Message": "成功",
  "Result": "1",          // 1=通过，2=未通过，-1=未完成
  "Description": "人脸核验通过",
  "BestFrame": "base64或url...",
  "Similarity": 99.85,
  "BizToken": "从后端获取或url中带回"
}`

  showToast('已模拟查询结果，实际请调用后端接口')
}
</script>

<style scoped>
.face-auth-container {
  max-width: 640px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h1 {
  font-size: 24px;
  text-align: center;
  color: #333;
  margin-bottom: 24px;
}

.info-card {
  background: #f0f8ff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  line-height: 1.8;
}

.start-btn,
.query-btn {
  width: 100%;
  margin-bottom: 16px;
  border-radius: 8px;
}

.face-iframe {
  width: 100%;
  height: 620px;
  border: 1px solid #eee;
  border-radius: 12px;
  margin-top: 20px;
  display: block;
}

.result-box {
  margin-top: 24px;
  padding: 16px;
  background: #f8f8f8;
  border-radius: 8px;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-all;
}

.return-info {
  margin-top: 20px;
  padding: 12px;
  background: #e6f7ff;
  border-radius: 8px;
  color: #0050b3;
}
</style>