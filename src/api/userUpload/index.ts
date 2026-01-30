import request from '../request'
import type { IUserUpload } from '@/types/storeType'

/**
 * 上传用户数据
 * @param userData 用户上传的数据
 * @returns 上传结果
 */
export function api_uploadUser(userData: IUserUpload) {
  return request<{ status: string; message: string }>({
    url: '/user-upload',
    method: 'POST',
    data: userData,
  })
}

/**
 * 根据设备指纹获取用户数据
 * @param deviceFingerprint 设备指纹
 * @returns 用户数据
 */
export function api_getUserByDevice(deviceFingerprint: string) {
  return request<IUserUpload | null>({
    url: '/user-upload/device',
    method: 'GET',
    params: { deviceFingerprint },
  })
}

/**
 * 获取所有用户上传数据
 * @returns 所有用户数据列表
 */
export function api_getAllUsers() {
  return request<IUserUpload[]>({
    url: '/user-upload/all',
    method: 'GET',
  })
}

/**
 * 删除用户数据
 * @param deviceFingerprint 设备指纹
 * @returns 删除结果
 */
export function api_deleteUser(deviceFingerprint: string) {
  return request<{ status: string; message: string }>({
    url: '/user-upload',
    method: 'DELETE',
    params: { deviceFingerprint },
  })
}
