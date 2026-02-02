import type { IUserUpload } from '@/types/storeType'
import request from '../request'

// 后端返回的数据格式（蛇形命名）
interface IUserUploadBackend {
    id: string
    device_fingerprint: string
    name: string
    department: string
    position: string
    photo: string
    create_time: string
    update_time: string
}

/**
 * 上传用户数据
 * @param userData 用户上传的数据
 * @returns 上传结果
 */
export function api_uploadUser(userData: IUserUpload) {
    // 将驼峰命名转换为蛇形命名，以匹配后端 API
    const snakeCaseData = {
        id: userData.id,
        device_fingerprint: userData.deviceFingerprint,
        name: userData.name,
        department: userData.department,
        position: userData.position,
        photo: userData.photo,
        create_time: userData.createTime,
        update_time: userData.updateTime,
    }
    return request<{ status: string, message: string }>({
        url: '/user-upload/',
        method: 'POST',
        data: snakeCaseData,
    })
}

/**
 * 根据设备指纹获取用户数据
 * @param deviceFingerprint 设备指纹
 * @returns 用户数据
 */
export function api_getUserByDevice(deviceFingerprint: string) {
    return request<IUserUploadBackend>({
        url: '/user-upload/device',
        method: 'GET',
        params: { device_fingerprint: deviceFingerprint },
    }).then((data) => {
        // 将后端返回的蛇形命名转换为驼峰命名
        return {
            id: data.id,
            deviceFingerprint: data.device_fingerprint,
            name: data.name,
            department: data.department,
            position: data.position,
            photo: data.photo,
            createTime: data.create_time,
            updateTime: data.update_time,
        }
    })
}

/**
 * 获取所有用户上传数据
 * @returns 所有用户数据列表
 */
export function api_getAllUsers() {
    return request<IUserUploadBackend[]>({
        url: '/user-upload/all',
        method: 'GET',
    }).then((data) => {
        // 将后端返回的蛇形命名转换为驼峰命名
        return data.map(item => ({
            id: item.id,
            deviceFingerprint: item.device_fingerprint,
            name: item.name,
            department: item.department,
            position: item.position,
            photo: item.photo,
            createTime: item.create_time,
            updateTime: item.update_time,
        }))
    })
}

/**
 * 删除用户数据
 * @param deviceFingerprint 设备指纹
 * @returns 删除结果
 */
export function api_deleteUser(deviceFingerprint: string) {
    return request<{ status: string, message: string }>({
        url: '/user-upload/',
        method: 'DELETE',
        params: { device_fingerprint: deviceFingerprint },
    })
}

/**
 * 删除所有用户上传数据
 * @returns 删除结果
 */
export function api_deleteAllUsers() {
    return request<{ status: string, message: string }>({
        url: '/user-upload/all',
        method: 'DELETE',
    })
}

/**
 * 上传图片
 * @param file 图片文件
 * @param maxWidth 最大宽度（默认800）
 * @param maxHeight 最大高度（默认800）
 * @param quality 图片质量（默认75）
 * @returns 上传结果，包含文件名
 */
export function api_uploadPhoto(file: File, maxWidth = 800, maxHeight = 800, quality = 75) {
    const formData = new FormData()
    formData.append('file', file)
    
    return request<{ status: string, filename: string, message: string }>({
        url: '/user-upload/upload-photo',
        method: 'POST',
        data: formData,
        params: { max_width: maxWidth, max_height: maxHeight, quality },
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}
