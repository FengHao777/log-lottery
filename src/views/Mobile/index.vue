<script setup lang='ts'>
import { onMounted } from 'vue'
import { useViewModel } from './useViewModel'
import CardPreview from './components/CardPreview/index.vue'

const {
  userName,
  userDepartment,
  userPhoto,
  photoPreview,
  isUploading,
  deviceFingerprint,
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
  <div class="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex flex-col items-center justify-center p-3">
    <div class="bg-white rounded-2xl shadow-2xl p-4 w-full max-w-sm">
      <!-- 标题 -->
      <div class="text-center mb-4">
        <h1 class="text-xl font-bold text-gray-800 mb-1">
          🎉 参与抽奖
        </h1>
        <p class="text-xs text-gray-600">
          上传照片、填写信息，即可参与抽奖
        </p>
      </div>

      <!-- 卡片预览 -->
      <CardPreview
        :photo-preview="photoPreview"
        :user-name="userName"
        :user-department="userDepartment"
      />

      <!-- 照片上传区域 -->
      <div class="mb-4">
        <label class="block text-xs font-medium text-gray-700 mb-1">
          上传照片 *
        </label>
        <div
          class="relative border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:border-purple-500 transition-colors cursor-pointer"
          :class="{ 'border-purple-500 bg-purple-50': photoPreview }"
        >
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            @change="handlePhotoSelect"
          >

          <!-- 预览区域 -->
          <div v-if="photoPreview" class="relative">
            <img
              :src="photoPreview"
              alt="预览"
              class="w-full h-40 object-cover rounded-lg"
            >
            <button
              type="button"
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
              @click.stop="removePhoto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- 上传提示 -->
          <div v-else class="py-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-xs text-gray-600">
              点击上传照片
            </p>
            <p class="text-xs text-gray-400 mt-0.5">
              JPG、PNG、WebP，最大5MB
            </p>
          </div>
        </div>
      </div>

      <!-- 姓名和部门输入区域（并排） -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <!-- 部门输入 -->
        <div>
          <label for="userDepartment" class="block text-xs font-medium text-gray-700 mb-1">
            部门 *
          </label>
          <input
            id="userDepartment"
            v-model="userDepartment"
            type="text"
            placeholder="部门"
            class="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            :disabled="isUploading"
          >
        </div>

        <!-- 姓名输入 -->
        <div>
          <label for="userName" class="block text-xs font-medium text-gray-700 mb-1">
            姓名 *
          </label>
          <input
            id="userName"
            v-model="userName"
            type="text"
            placeholder="姓名"
            class="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            :disabled="isUploading"
          >
        </div>
      </div>

      <!-- 提交按钮 -->
      <button
        type="button"
        class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2.5 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg text-sm"
        :disabled="isUploading"
        @click="handleSubmit"
      >
        <span v-if="isUploading" class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          提交中...
        </span>
        <span v-else>
          提交参与
        </span>
      </button>

      <!-- 重置按钮 -->
      <button
        v-if="photoPreview || userName || userDepartment"
        type="button"
        class="w-full mt-2 text-gray-600 hover:text-gray-800 text-xs transition-colors"
        :disabled="isUploading"
        @click="resetForm"
      >
        重置表单
      </button>

      <!-- 提示信息 -->
      <div class="mt-3 p-3 bg-blue-50 rounded-lg">
        <div class="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500 mt-0.5 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="text-xs text-blue-700">
            <p class="font-semibold mb-1">温馨提示：</p>
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
</style>
