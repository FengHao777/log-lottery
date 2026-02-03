<script setup lang='ts'>
import type { IPrizeConfig } from '@/types/storeType'
import { nextTick, ref, watch } from 'vue'
import defaultPrizeImage from '@/assets/images/龙.png'
import { useGsap } from './useGsap'

const props = defineProps<{
    isMobile: boolean
    localPrizeList: IPrizeConfig[]
    currentPrize: IPrizeConfig
    temporaryPrizeShow: boolean
    addTemporaryPrize: () => void
}>()

const emit = defineEmits<{
    switchPrize: [prize: IPrizeConfig]
}>()

const prizeShow = defineModel<boolean>('prizeShow')
const scrollContainerRef = ref<any>(null)
const ulContainerRef = ref<any>(null)
const isScroll = ref(false)
const liRefs = ref<any[]>([])
const isManualSwitch = ref(false)

const {
    showUpButton,
    showDownButton,
    handleScroll,
} = useGsap(scrollContainerRef, liRefs, isScroll, prizeShow, props.temporaryPrizeShow)

// 获取ulContainerRef的高度
function getUlContainerHeight() {
    if (ulContainerRef.value) {
        return ulContainerRef.value.offsetHeight
    }
    return 0
}
// 获取scrollContainerRef的高度
function getScrollContainerHeight() {
    if (scrollContainerRef.value) {
        return scrollContainerRef.value.offsetHeight
    }
    return 0
}

function getIsScroll() {
    const ulHeight = getUlContainerHeight()
    const scrollHeight = getScrollContainerHeight()
    if (ulHeight > scrollHeight + 20) {
        isScroll.value = true
    }
    else {
        isScroll.value = false
        // 移除固定高度设置，让容器自适应父容器
        if (scrollContainerRef.value) {
            scrollContainerRef.value.style.height = ''
        }
    }
}

watch ([prizeShow, () => props.temporaryPrizeShow], (val) => {
    if (!val[0]) {
        return
    }
    setTimeout (() => {
        getIsScroll()
    }, 0)
}, { immediate: true })

watch(() => props.currentPrize, async (newPrize) => {
    console.log('当前奖项变化:', newPrize?.name, 'ID:', newPrize?.id)
    console.log('容器显示状态:', { prizeShow: prizeShow.value, isMobile: props.isMobile, temporaryPrizeShow: props.temporaryPrizeShow })
    if (!newPrize || !scrollContainerRef.value || !liRefs.value) {
        console.log('跳过滚动：奖项或滚动容器或liRefs不存在')
        return
    }
    // 检查容器是否可见
    if (!prizeShow.value || props.isMobile || props.temporaryPrizeShow) {
        console.log('跳过滚动：容器不可见')
        return
    }
    // 手动切换时不自动滚动
    if (isManualSwitch.value) {
        console.log('跳过滚动：这是手动切换')
        isManualSwitch.value = false
        return
    }
    const currentIndex = props.localPrizeList.findIndex(item => item.id === newPrize.id)
    if (currentIndex === -1) {
        console.log('跳过滚动：未找到奖项，ID:', newPrize.id)
        return
    }
    // 等待 DOM 更新完成，并尝试多次获取 liRefs
    await nextTick()
    let retryCount = 0
    const maxRetries = 5
    while (retryCount < maxRetries) {
        console.log(`尝试获取 liRefs，第 ${retryCount + 1} 次`)
        console.log('liRefs.value.length:', liRefs.value.length)
        console.log('需要的索引:', currentIndex)
        if (liRefs.value && liRefs.value.length > currentIndex && liRefs.value[currentIndex]) {
            console.log('成功获取 liRef，开始滚动')
            const targetLi = liRefs.value[currentIndex]
            const containerHeight = scrollContainerRef.value.clientHeight
            const liOffsetTop = targetLi.offsetTop
            const liHeight = targetLi.offsetHeight
            const scrollTop = liOffsetTop - containerHeight / 2 + liHeight / 2
            console.log('滚动参数:', { liOffsetTop, containerHeight, liHeight, scrollTop })
            scrollContainerRef.value.scrollTo({
                top: scrollTop,
                behavior: 'smooth',
            })
            return
        }
        await new Promise(resolve => setTimeout(resolve, 50))
        retryCount++
    }
    console.error('无法获取 liRef，已达到最大重试次数')
})

function handleSwitchPrize(prize: IPrizeConfig) {
    console.log('手动切换奖项:', prize.name, 'ID:', prize.id)
    isManualSwitch.value = true
    emit('switchPrize', prize)
}
</script>

<template>
  <transition name="prize-list" class="h-full" :appear="true">
    <div v-show="prizeShow && !isMobile && !temporaryPrizeShow" class="h-full relative w-full">
      <div v-if="isScroll" class="w-full h-12 flex justify-center scroll-button scroll-button-up absolute top-0 z-50">
        <SvgIcon v-show="showUpButton" name="chevron-up" size="48px" class="text-white/90 cursor-pointer hover:text-white transition-colors" @click="handleScroll(-150)" />
      </div>
      <div ref="scrollContainerRef" :class="isScroll ? (showDownButton ? 'scroll-container' : 'scroll-container-end') : 'no-scroll bg-slate-500/30'" class="h-full no-before overflow-y-auto overflow-x-hidden  scroll-smooth hide-scrollbar before:bg-slate-500/30 z-20 rounded-2xl">
        <ul ref="ulContainerRef" class="flex flex-col p-3">
          <li
            v-for="item in localPrizeList"
            ref="liRefs" :key="item.id"
            :class="currentPrize.id === item.id ? 'current-prize' : ''"
            class="cursor-pointer mb-2"
            @click="handleSwitchPrize(item)"
          >
            <div
              v-if="item.isShow"
              class="relative flex flex-row items-center justify-between w-64 h-28 px-4 gap-4 shadow-lg card bg-base-100 rounded-2xl"
            >
              <div
                v-if="item.isUsed"
                class="absolute z-50 w-full left-0 h-full item-mask rounded-2xl flex items-center justify-center"
              >
                <span class="text-white font-bold text-lg">已抽完</span>
              </div>
              <figure class="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0">
                <ImageSync v-if="item.picture.url" :img-item="item.picture" />
                <img
                  v-else :src="defaultPrizeImage" alt="Prize"
                  class="object-cover w-full h-full"
                >
              </figure>
              <div class="flex-1 flex flex-col justify-center py-2">
                <div class="tooltip tooltip-left w-full" :data-tip="item.name">
                  <h2
                    class="w-32 p-0 m-0 overflow-hidden card-title whitespace-nowrap text-ellipsis leading-tight"
                  >
                    {{ item.name }}
                  </h2>
                </div>
                <div class="flex items-center gap-2 mt-2">
                  <span class="text-xs font-medium text-slate-600">
                    {{ item.isUsedCount }}/{{ item.count }}
                  </span>
                  <span class="text-xs text-slate-400">
                    ({{ Math.round((item.isUsedCount / item.count) * 100) }}%)
                  </span>
                </div>
                <div class="w-full mt-2">
                  <progress
                    class="w-full h-1.5 progress progress-primary" :value="item.isUsedCount"
                    :max="item.count"
                  />
                </div>
              </div>
            </div>
          </li>
        </ul>
        <div v-if="isScroll" class="h-24" />
      </div>
      <div v-if="isScroll" class="w-full h-12 flex justify-center scroll-button scroll-button-down absolute z-50" style="bottom: 4rem;">
        <SvgIcon v-show="showDownButton" name="chevron-down" size="48px" class="text-white/90 cursor-pointer hover:text-white transition-colors" @click="handleScroll(150)" />
      </div>
    </div>
  </transition>
</template>

<style scoped lang="scss">
@use "./index.scss";
</style>
