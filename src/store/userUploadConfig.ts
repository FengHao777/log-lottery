import type { IUserUpload } from '@/types/storeType'
import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { computed, ref, toRaw } from 'vue'
import { IndexDb } from '@/utils/dexie'

export const useUserUploadConfig = defineStore('userUpload', () => {
  const userUploadDb = new IndexDb('userUpload', ['userUploadList'], 1, ['createTime'])

  // state
  const userUploadConfig = ref({
    userUploadList: [] as IUserUpload[],
  })

  // 初始化数据
  userUploadDb.getAllData('userUploadList').then((data) => {
    userUploadConfig.value.userUploadList = data
  })

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
          photo: userData.photo,
          updateTime: dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        }
        // 更新内存中的数据
        userUploadConfig.value.userUploadList[existingIndex] = updatedData
        // 更新 IndexedDB 中的数据（使用 JSON 深拷贝，避免响应式问题）
        await userUploadDb.updateData('userUploadList', JSON.parse(JSON.stringify(updatedData)))
      }
      else {
        // 添加新数据
        userUploadConfig.value.userUploadList.push(userData)
        await userUploadDb.setData('userUploadList', userData)
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
        await userUploadDb.deleteData('userUploadList', userData)
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
      await userUploadDb.deleteAll('userUploadList')
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
      await userUploadDb.deleteAll('userUploadList')
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
      identity: '',
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
  }
})
