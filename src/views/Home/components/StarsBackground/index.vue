<script setup lang='ts'>
import { useElementSize } from '@vueuse/core'
import localforage from 'localforage'
import Sparticles from 'sparticles'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
    homeBackground: {
        type: Object,
        default: () => ({
            id: '',
            name: '',
            url: '',
        }),
    },
    isLotteryRunning: {
        type: Boolean,
        default: false,
    },
})
const imageDbStore = localforage.createInstance({
    name: 'imgStore',
})
const imgUrl = ref('')
const starRef = ref()

const { width, height } = useElementSize(starRef)
// 优化：减少星星数量从200减少到80，降低性能开销
// 优化：降低动画速度，减少视差效果，关闭旋转以提升性能
const options = ref({ shape: 'star', parallax: 0.8, rotate: false, twinkle: true, speed: 5, count: 80 })
let sparticleInstance: any = null
let resizeTimer: any = null

function addSparticles(node: any, width: number, height: number) {
    // 清理旧的实例
    if (sparticleInstance) {
        sparticleInstance.destroy()
    }
    sparticleInstance = new Sparticles(node, options.value, width, height)
    return sparticleInstance
}
// 页面大小改变时，添加节流
function listenWindowSize() {
    window.addEventListener('resize', () => {
        // 节流：使用setTimeout避免频繁触发
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
            if (width.value && height.value) {
                addSparticles(starRef.value, width.value, height.value)
            }
        }, 200)
    })
}

async function getImageStoreItem(item: any): Promise<string> {
    let image = ''
    if (item.url === 'Storage') {
        const key = item.id
        const imageData = await imageDbStore.getItem(key) as any
        image = URL.createObjectURL(imageData.data)
    }
    else {
        image = item.url
    }

    return image
}

// 优化：监听抽奖状态，在抽奖运行时暂停星星动画
watch(() => props.isLotteryRunning, (isRunning) => {
    if (sparticleInstance) {
        if (isRunning) {
            // 抽奖运行时，暂停星星动画以提升性能
            sparticleInstance.pause && sparticleInstance.pause()
        }
        else {
            // 抽奖停止时，恢复星星动画
            sparticleInstance.play && sparticleInstance.play()
        }
    }
})

onMounted(() => {
    getImageStoreItem(props.homeBackground).then((image) => {
        imgUrl.value = image
    })
    addSparticles(starRef.value, width.value, height.value)
    listenWindowSize()
})
onUnmounted(() => {
    window.removeEventListener('resize', listenWindowSize)
    // 清理sparticles实例
    if (sparticleInstance) {
        sparticleInstance.destroy()
        sparticleInstance = null
    }
    clearTimeout(resizeTimer)
})
</script>

<template>
  <div v-if="homeBackground.url" class="home-background w-screen h-screen overflow-hidden">
    <img :src="imgUrl" class="w-full h-full object-cover" alt="">
  </div>
  <div v-else ref="starRef" class="w-screen h-screen overflow-hidden" />
</template>

<style lang='scss' scoped>

</style>
