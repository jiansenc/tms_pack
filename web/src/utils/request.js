import axios from "axios";
import { ElMessage } from "element-plus";

// 创建 axios 实例
const service = axios.create({
	// 开发环境使用环境变量配置的后端端口，生产环境使用相对路径
	baseURL: import.meta.env.VITE_API_BASE_URL,
	timeout: 15000, // 请求超时时间
	headers: {
		"Content-Type": "application/json;charset=UTF-8",
	},
});

// 请求拦截器
service.interceptors.request.use(
	(config) => {
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// 响应拦截器
service.interceptors.response.use(
	(response) => {
		const { data } = response;
		const res = data.data;
		return res;
	},
	(error) => {
		const { response } = error;
		ElMessage.error(response.data.message);
		return Promise.reject(response.data.message);
	}
);

export default service;
