<script setup lang='ts'>
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
    router.push('/log-lottery/mobile')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 flex flex-col items-center justify-center p-6">
    <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
      <!-- 成功图标 -->
      <div class="mb-6 flex justify-center">
        <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <!-- 成功标题 -->
      <h1 class="text-2xl font-bold text-gray-800 mb-2">
        已参加年会抽奖
      </h1>

      <!-- 成功描述 -->
      <p class="text-sm text-gray-600 mb-6">
        您已成功参与抽奖活动，请留意抽奖结果！
      </p>

      <!-- 返回按钮 -->
      <button
        type="button"
        class="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg text-sm"
        @click="goBack"
      >
        返回
      </button>
    </div>
  </div>
</template>
