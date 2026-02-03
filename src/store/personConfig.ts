import type { IPersonConfig, IPrizeConfig } from '@/types/storeType'
import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { computed, ref } from 'vue'
import * as personApi from '@/api/persons'
import { usePrizeConfig } from './prizeConfig'

// 默认人员列表（空）
const defaultPersonList: IPersonConfig[] = []

// 获取IPersonConfig的key组成数组
export const personListKey = Object.keys({
    id: 0,
    uid: '',
    uuid: '',
    name: '',
    department: '',
    position: '',
    identity: '',
    avatar: '',
    thumbnailAvatar: '',
    deviceFingerprint: '',
    isWin: false,
    x: 0,
    y: 0,
    createTime: '',
    updateTime: '',
    prizeName: [],
    prizeId: [],
    prizeTime: [],
} as IPersonConfig)
export const usePersonConfig = defineStore('person', () => {
    const _isFetchingPersons = ref(false)
    // NOTE: state
    const personConfig = ref({
        allPersonList: [] as IPersonConfig[],
        alreadyPersonList: [] as IPersonConfig[],
    })
    // 从数据库加载所有人员
    async function fetchAllPersons() {
        if (_isFetchingPersons.value) {
            return personConfig.value.allPersonList
        }
        _isFetchingPersons.value = true
        try {
            const persons = await personApi.api_getAllPersons()
            if (persons.length === 0) {
                console.log('No persons found in backend')
                personConfig.value.allPersonList = []
                personConfig.value.alreadyPersonList = []
                return []
            }
            personConfig.value.allPersonList = persons
            personConfig.value.alreadyPersonList = persons.filter(p => p.isWin)
            return persons
        }
        catch (error) {
            console.error('Failed to fetch persons:', error)
            console.log('Failed to fetch persons from backend, returning empty list')
            personConfig.value.allPersonList = []
            personConfig.value.alreadyPersonList = []
            return []
        }
        finally {
            _isFetchingPersons.value = false
        }
    }
    // 插入默认人员到数据库
    async function insertDefaultPersons() {
        try {
            console.log('Inserting default persons to database')
            const defaultPersonsWithUuid = defaultPersonList.map((item: any) => {
                item.uuid = uuidv4()
                return item
            })
            const createdPersons = await personApi.api_createPersonsBatch(defaultPersonsWithUuid)
            personConfig.value.allPersonList = createdPersons
            personConfig.value.alreadyPersonList = []
            return createdPersons
        }
        catch (error) {
            console.error('Failed to insert default persons:', error)
            throw error
        }
    }
    // 从数据库加载已中奖人员
    async function fetchAlreadyWonPersons() {
        try {
            const persons = await personApi.api_getAlreadyWonPersons()
            personConfig.value.alreadyPersonList = persons
            return persons
        }
        catch (error) {
            console.error('Failed to fetch already won persons:', error)
            // 如果请求失败，返回空数组
            console.log('Failed to fetch already won persons from backend, returning empty list')
            personConfig.value.alreadyPersonList = []
            return []
        }
    }
    // 从数据库加载未中奖人员
    async function fetchNotWonPersons() {
        try {
            const persons = await personApi.api_getNotWonPersons()
            return persons
        }
        catch (error) {
            console.error('Failed to fetch not won persons:', error)
            // 如果请求失败，返回空数组
            console.log('Failed to fetch not won persons from backend, returning empty list')
            return []
        }
    }
    // 从数据库加载未中此奖的人员
    async function fetchNotWonThisPrizePersons(prizeId: string) {
        try {
            const persons = await personApi.api_getNotWonThisPrizePersons(prizeId)
            return persons
        }
        catch (error) {
            console.error('Failed to fetch not won this prize persons:', error)
            // 如果请求失败，返回空数组
            console.log('Failed to fetch not won this prize persons from backend, returning empty list')
            return []
        }
    }
    // 获取数据加载Promise，用于等待数据加载完成
    async function getDataLoadPromise() {
        // 每次都重新加载数据，确保从服务端获取最新状态
        return await fetchAllPersons()
    }

    // 初始化时从数据库加载数据
    // 移除自动加载，由getDataLoadPromise控制加载时机

    // NOTE: getter
    // 获取全部配置
    const getPersonConfig = computed(() => personConfig.value)
    // 获取全部人员名单
    const getAllPersonList = computed(() => personConfig.value.allPersonList)
    // 获取未获此奖的人员名单
    const getNotThisPrizePersonList = computed(() => {
        const prizeConfig = usePrizeConfig()
        const currentPrizeId = prizeConfig.prizeConfig.currentPrize.id
        const data = personConfig.value.allPersonList.filter((item: IPersonConfig) => {
            return !item.prizeId.includes(currentPrizeId as string)
        })

        return data
    })

    // 获取已中奖人员名单
    const getAlreadyPersonList = computed(() => {
        return personConfig.value.allPersonList.filter((item: IPersonConfig) => {
            return item.isWin === true
        })
    })
    // 获取中奖人员详情
    const getAlreadyPersonDetail = computed(() => personConfig.value.alreadyPersonList)
    // 获取未中奖人员名单
    const getNotPersonList = computed(() => personConfig.value.allPersonList.filter((item: IPersonConfig) => {
        return item.isWin === false
    }))
    // NOTE: action
    // 添加全部未中奖人员
    async function addNotPersonList(personList: IPersonConfig[]) {
        if (personList.length <= 0) {
            return
        }
        try {
            const newPersons = await personApi.api_createPersonsBatch(personList)
            personConfig.value.allPersonList.push(...newPersons)
        }
        catch (error) {
            console.error('Failed to create persons:', error)
            throw error
        }
    }
    // 添加数据
    async function addOnePerson(person: IPersonConfig[]) {
        if (person.length <= 0) {
            return
        }
        if (person.length > 1) {
            console.warn('只支持添加单个用户')
            return
        }
        try {
            const newPerson = await personApi.api_createPerson(person[0])
            personConfig.value.allPersonList.push(newPerson)
        }
        catch (error) {
            console.error('Failed to create person:', error)
            throw error
        }
    }
    // 添加已中奖人员
    async function addAlreadyPersonList(personList: IPersonConfig[], prize: IPrizeConfig | null) {
        if (personList.length <= 0) {
            return
        }
        try {
            for (const person of personList) {
                const updateData: Partial<IPersonConfig> = {
                    isWin: true,
                    prizeName: [...person.prizeName, prize?.name || ''],
                    prizeTime: [...person.prizeTime, dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss')],
                    prizeId: [...person.prizeId, prize?.id?.toString() || ''],
                }
                await personApi.api_updatePerson(person.id, updateData)
                // 更新本地状态
                const index = personConfig.value.allPersonList.findIndex(item => item.id === person.id)
                if (index !== -1) {
                    const updatedPerson = {
                        ...person,
                        ...updateData,
                    }
                    personConfig.value.allPersonList[index] = updatedPerson
                    // 检查是否已在已中奖列表中，避免重复添加
                    const alreadyIndex = personConfig.value.alreadyPersonList.findIndex(item => item.id === person.id)
                    if (alreadyIndex === -1) {
                        personConfig.value.alreadyPersonList.push(updatedPerson)
                    }
                    else {
                        // 如果已存在，更新该人员的信息
                        personConfig.value.alreadyPersonList[alreadyIndex] = updatedPerson
                    }
                }
            }
        }
        catch (error) {
            console.error('Failed to update persons:', error)
            throw error
        }
    }
    // 从已中奖移动到未中奖
    async function moveAlreadyToNot(person: IPersonConfig) {
        if (person.id === undefined || person.id == null) {
            return
        }
        try {
            const updateData: Partial<IPersonConfig> = {
                isWin: false,
                prizeName: [],
                prizeTime: [],
                prizeId: [],
            }
            await personApi.api_updatePerson(person.id, updateData)
            // 更新本地状态
            const index = personConfig.value.allPersonList.findIndex(item => item.id === person.id)
            if (index !== -1) {
                personConfig.value.allPersonList[index] = {
                    ...person,
                    ...updateData,
                }
            }
            personConfig.value.alreadyPersonList = personConfig.value.alreadyPersonList.filter(
                item => item.id !== person.id,
            )
        }
        catch (error) {
            console.error('Failed to move person:', error)
            throw error
        }
    }
    // 删除指定人员
    async function deletePerson(person: IPersonConfig) {
        if (person.id !== undefined || person.id != null) {
            try {
                await personApi.api_deletePerson(person.id)
                // 更新本地状态
                personConfig.value.allPersonList = personConfig.value.allPersonList.filter((item: IPersonConfig) => item.id !== person.id)
                personConfig.value.alreadyPersonList = personConfig.value.alreadyPersonList.filter((item: IPersonConfig) => item.id !== person.id)
            }
            catch (error) {
                console.error('Failed to delete person:', error)
                throw error
            }
        }
    }
    // 删除所有人员
    async function deleteAllPerson() {
        try {
            await personApi.api_deleteAllPersons()
            // 更新本地状态
            personConfig.value.allPersonList = []
            personConfig.value.alreadyPersonList = []
        }
        catch (error) {
            console.error('Failed to delete all persons:', error)
            throw error
        }
    }

    // 删除所有人员
    async function resetPerson() {
        try {
            await personApi.api_deleteAllPersons()
            // 更新本地状态
            personConfig.value.allPersonList = []
            personConfig.value.alreadyPersonList = []
        }
        catch (error) {
            console.error('Failed to reset persons:', error)
            throw error
        }
    }
    // 重置已中奖人员
    async function resetAlreadyPerson() {
        try {
            await personApi.api_resetWonStatus()
            // 把已中奖人员合并到未中奖人员，要验证是否已存在
            personConfig.value.allPersonList.forEach((item: IPersonConfig) => {
                item.isWin = false
                item.prizeName = []
                item.prizeTime = []
                item.prizeId = []
            })
            personConfig.value.alreadyPersonList = []
        }
        catch (error) {
            console.error('Failed to reset already won persons:', error)
            throw error
        }
    }
    function setDefaultPersonList() {
        personConfig.value.allPersonList = defaultPersonList.map((item: any) => {
            item.uuid = uuidv4()
            return item
        })
        personConfig.value.alreadyPersonList = []
    }
    // 重置所有配置
    function reset() {
        personConfig.value = {
            allPersonList: [] as IPersonConfig[],
            alreadyPersonList: [] as IPersonConfig[],
        }
    }
    return {
        personConfig,
        getPersonConfig,
        getAllPersonList,
        getNotThisPrizePersonList,
        getAlreadyPersonList,
        getAlreadyPersonDetail,
        getNotPersonList,
        fetchAllPersons,
        fetchAlreadyWonPersons,
        fetchNotWonPersons,
        fetchNotWonThisPrizePersons,
        addNotPersonList,
        addOnePerson,
        addAlreadyPersonList,
        moveAlreadyToNot,
        deletePerson,
        deleteAllPerson,
        resetPerson,
        resetAlreadyPerson,
        setDefaultPersonList,
        reset,
        getDataLoadPromise,
    }
})
