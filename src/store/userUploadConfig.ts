import type { IUserUpload } from '@/types/storeType'
import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as userUploadApi from '@/api/userUpload'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const useUserUploadConfig = defineStore('userUpload', () => {
    // state
    const userUploadConfig = ref({
        userUploadList: [] as IUserUpload[],
    })

    /**
     * 处理图片URL
     * 如果是文件名（不包含base64头），则添加完整URL路径
     */
    function processPhotoUrl(photo: string): string {
        if (!photo) {
            return ''
        }
        // 如果已经是base64格式，直接返回
        if (photo.startsWith('data:image/')) {
            return photo
        }
        // 否则认为是文件名，返回完整URL
        return `${API_BASE_URL}/uploads/${photo}`
    }

    // 初始化数据
    async function fetchAllUsers() {
        try {
            const users = await userUploadApi.api_getAllUsers()
            // 转换photo字段：如果是文件名（不包含base64头），则添加完整URL路径
            userUploadConfig.value.userUploadList = users.map(user => ({
                ...user,
                photo: processPhotoUrl(user.photo),
            }))
            return userUploadConfig.value.userUploadList
        }
        catch (error) {
            console.error('Failed to fetch users:', error)
            return []
        }
    }

    // 初始化时从后端加载数据
    fetchAllUsers()

    // getter
    const getUserUploadConfig = computed(() => userUploadConfig.value)
    const getAllUserUploadList = computed(() => userUploadConfig.value.userUploadList)

    // 根据设备指纹获取用户数据（改为普通方法，避免 computed 缓存问题）
    function getUserByDeviceFingerprint(deviceFingerprint: string) {
        return userUploadConfig.value.userUploadList.find(
            item => item.deviceFingerprint === deviceFingerprint,
        )
    }

    // action

    /**
     * 添加或更新用户上传数据
     * 如果设备指纹已存在，则更新数据；否则添加新数据
     */
    async function addOrUpdateUserUpload(userData: IUserUpload): Promise<boolean> {
        try {
            const existingIndex = userUploadConfig.value.userUploadList.findIndex(
                item => item.deviceFingerprint === userData.deviceFingerprint,
            )

            if (existingIndex !== -1) {
                // 更新现有数据
                const existingData = userUploadConfig.value.userUploadList[existingIndex]
                const updatedData = {
                    ...existingData,
                    name: userData.name,
                    department: userData.department,
                    position: userData.position,
                    photo: processPhotoUrl(userData.photo as string),
                    updateTime: dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                }
                // 更新内存中的数据
                userUploadConfig.value.userUploadList[existingIndex] = updatedData
                // 上传到后端
                await userUploadApi.api_uploadUser(userData)
            }
            else {
                // 添加新数据，将photo转换为完整URL（如果是base64则保持不变）
                const newUserData = {
                    ...userData,
                    photo: processPhotoUrl(userData.photo as string),
                }
                userUploadConfig.value.userUploadList.push(newUserData)
                // 上传到后端
                await userUploadApi.api_uploadUser(userData)
            }

            return true
        }
        catch (error) {
            console.error('添加或更新用户数据失败:', error)
            return false
        }
    }

    /**
     * 根据设备指纹删除用户数据
     */
    async function deleteUserByDeviceFingerprint(deviceFingerprint: string): Promise<boolean> {
        try {
            const index = userUploadConfig.value.userUploadList.findIndex(
                item => item.deviceFingerprint === deviceFingerprint,
            )

            if (index !== -1) {
                const userData = userUploadConfig.value.userUploadList[index]
                userUploadConfig.value.userUploadList.splice(index, 1)
                // 从后端删除
                await userUploadApi.api_deleteUser(deviceFingerprint)
                return true
            }

            return false
        }
        catch (error) {
            console.error('删除用户数据失败:', error)
            return false
        }
    }

    /**
     * 删除所有用户上传数据
     */
    async function deleteAllUserUpload(): Promise<boolean> {
        try {
            userUploadConfig.value.userUploadList = []
            // 从后端删除所有数据
            await userUploadApi.api_deleteAllUsers()
            return true
        }
        catch (error) {
            console.error('删除所有用户数据失败:', error)
            return false
        }
    }

    /**
     * 重置所有配置
     */
    async function reset(): Promise<boolean> {
        try {
            userUploadConfig.value = {
                userUploadList: [] as IUserUpload[],
            }
            // 从后端删除所有数据
            await userUploadApi.api_deleteAllUsers()
            return true
        }
        catch (error) {
            console.error('重置配置失败:', error)
            return false
        }
    }

    /**
     * 将用户上传数据转换为人员配置格式
     * 用于将上传的用户添加到抽奖名单中
     */
    function convertToPersonConfig(userUpload: IUserUpload): any {
        return {
            id: Date.now(), // 临时ID
            uid: '',
            uuid: userUpload.id,
            name: userUpload.name,
            department: userUpload.department,
            identity: userUpload.position,
            avatar: userUpload.photo as string,
            isWin: false,
            x: 0,
            y: 0,
            createTime: userUpload.createTime,
            updateTime: userUpload.updateTime,
            prizeName: [],
            prizeId: [],
            prizeTime: [],
        }
    }

    /**
     * 将所有用户上传数据转换为人员配置格式
     */
    function convertAllToPersonConfig(): any[] {
        return userUploadConfig.value.userUploadList.map(convertToPersonConfig)
    }

    return {
        userUploadConfig,
        getUserUploadConfig,
        getAllUserUploadList,
        getUserByDeviceFingerprint,
        addOrUpdateUserUpload,
        deleteUserByDeviceFingerprint,
        deleteAllUserUpload,
        reset,
        convertToPersonConfig,
        convertAllToPersonConfig,
        fetchAllUsers,
    }
})
