<script setup lang='ts'>
import type { IFileData } from '../FileUpload/type'
import type { IImage } from '@/types/storeType'
import localforage from 'localforage'
import { onMounted, ref } from 'vue'

interface IProps {
    imgItem: IImage
}
const props = defineProps<IProps>()
const imageDbStore = localforage.createInstance({
    name: 'imgStore',
})

const imgUrl = ref('')

async function generateThumbnailFromBlob(blob: Blob, maxWidth: number = 200, maxHeight: number = 200): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(blob)
        img.onload = () => {
            URL.revokeObjectURL(url)
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height

            // 计算缩放比例
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height)
                width *= ratio
                height *= ratio
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height)
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob)
                    }
                    else {
                        reject(new Error('Failed to generate thumbnail'))
                    }
                }, 'image/jpeg', 0.85)
            }
            else {
                reject(new Error('Failed to get canvas context'))
            }
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Failed to load image'))
        }
        img.src = url
    })
}

async function getImageStoreItem(item: IImage): Promise<string> {
    let image = ''
    // 优先使用缩略图
    if (item.thumbnailUrl && item.thumbnailUrl !== 'Storage') {
        image = item.thumbnailUrl as string
    }
    else if (item.url === 'Storage') {
        const key = item.id
        const imageData = await imageDbStore.getItem<IFileData>(key)
        if (imageData?.data) {
            // 尝试生成缩略图
            try {
                const thumbnailBlob = await generateThumbnailFromBlob(imageData.data as Blob)
                image = URL.createObjectURL(thumbnailBlob)
            }
            catch (error) {
                console.error('生成缩略图失败，使用原图:', error)
                // 如果生成缩略图失败，使用原图
                image = URL.createObjectURL(imageData.data as Blob)
            }
        }
    }
    else {
        image = item.url as string
    }

    return image
}

onMounted(async () => {
    imgUrl.value = await getImageStoreItem(props.imgItem)
})
</script>

<template>
  <img :src="imgUrl" alt="Image" class="object-cover h-full rounded-xl">
</template>

<style lang='scss' scoped>

</style>
