import type { IImage, IMusic } from '@/types/storeType'
import request from '../request'

/**
 * ==================== 音乐相关接口 ====================
 */

/**
 * 获取所有音乐
 */
export function api_getAllMusic() {
    return request<IMusic[]>({
        url: '/media/music',
        method: 'GET',
    })
}

/**
 * 根据ID获取音乐
 */
export function api_getMusicById(id: string) {
    return request<IMusic>({
        url: `/media/music/${id}`,
        method: 'GET',
    })
}

/**
 * 创建音乐
 */
export function api_createMusic(music: IMusic) {
    return request<IMusic>({
        url: '/media/music',
        method: 'POST',
        data: music,
    })
}

/**
 * 删除音乐
 */
export function api_deleteMusic(id: string) {
    return request<{ status: string, message: string }>({
        url: `/media/music/${id}`,
        method: 'DELETE',
    })
}

/**
 * 删除所有音乐
 */
export function api_deleteAllMusic() {
    return request<{ status: string, message: string }>({
        url: '/media/music',
        method: 'DELETE',
    })
}

/**
 * ==================== 图片相关接口 ====================
 */

/**
 * 获取所有图片
 */
export function api_getAllImages() {
    return request<IImage[]>({
        url: '/media/images',
        method: 'GET',
    })
}

/**
 * 根据ID获取图片
 */
export function api_getImageById(id: string) {
    return request<IImage>({
        url: `/media/images/${id}`,
        method: 'GET',
    })
}

/**
 * 创建图片
 */
export function api_createImage(image: IImage) {
    return request<IImage>({
        url: '/media/images',
        method: 'POST',
        data: image,
    })
}

/**
 * 删除图片
 */
export function api_deleteImage(id: string) {
    return request<{ status: string, message: string }>({
        url: `/media/images/${id}`,
        method: 'DELETE',
    })
}

/**
 * 删除所有图片
 */
export function api_deleteAllImages() {
    return request<{ status: string, message: string }>({
        url: '/media/images',
        method: 'DELETE',
    })
}

/**
 * 上传图片
 */
export async function api_uploadImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return request<{ url: string, filename: string, original_filename: string }>({
        url: '/media/upload',
        method: 'POST',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}
