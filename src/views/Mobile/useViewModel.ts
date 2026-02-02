import type { IDepartment, IUserUpload } from '@/types/storeType'
import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification'
import { useDepartmentConfig } from '@/store/departmentConfig'
import { useUserUploadConfig } from '@/store/userUploadConfig'
import { getDeviceFingerprint } from '@/utils/deviceFingerprint'

export function useViewModel() {
    const toast = useToast()
    const router = useRouter()
    const userUploadStore = useUserUploadConfig()
    const departmentStore = useDepartmentConfig()

    // 表单数据
    const userName = ref('')
    const userDepartment = ref('')
    const userPosition = ref('')
    const userPhoto = ref<File | null>(null)
    const photoPreview = ref<string>('')
    const isUploading = ref(false)
    const deviceFingerprint = ref('')

    // 部门列表
    const departmentList = ref<IDepartment[]>([])

    // 获取设备指纹
    async function initDeviceFingerprint() {
        try {
            deviceFingerprint.value = await getDeviceFingerprint()
            // 检查是否已有上传记录
            const existingUser = userUploadStore.getUserByDeviceFingerprint(deviceFingerprint.value)
            if (existingUser) {
                userName.value = existingUser.name
                userDepartment.value = existingUser.department || ''
                userPosition.value = existingUser.position || ''
                photoPreview.value = existingUser.photo as string
            }
        }
        catch (error) {
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
    function handlePhotoSelect(event: Event) {
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
        reader.onload = (e) => {
            photoPreview.value = e.target?.result as string
        }
        reader.readAsDataURL(file)
    }

    /**
     * 移除照片
     */
    function removePhoto() {
        userPhoto.value = null
        photoPreview.value = ''
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
            // 转换照片为Base64
            let photoData: string | Blob
            if (userPhoto.value) {
                // 新上传的照片，转换为Base64
                photoData = await fileToBase64(userPhoto.value)
            }
            else {
                // 使用已有的照片
                photoData = photoPreview.value
            }

            // 检查是否为更新
            const existingUser = userUploadStore.getUserByDeviceFingerprint(deviceFingerprint.value)
            const isUpdate = !!existingUser

            // 准备用户数据
            const userData: IUserUpload = {
                id: isUpdate && existingUser ? existingUser.id : uuidv4(), // 更新时保留原有id
                deviceFingerprint: deviceFingerprint.value,
                name: userName.value.trim(),
                department: userDepartment.value.trim(),
                position: userPosition.value.trim(),
                photo: photoData,
                createTime: isUpdate && existingUser ? existingUser.createTime : dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss'), // 更新时保留原有创建时间
                updateTime: dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            }

            // 保存到Store
            const success = await userUploadStore.addOrUpdateUserUpload(userData)

            if (success) {
                router.push('/log-lottery/mobile/success')
            }
            else {
                toast.open({
                    message: '保存失败，请重试',
                    type: 'error',
                    position: 'top-right',
                })
            }
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
     * 将文件转换为Base64
     */
    function fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
                resolve(reader.result as string)
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
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
    }

    return {
    // 数据
        userName,
        userDepartment,
        userPosition,
        userPhoto,
        photoPreview,
        isUploading,
        deviceFingerprint,
        departmentList,

        // 方法
        initDeviceFingerprint,
        handlePhotoSelect,
        removePhoto,
        handleSubmit,
        resetForm,
    }
}
