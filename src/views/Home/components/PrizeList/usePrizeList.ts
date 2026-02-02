import type { IPrizeConfig } from '@/types/storeType'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import i18n from '@/locales/i18n'

import useStore from '@/store'

export function usePrizeList(temporaryPrizeRef: any) {
    const prizeConfig = useStore().prizeConfig
    const globalConfig = useStore().globalConfig
    const system = useStore().system
    const {
        getPrizeConfig: localPrizeList,
        getCurrentPrize: currentPrize,
        getTemporaryPrize: temporaryPrize,
    } = storeToRefs(prizeConfig)
    const {
        getIsShowPrizeList: isShowPrizeList,
        getImageList: localImageList,
    }
        = storeToRefs(globalConfig)
    const { getIsMobile: isMobile } = storeToRefs(system)

    const selectedPrize = ref<IPrizeConfig | null>(null)
    const prizeShow = ref(structuredClone(isShowPrizeList.value))

    function addTemporaryPrize() {
        temporaryPrizeRef.value.showDialog()
    }

    function deleteTemporaryPrize() {
        temporaryPrize.value.isShow = false
        prizeConfig.setTemporaryPrize(temporaryPrize.value)
    }
    function submitTemporaryPrize() {
        if (!temporaryPrize.value.name || !temporaryPrize.value.count) {
            // eslint-disable-next-line no-alert
            alert(i18n.global.t('error.completeInformation'))
            return
        }
        temporaryPrize.value.isShow = true
        temporaryPrize.value.id = new Date().getTime().toString()
        prizeConfig.setCurrentPrize(temporaryPrize.value)
    }
    function selectPrize(item: IPrizeConfig) {
        selectedPrize.value = item
        selectedPrize.value.isUsedCount = 0
        selectedPrize.value.isUsed = false

        if (selectedPrize.value.separateCount.countList.length > 1) {
            return
        }
        selectedPrize.value.separateCount = {
            enable: true,
            countList: [
                {
                    id: '0',
                    count: item.count,
                    isUsedCount: 0,
                },
            ],
        }
    }
    function submitData(value: any) {
        selectedPrize.value!.separateCount.countList = value
        selectedPrize.value = null
    }
    function changePersonCount() {
        temporaryPrize.value.separateCount.countList = []
    }
    function setCurrentPrize() {
        // 如果奖项列表为空，不执行任何操作
        if (localPrizeList.value.length === 0) {
            return
        }
        for (let i = 0; i < localPrizeList.value.length; i++) {
            if (localPrizeList.value[i].isUsedCount < localPrizeList.value[i].count) {
                prizeConfig.setCurrentPrize(localPrizeList.value[i])

                return
            }
        }
    }
    // 注意：fetchAllPrizes 已经在内部调用了 api_setCurrentPrize，不需要再通过 watch 调用
    // 移除 watch，避免重复调用 setCurrentPrize
    onMounted(() => {
        // 不再在 onMounted 中调用 setCurrentPrize，由 fetchAllPrizes 处理
    })

    return {
        temporaryPrize,
        changePersonCount,
        selectPrize,
        currentPrize,
        localImageList,
        addTemporaryPrize,
        submitTemporaryPrize,
        submitData,
        deleteTemporaryPrize,
        prizeShow,
        localPrizeList,
        isMobile,
        selectedPrize,
    }
}
