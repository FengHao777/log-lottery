<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const router = useRouter()
const password = ref('')
const loading = ref(false)

const CORRECT_PASSWORD = 'diantoushukekainiandaji'

function handleLogin() {
    if (!password.value) {
        toast.error('请输入密码')
        return
    }

    loading.value = true

    setTimeout(() => {
        if (password.value === CORRECT_PASSWORD) {
            toast.success('验证成功')
            sessionStorage.setItem('passwordVerified', 'true')
            router.push('/log-lottery/home')
        }
        else {
            toast.error('密码错误')
            password.value = ''
        }
        loading.value = false
    }, 500)
}

function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
        handleLogin()
    }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
    <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">
          欢迎使用
        </h1>
        <p class="text-gray-600">
          请输入密码进入抽奖系统
        </p>
      </div>

      <div class="space-y-6">
        <div class="space-y-2">
          <label for="password" class="block text-sm font-medium text-gray-700">
            密码
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="请输入密码"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            :disabled="loading"
            @keypress="handleKeyPress"
          >
        </div>

        <button
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          :disabled="loading"
          @click="handleLogin"
        >
          <span v-if="!loading">进入系统</span>
          <span v-else>验证中...</span>
        </button>
      </div>

      <div class="mt-6 text-center text-sm text-gray-500">
        <!-- <p>提示：默认密码是 admin</p> -->
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
</style>
