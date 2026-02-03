import type { Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onMounted, provide, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { loadingKey, loadingState } from '@/components/Loading'
import { useWebsocket } from '@/hooks/useWebsocket'
import useStore from '@/store'
import { themeChange } from '@/utils'

export function useMounted(tipDialog: Ref<any>, defaultPrizeDialog?: Ref<any>) {
    provide(loadingKey, loadingState)
    const globalConfig = useStore().globalConfig
    const prizeConfig = useStore().prizeConfig
    const system = useStore().system
    const { getTheme: localTheme } = storeToRefs(globalConfig)
    const { getPrizeConfig: prizeList } = storeToRefs(prizeConfig)
    const tipDesc = ref('')
    const { t } = useI18n()
    const route = useRoute()
    const enableWebsocket = import.meta.env.VITE_ENABLE_WEBSOCKET
    const websocketData = enableWebsocket === 'true' ? useWebsocket() : { data: ref(null) }
    const { data } = websocketData
    // 设置当前奖列表
    // 注意：fetchPrizeConfig 已经在内部调用了 api_setCurrentPrize，不需要再调用这个函数
    // function setCurrentPrize() {
    //     if (prizeList.value.length <= 0) {
    //         return
    //     }
    //     if (temporaryPrize.value && temporaryPrize.value.isShow) {
    //         prizeConfig.setCurrentPrize(temporaryPrize.value)
    //         return
    //     }
    //     for (let i = 0; i < prizeList.value.length; i++) {
    //         if (!prizeList.value[i].isUsed) {
    //             prizeConfig.setCurrentPrize(prizeList.value[i])

    //             break
    //         }
    //     }
    // }
    // 判断是否手机端访问
    function judgeMobile() {
        const ua = navigator.userAgent
        const isAndroid = ua.includes('Android') || ua.includes('Adr')
        const isIOS = !!ua.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)

        system.setIsMobile(isAndroid || isIOS)

        return isAndroid || isIOS
    }
    // 判断是否chrome或者edge访问
    function judgeChromeOrEdge() {
        const ua = navigator.userAgent
        const isChrome = ua.includes('Chrome')
        const isEdge = ua.includes('Edg')

        system.setIsChrome(isChrome)

        return isChrome || isEdge
    }
    const isShowMobileWarn = () => {
        const isMobilePage = judgeMobile()
        const { meta } = route
        let allowMobile = false
        if (meta && meta.isMobile) {
            allowMobile = true
        }
        return !allowMobile && isMobilePage
    }

    watch(() => data.value, () => {
        // WebSocket 数据处理，不再存储到 IndexedDB
    }, { immediate: true, deep: true })
    onMounted(async () => {
        themeChange(localTheme.value.name)

        // 先加载全局配置
        await globalConfig.fetchGlobalConfig()

        // 获取奖项列表
        await prizeConfig.fetchAllPrizes()

        // 只有在成功加载奖项数据且列表为空时，才询问用户是否使用默认数据
        // 使用 _hasLoadedPrizes 标志来区分"真正为空"和"加载失败"
        if (prizeConfig._hasLoadedPrizes && prizeList.value.length === 0 && defaultPrizeDialog) {
            // 设置对话框的提交函数
            defaultPrizeDialog.value.setSubmitFunc(async () => {
                try {
                    await prizeConfig.insertDefaultPrizes()
                    defaultPrizeDialog.value.closed()
                    // insertDefaultPrizes 已经设置了 currentPrize，不需要再调用 setCurrentPrize
                }
                catch (error) {
                    console.error('Failed to insert default prizes:', error)
                }
            })
            // 设置对话框的取消函数
            defaultPrizeDialog.value.setCancelFunc(() => {
                defaultPrizeDialog.value.closed()
            })
            // 显示对话框
            defaultPrizeDialog.value.showDialog()
        }
        // 注意：fetchAllPrizes 已经在内部调用了 api_setCurrentPrize，不需要再调用 setCurrentPrize()

        if (isShowMobileWarn()) {
            tipDialog.value.showDialog()
            tipDesc.value = t('dialog.dialogPCWeb')
        }
        else if (!judgeChromeOrEdge() && !(route.meta && route.meta.isMobile)) {
            tipDialog.value.showDialog()
            tipDesc.value = t('dialog.dialogLatestBrowser')
        }
    })

    return { tipDesc }
}
