import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import openModal from '@/components/ErrorModal'

class Request {
    private static instance: Request | null = null
    private axiosInstance: AxiosInstance
    private pendingRequests = new Map<string, Promise<any>>()

    private constructor(config: AxiosRequestConfig) {
        this.axiosInstance = axios.create({
            baseURL: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'),
            timeout: 15000,
            ...config,
        })

        this.axiosInstance.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                return config
            },
            (error: any) => {
                return Promise.reject(error)
            },
        )

        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => {
                return response
            },
            (error: any) => {
                if (error.response && error.response.data) {
                    const { code, msg } = error.response.data
                    openModal({ title: code, desc: msg })
                    return Promise.reject(error.response.data)
                }
                openModal({ title: '请求错误', desc: error.message })
                return Promise.reject(error)
            },
        )
    }

    public static getInstance(config?: AxiosRequestConfig): Request {
        if (!Request.instance) {
            Request.instance = new Request(config || {})
        }
        return Request.instance
    }

    public async request<T>(config: AxiosRequestConfig, enableCache = false): Promise<T> {
        const cacheKey = this.getCacheKey(config)

        if (enableCache && this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey) as Promise<T>
        }

        const promise = this.axiosInstance.request(config).then(response => response.data)

        if (enableCache) {
            this.pendingRequests.set(cacheKey, promise)
        }

        try {
            return await promise
        }
        finally {
            if (enableCache) {
                setTimeout(() => {
                    this.pendingRequests.delete(cacheKey)
                }, 1000)
            }
        }
    }

    private getCacheKey(config: AxiosRequestConfig): string {
        return `${config.method || 'get'}_${config.url}_${JSON.stringify(config.params || {})}_${JSON.stringify(config.data || {})}`
    }
}

function request<T>(config: AxiosRequestConfig, enableCache = false): Promise<T> {
    const instance = Request.getInstance()
    return instance.request<T>(config, enableCache)
}

export default request
