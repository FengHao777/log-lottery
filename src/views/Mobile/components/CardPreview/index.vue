<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import useStore from '@/store'

interface Props {
  photoPreview?: string
  userName?: string
  userDepartment?: string
}

const props = withDefaults(defineProps<Props>(), {
  photoPreview: '',
  userName: '',
  userDepartment: '',
})

const globalConfig = useStore().globalConfig
const { getCardColor: cardColor, getCardSize: cardSize, getTextSize: textSize } = storeToRefs(globalConfig)

// 计算卡片样式
const cardStyle = computed(() => {
  const scale = 1.5 // 预览时放大显示
  return {
    width: `${cardSize.value.width * scale}px`,
    height: `${cardSize.value.height * scale}px`,
    backgroundImage: props.photoPreview ? `url(${props.photoPreview})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: props.photoPreview ? 'transparent' : cardColor.value,
    border: `1px solid ${cardColor.value}40`,
    boxShadow: `0 0 12px ${cardColor.value}80`,
  }
})

// 计算姓名样式
const nameStyle = computed(() => {
  const scale = 1.5
  return {
    fontSize: `${textSize.value * scale * 1.2}px`,
    lineHeight: `${textSize.value * scale * 3}px`,
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
  const scale = 1.5
  return {
    fontSize: `${textSize.value * scale * 0.6}px`,
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
        <div class="card-name" :style="nameStyle">
          {{ userName || '姓名' }}
        </div>
        <!-- 部门 -->
        <div class="card-department" :style="departmentStyle">
          {{ userDepartment || '部门' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-preview-container {
  margin-top: 16px;
  margin-bottom: 16px;
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
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
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
</style>
