import type { IPrizeConfig } from '@/types/storeType'
import { cloneDeep } from 'lodash-es'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useToast } from 'vue-toast-notification'
import i18n from '@/locales/i18n'
import useStore from '@/store'

export function usePrizeConfig() {
    const toast = useToast()
    const prizeConfig = useStore().prizeConfig
    const globalConfig = useStore().globalConfig
    const { getPrizeConfig: localPrizeList, getCurrentPrize: currentPrize } = storeToRefs(prizeConfig)

    const { getImageList: localImageList } = storeToRefs(globalConfig)
    const imgList = ref<any[]>([])

    const prizeList = ref<IPrizeConfig[]>([])
    const selectedPrize = ref<IPrizeConfig | null>()

    // 从数据库加载奖项列表
    async function loadPrizes() {
        try {
            await prizeConfig.fetchAllPrizes()
            prizeList.value = cloneDeep(localPrizeList.value)
            // 如果后端没有数据，询问用户是否插入默认奖项
            if (localPrizeList.value.length === 0) {
                const confirmed = confirm(i18n.global.t('dialog.insertDefaultPrizes'))
                if (confirmed) {
                    await prizeConfig.insertDefaultPrizes()
                    prizeList.value = cloneDeep(localPrizeList.value)
                }
            }
        }
        catch (error) {
            console.error('Failed to load prizes:', error)
            toast.error(i18n.global.t('error.loadFailed'))
        }
    }

    function selectPrize(item: IPrizeConfig) {
        selectedPrize.value = cloneDeep(item)
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

    async function changePrizeStatus(item: IPrizeConfig) {
        item.isUsed ? item.isUsedCount = 0 : item.isUsedCount = item.count
        item.separateCount.countList = []
        item.isUsed = !item.isUsed
        try {
            await prizeConfig.updatePrizeConfig(item)
        }
        catch (error) {
            console.error('Failed to update prize status:', error)
            toast.error(i18n.global.t('error.updateFailed'))
        }
    }

    async function changePrizePerson(item: IPrizeConfig) {
        let indexPrize = -1
        for (let i = 0; i < prizeList.value.length; i++) {
            if (prizeList.value[i].id === item.id) {
                indexPrize = i
                break
            }
        }
        if (indexPrize > -1) {
            prizeList.value[indexPrize].separateCount.countList = []
            prizeList.value[indexPrize].isUsed ? prizeList.value[indexPrize].isUsedCount = prizeList.value[indexPrize].count : prizeList.value[indexPrize].isUsedCount = 0
        }
        try {
            await prizeConfig.updatePrizeConfig(item)
        }
        catch (error) {
            console.error('Failed to update prize person count:', error)
            toast.error(i18n.global.t('error.updateFailed'))
        }
    }
    function submitData(value: any) {
        if (selectedPrize.value) {
            selectedPrize.value.separateCount.countList = value
            // 更新到数据库
            prizeConfig.updatePrizeConfig(selectedPrize.value).catch((error) => {
                console.error('Failed to update prize separate count:', error)
                toast.error(i18n.global.t('error.updateFailed'))
            })
        }
        selectedPrize.value = null
    }

    async function delItem(item: IPrizeConfig) {
        try {
            await prizeConfig.deletePrizeConfig(item.id)
            prizeList.value = prizeList.value.filter(p => p.id !== item.id)
            toast.success(i18n.global.t('error.deleteSuccess'))
        }
        catch (error) {
            console.error('Failed to delete prize:', error)
            toast.error(i18n.global.t('error.deleteFailed'))
        }
    }
    async function addPrize() {
        const defaultPrizeCOnfig: IPrizeConfig = {
            id: new Date().getTime().toString(),
            name: i18n.global.t('data.prizeName'),
            sort: 0,
            isAll: false,
            count: 1,
            isUsedCount: 0,
            picture: {
                id: '',
                name: '',
                url: '',
            },
            separateCount: {
                enable: false,
                countList: [],
            },
            desc: '',
            isUsed: false,
            isShow: true,
            frequency: 1,
        }
        try {
            const newPrize = await prizeConfig.addPrizeConfig(defaultPrizeCOnfig)
            prizeList.value.push(newPrize)
            toast.success(i18n.global.t('error.success'))
        }
        catch (error) {
            console.error('Failed to add prize:', error)
            toast.error(i18n.global.t('error.addFailed'))
        }
    }
    function resetDefault() {
        prizeConfig.resetDefault()
        prizeList.value = cloneDeep(localPrizeList.value)
        toast.success(i18n.global.t('error.success'))
    }
    async function delAll() {
        try {
            await prizeConfig.deleteAllPrizeConfig()
            prizeList.value = []
            toast.success(i18n.global.t('error.success'))
        }
        catch (error) {
            console.error('Failed to delete all prizes:', error)
            toast.error(i18n.global.t('error.deleteFailed'))
        }
    }
    onMounted(async () => {
        await loadPrizes()
    })

    return {
        addPrize,
        resetDefault,
        delAll,
        delItem,
        prizeList,
        currentPrize,
        selectedPrize,
        submitData,
        changePrizePerson,
        changePrizeStatus,
        selectPrize,
        localImageList,
    }
}
