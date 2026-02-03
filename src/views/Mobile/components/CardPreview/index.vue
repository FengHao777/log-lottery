<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import useStore from '@/store'

interface Props {
    photoPreview?: string
    thumbnailPreview?: string
    userName?: string
    userDepartment?: string
    userPosition?: string
}

const props = withDefaults(defineProps<Props>(), {
    photoPreview: '',
    thumbnailPreview: '',
    userName: '',
    userDepartment: '',
    userPosition: '',
})

const globalConfig = useStore().globalConfig
const { getCardColor: cardColor, getCardSize: cardSize, getTextSize: textSize } = storeToRefs(globalConfig)

// 计算卡片样式 - 使用缩略图减小渲染压力
const cardStyle = computed(() => {
    const bgImage = props.thumbnailPreview || props.photoPreview
    return {
        width: `${cardSize.value.width}px`,
        height: `${cardSize.value.height}px`,
        backgroundImage: bgImage ? `url(${bgImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: bgImage ? 'transparent' : cardColor.value,
        border: `1px solid ${cardColor.value}40`,
        boxShadow: `0 0 12px ${cardColor.value}80`,
    }
})

// 计算姓名样式
const nameStyle = computed(() => {
    return {
        fontSize: `${textSize.value * 1.2}px`,
        lineHeight: `${textSize.value * 3}px`,
        color: '#FFFFFF',
        textShadow: `
      0 0 8px ${cardColor.value},
      0 0 16px ${cardColor.value}CC,
      0 0 24px ${cardColor.value}99,
      -2px -2px 0 rgba(0, 0, 0, 0.95),
      2px -2px 0 rgba(0, 0, 0, 0.95),
      -2px 2px 0 rgba(0, 0, 0, 0.95),
      2px 2px 0 rgba(0, 0, 0, 0.95),
      -2px 0 0 rgba(0, 0, 0, 0.95),
      2px 0 0 rgba(0, 0, 0, 0.95),
      0 -2px 0 rgba(0, 0, 0, 0.95),
      0 2px 0 rgba(0, 0, 0, 0.95),
      0 4px 8px rgba(0, 0, 0, 0.8)
    `,
        fontWeight: '900',
        letterSpacing: '1px',
    }
})

// 计算部门样式
const departmentStyle = computed(() => {
    return {
        fontSize: `${textSize.value * 0.6}px`,
        color: '#FFFFFF',
        textShadow: `
      0 0 6px ${cardColor.value},
      0 0 12px ${cardColor.value}CC,
      0 0 18px ${cardColor.value}99,
      -1px -1px 0 rgba(0, 0, 0, 0.95),
      1px -1px 0 rgba(0, 0, 0, 0.95),
      -1px 1px 0 rgba(0, 0, 0, 0.95),
      1px 1px 0 rgba(0, 0, 0, 0.95),
      0 2px 4px rgba(0, 0, 0, 0.8)
    `,
        fontWeight: '700',
    }
})
</script>

<template>
  <div class="card-preview-container">
    <div class="card-preview-wrapper">
      <div class="card-preview" :style="cardStyle">
        <!-- 姓名 -->
        <div v-if="userName" class="card-name" :style="nameStyle">
          {{ userName }}
        </div>
        <!-- 部门 -->
        <div v-if="userDepartment" class="card-department" :style="departmentStyle">
          {{ userDepartment }}
        </div>
        <!-- 岗位 -->
        <div v-if="userPosition" class="card-position" :style="departmentStyle">
          {{ userPosition }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-preview-container {
}

.card-preview-label {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
}

.card-preview-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-preview {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.card-preview:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
}

.card-name {
  position: relative;
  z-index: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}

.card-department {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-top: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}

.card-position {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}
</style>
