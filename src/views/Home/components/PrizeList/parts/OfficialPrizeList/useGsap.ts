import type { Ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { onBeforeUnmount, onUnmounted, ref, watch } from 'vue'

export function useGsap(scrollContainerRef: any, liRefs: any, isScroll: Ref<boolean>, prizeShow: any, temporaryPrizeShow: any) {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = ref()
    const showUpButton = ref(false)
    const showDownButton = ref(true)
    function initGsapAnimation() {
        if (!scrollContainerRef.value || !liRefs.value || liRefs.value.length === 0) {
            return
        }
        ctx.value = gsap.context(() => {
            liRefs.value.forEach((box: any) => {
                gsap.fromTo(box, { rotationX: -90, rotateZ: -20, opacity: 0 }, {
                    rotationX: 0,
                    rotateZ: 0,
                    opacity: 1,
                    scrollTrigger: {
                        trigger: box,
                        scroller: scrollContainerRef.value,
                        start: 'bottom 100%',
                        end: 'top 70%',
                        scrub: true,
                    },
                })
            })
        }, scrollContainerRef.value)
    }

    function disposeGsapAnimation() {
        if (!ctx.value) {
            return
        }
        try {
            ctx.value.revert()
        } catch (error) {
            console.warn('Failed to revert GSAP context:', error)
        }
    }
    function scrollHandler() {
        if (!scrollContainerRef.value) {
            return
        }
        const scrollHeight = scrollContainerRef.value.scrollHeight
        const scrollTop = scrollContainerRef.value.scrollTop
        const containerHeight = scrollContainerRef.value.clientHeight
        // 滚动滑到底部
        if (scrollTop + containerHeight >= scrollHeight - 10) {
            showDownButton.value = false
            showUpButton.value = true
        }
        // 在中间
        else if (scrollTop && scrollTop + containerHeight < scrollHeight) {
            showDownButton.value = true
            showUpButton.value = true
        }
        // 滚动滑到顶部
        else {
            showDownButton.value = true
            showUpButton.value = false
        }
    }
    function listenScrollContainer() {
        if (scrollContainerRef.value) {
            scrollContainerRef.value.addEventListener('scroll', scrollHandler)
        }
    }
    function removeScrollContainer() {
        if (scrollContainerRef.value) {
            scrollContainerRef.value.removeEventListener('scroll', scrollHandler)
        }
    }

    function handleScroll(h: number) {
        if (!scrollContainerRef.value) {
            return
        }
        scrollContainerRef.value.scrollTop += h
    }
    watch([isScroll, prizeShow, () => temporaryPrizeShow], ([val1, val2, val3]) => {
        if (val1 && val2 && !val3 && liRefs.value && liRefs.value.length > 0) {
            setTimeout(() => {
                initGsapAnimation()
                if (scrollContainerRef.value) {
                    listenScrollContainer()
                }
            }, 0)
        }
    })
    onBeforeUnmount(() => {
        if (!isScroll.value)
            return
        removeScrollContainer()
    })
    onUnmounted(() => {
        if (!isScroll.value)
            return
        disposeGsapAnimation()
    })

    return {
        showUpButton,
        showDownButton,
        handleScroll,
    }
}
