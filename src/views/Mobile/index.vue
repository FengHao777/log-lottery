<script setup lang='ts'>
import { onMounted } from 'vue'
import CardPreview from './components/CardPreview/index.vue'
import { useViewModel } from './useViewModel'

const {
    userName,
    userDepartment,
    userPosition,
    photoPreview,
    thumbnailPreview,
    isUploading,
    deviceFingerprint,
    departmentList,
    initDeviceFingerprint,
    handlePhotoSelect,
    removePhoto,
    handleSubmit,
    resetForm,
} = useViewModel()

onMounted(() => {
    initDeviceFingerprint()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-red-500 via-orange-500 to-yellow-400 flex flex-col items-center justify-center p-3 relative overflow-hidden">
    <!-- 装饰元素 -->
    <div class="absolute top-4 left-4 text-4xl animate-bounce">
      🏮
    </div>
    <div class="absolute top-4 right-4 text-4xl animate-bounce" style="animation-delay: 0.2s;">
      🏮
    </div>
    <div class="absolute top-20 left-8 text-2xl animate-pulse">
      ⭐
    </div>
    <div class="absolute top-20 right-8 text-2xl animate-pulse" style="animation-delay: 0.5s;">
      ⭐
    </div>
    <div class="absolute bottom-20 left-6 text-xl animate-pulse" style="animation-delay: 0.3s;">
      ✨
    </div>
    <div class="absolute bottom-20 right-6 text-xl animate-pulse" style="animation-delay: 0.7s;">
      ✨
    </div>

    <div class="bg-white rounded-2xl shadow-2xl p-4 w-full max-w-sm relative z-10 border-4 border-yellow-400">
      <!-- 标题 -->
      <div class="text-center mb-4">
        <div class="flex items-center justify-center mb-2">
          <span class="text-2xl">🎊</span>
          <h1 class="text-2xl font-bold text-red-600 mx-2 bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent">
            年会抽奖
          </h1>
          <span class="text-2xl">🎊</span>
        </div>
        <p class="text-sm text-orange-500 font-medium">
          🎁 上传照片、填写信息，幸运大奖等你拿！
        </p>
      </div>

      <!-- 卡片预览和照片上传区域（并排） -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <!-- 卡片预览 -->
        <div class="flex flex-col items-center h-full">
          <label class="block text-xs font-medium text-gray-700 mb-1 h-5">
            卡片预览
          </label>
          <CardPreview
            :photo-preview="photoPreview"
            :thumbnail-preview="thumbnailPreview"
            :user-name="userName"
            :user-department="userDepartment"
            :user-position="userPosition"
          />
        </div>

        <!-- 照片上传区域 -->
        <div class="flex flex-col items-center h-full">
          <label class="block text-xs font-medium text-gray-700 mb-1 h-5">
            上传照片 *
          </label>
          <div
            class="relative border-2 border-dashed border-orange-300 rounded-lg text-center hover:border-red-500 transition-colors cursor-pointer overflow-hidden"
            :style="{ width: '140px', height: '200px' }"
            :class="{ 'border-red-500 bg-red-50': photoPreview }"
          >
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              @change="handlePhotoSelect"
            >

            <!-- 预览区域 -->
            <div v-if="photoPreview" class="relative w-full h-full">
              <img
                :src="photoPreview"
                alt="预览"
                class="w-full h-full object-cover rounded-lg"
              >
              <button
                type="button"
                class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                @click.stop="removePhoto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>

            <!-- 上传提示 -->
            <div v-else class="flex flex-col items-center justify-center h-full px-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="text-xs text-gray-600 leading-tight">
                点击上传
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 姓名、部门、岗位输入区域 -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <!-- 部门下拉框 -->
        <div class="relative">
          <label for="userDepartment" class="block text-xs font-medium text-gray-700 mb-1">
            部门 *
          </label>
          <select
            id="userDepartment"
            v-model="userDepartment"
            class="w-full px-3 py-2 pr-8 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white appearance-none cursor-pointer"
            :disabled="isUploading"
          >
            <option value="" disabled>
              选择部门
            </option>
            <option v-for="dept in departmentList" :key="dept.id" :value="dept.name">
              {{ dept.name }}
            </option>
          </select>
          <svg
            class="absolute right-3 top-[28px] pointer-events-none text-gray-500 w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        <!-- 岗位输入 -->
        <div>
          <label for="userPosition" class="block text-xs font-medium text-gray-700 mb-1">
            岗位 *
          </label>
          <input
            id="userPosition"
            v-model="userPosition"
            type="text"
            placeholder="岗位"
            class="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            :disabled="isUploading"
          >
        </div>
      </div>

      <!-- 姓名输入 -->
      <div class="mb-4">
        <label for="userName" class="block text-xs font-medium text-gray-700 mb-1">
          姓名 *
        </label>
        <input
          id="userName"
          v-model="userName"
          type="text"
          placeholder="姓名"
          class="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
          :disabled="isUploading"
        >
      </div>

      <!-- 提交按钮 -->
      <button
        type="button"
        class="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:from-red-600 hover:to-orange-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl text-sm animate-pulse"
        :disabled="isUploading"
        @click="handleSubmit"
      >
        <span v-if="isUploading" class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          提交中...
        </span>
        <span v-else class="flex items-center justify-center">
          <span class="mr-1">🎉</span>
          提交参与
          <span class="ml-1">🎉</span>
        </span>
      </button>

      <!-- 重置按钮 -->
      <button
        v-if="photoPreview || userName || userDepartment || userPosition"
        type="button"
        class="w-full mt-2 text-gray-500 hover:text-red-500 text-xs transition-colors font-medium"
        :disabled="isUploading"
        @click="resetForm"
      >
        🔄 重置表单
      </button>

      <!-- 提示信息 -->
      <div class="mt-3 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-orange-200">
        <div class="flex items-start">
          <span class="text-lg mr-1.5 flex-shrink-0">💡</span>
          <div class="text-xs text-orange-700">
            <p class="font-bold mb-1">
              温馨提示：
            </p>
            <ul class="list-disc list-inside space-y-0.5">
              <li>建议上传竖版照片</li>
              <li>同一设备多次会替换旧数据</li>
              <li>提交成功后即可参与抽奖</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 设备指纹显示（调试用） -->
      <div v-if="deviceFingerprint" class="mt-2 text-xs text-gray-400 text-center">
        设备ID: {{ deviceFingerprint.substring(0, 8) }}...
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 自定义 select 选项样式 */
select option {
  font-size: 14px;
  padding: 8px;
}
</style>
