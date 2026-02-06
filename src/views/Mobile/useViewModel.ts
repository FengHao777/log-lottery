import type { IDepartment, IPersonConfig } from '@/types/storeType'
import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification'
import { api_uploadImage } from '@/api/media'
import * as personApi from '@/api/persons'
import { useDepartmentConfig } from '@/store/departmentConfig'
import { getDeviceFingerprint } from '@/utils/deviceFingerprint'
import { generateThumbnail } from '@/utils/index'

export function useViewModel() {
    const toast = useToast()
    const router = useRouter()
    const departmentStore = useDepartmentConfig()

    // 表单数据
    const userName = ref('')
    const userDepartment = ref('')
    const userPosition = ref('')
    const userPhoto = ref<File | null>(null)
    const photoPreview = ref<string>('')
    const thumbnailPreview = ref<string>('')
    const isUploading = ref(false)
    const deviceFingerprint = ref('')
    const avatarUrl = ref<string>('') // 存储上传后的头像URL

    // 部门列表
    const departmentList = ref<IDepartment[]>([])

    // 获取设备指纹
    async function initDeviceFingerprint() {
        try {
            deviceFingerprint.value = await getDeviceFingerprint()
            // 检查是否已有上传记录
            const existingUser = await personApi.api_getPersonByDeviceFingerprint(deviceFingerprint.value)
            if (existingUser) {
                userName.value = existingUser.name
                userDepartment.value = existingUser.department || ''
                userPosition.value = existingUser.position || ''
                // 使用URL作为头像和缩略图
                avatarUrl.value = existingUser.avatar
                photoPreview.value = existingUser.avatar
                // 优先使用缩略图URL，如果没有则使用头像URL
                thumbnailPreview.value = existingUser.thumbnailAvatar || existingUser.avatar
            }
        }
        catch (error: any) {
            // 404表示用户不存在，这是正常情况，不需要报错
            if (error?.detail === 'Person not found' || error?.response?.status === 404) {
                return
            }
            console.error('获取设备指纹失败:', error)
            toast.open({
                message: '获取设备信息失败，请刷新重试',
                type: 'error',
                position: 'top-right',
            })
        }
    }

    // 获取部门列表
    async function fetchDepartments() {
        try {
            await departmentStore.fetchAllDepartments()
            departmentList.value = [...departmentStore.departmentList]
        }
        catch (error) {
            console.error('获取部门列表失败:', error)
        }
    }

    // 初始化时加载部门列表
    fetchDepartments()

    /**
     * 处理照片选择
     */
    async function handlePhotoSelect(event: Event) {
        const target = event.target as HTMLInputElement
        const file = target.files?.[0]

        if (!file)
            return

        // 验证文件类型
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            toast.open({
                message: '仅支持 JPG、PNG、WebP 格式的图片',
                type: 'warning',
                position: 'top-right',
            })
            return
        }

        // 验证文件大小（5MB）
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            toast.open({
                message: '图片大小不能超过 5MB',
                type: 'warning',
                position: 'top-right',
            })
            return
        }

        // 验证图片尺寸（建议竖版）
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
            URL.revokeObjectURL(url)
            const width = img.width
            const height = img.height
            if (width > height) {
                toast.open({
                    message: '建议上传竖版图片（高度大于宽度）',
                    type: 'info',
                    position: 'top-right',
                })
            }
        }
        img.src = url

        userPhoto.value = file

        // 创建预览
        const reader = new FileReader()
        reader.onload = async (e) => {
            photoPreview.value = e.target?.result as string
            // 上传原始图片和缩略图到服务器
            try {
                // 上传原始图片
                const originalUploadResult = await api_uploadImage(file)
                avatarUrl.value = originalUploadResult.url
                photoPreview.value = originalUploadResult.url

                // 生成并上传缩略图
                const thumbnailFile = await generateThumbnail(file, 140, 0.6)
                const thumbnailUploadResult = await api_uploadImage(thumbnailFile)
                thumbnailPreview.value = thumbnailUploadResult.thumbnail_url || thumbnailUploadResult.url
            }
            catch (error) {
                console.error('上传图片失败:', error)
                toast.open({
                    message: '上传图片失败，请重试',
                    type: 'error',
                    position: 'top-right',
                })
                photoPreview.value = e.target?.result as string
                thumbnailPreview.value = e.target?.result as string
            }
        }
        reader.readAsDataURL(file)
    }

    /**
     * 移除照片
     */
    function removePhoto() {
        userPhoto.value = null
        photoPreview.value = ''
        thumbnailPreview.value = ''
    }

    /**
     * 提交表单
     */
    async function handleSubmit() {
    // 验证姓名
        if (!userName.value.trim()) {
            toast.open({
                message: '请输入姓名',
                type: 'warning',
                position: 'top-right',
            })
            return
        }

        // 验证部门
        if (!userDepartment.value.trim()) {
            toast.open({
                message: '请输入部门',
                type: 'warning',
                position: 'top-right',
            })
            return
        }

        // 验证岗位
        if (!userPosition.value.trim()) {
            toast.open({
                message: '请输入岗位',
                type: 'warning',
                position: 'top-right',
            })
            return
        }

        // 验证照片
        if (!userPhoto.value && !photoPreview.value) {
            toast.open({
                message: '请上传照片',
                type: 'warning',
                position: 'top-right',
            })
            return
        }

        // 验证设备指纹
        if (!deviceFingerprint.value) {
            toast.open({
                message: '设备信息获取失败，请刷新重试',
                type: 'error',
                position: 'top-right',
            })
            return
        }

        isUploading.value = true

        try {
            // 使用上传后的URL作为头像
            let photoData: string
            if (userPhoto.value) {
                // 新上传的照片，使用上传后的URL
                photoData = avatarUrl.value
            }
            else {
                // 使用已有的照片URL
                photoData = photoPreview.value
            }

            // 检查是否为更新
            let existingUser = null
            try {
                existingUser = await personApi.api_getPersonByDeviceFingerprint(deviceFingerprint.value)
            }
            catch (error: any) {
                // 404表示用户不存在，这是正常情况，不需要报错
                if (error?.detail !== 'Person not found' && error?.response?.status !== 404) {
                    throw error
                }
            }
            const isUpdate = !!existingUser

            // 准备用户数据
            const userData: Partial<IPersonConfig> = {
                uid: '',
                uuid: isUpdate && existingUser ? existingUser.uuid : uuidv4(),
                name: userName.value.trim(),
                department: userDepartment.value.trim(),
                position: userPosition.value.trim(),
                identity: userPosition.value.trim(),
                deviceFingerprint: deviceFingerprint.value,
                avatar: photoData as string,
                thumbnailAvatar: thumbnailPreview.value,
                isWin: isUpdate && existingUser ? existingUser.isWin : false,
                x: isUpdate && existingUser ? existingUser.x : 0,
                y: isUpdate && existingUser ? existingUser.y : 0,
                createTime: isUpdate && existingUser ? existingUser.createTime : dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                updateTime: dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                prizeName: isUpdate && existingUser ? existingUser.prizeName : [],
                prizeId: isUpdate && existingUser ? existingUser.prizeId : [],
                prizeTime: isUpdate && existingUser ? existingUser.prizeTime : [],
            }

            if (isUpdate && existingUser) {
                // 更新现有用户
                await personApi.api_updatePerson(existingUser.id, userData)
            }
            else {
                // 创建新用户
                await personApi.api_createPerson(userData as IPersonConfig)
            }

            router.push('/log-lottery/mobile/success')
        }
        catch (error) {
            console.error('提交失败:', error)
            toast.open({
                message: '提交失败，请重试',
                type: 'error',
                position: 'top-right',
            })
        }
        finally {
            isUploading.value = false
        }
    }

    /**
     * 重置表单
     */
    function resetForm() {
        userName.value = ''
        userDepartment.value = ''
        userPosition.value = ''
        userPhoto.value = null
        photoPreview.value = ''
        thumbnailPreview.value = ''
        avatarUrl.value = ''
    }

    return {
    // 数据
        userName,
        userDepartment,
        userPosition,
        userPhoto,
        photoPreview,
        thumbnailPreview,
        isUploading,
        deviceFingerprint,
        departmentList,
        avatarUrl,

        // 方法
        initDeviceFingerprint,
        handlePhotoSelect,
        removePhoto,
        handleSubmit,
        resetForm,
    }
}
