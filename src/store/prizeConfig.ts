import type { IPrizeConfig } from '@/types/storeType'
import { defineStore } from 'pinia'
import * as prizeApi from '@/api/prizes'
import { defaultCurrentPrize, defaultPrizeList } from './data'

export const usePrizeConfig = defineStore('prize', {
    state() {
        return {
            prizeConfig: {
                prizeList: defaultPrizeList,
                currentPrize: defaultCurrentPrize,
                temporaryPrize: {
                    id: '',
                    name: '',
                    sort: 0,
                    isAll: false,
                    count: 1,
                    isUsedCount: 0,
                    picture: {
                        id: '-1',
                        name: '',
                        url: '',
                    },
                    separateCount: {
                        enable: true,
                        countList: [],
                    },
                    desc: '',
                    isShow: false,
                    isUsed: false,
                    frequency: 1,
                } as IPrizeConfig,
            },
            _isFetchingPrizes: false,
        }
    },
    getters: {
    // 获取全部配置
        getPrizeConfigAll(state) {
            return state.prizeConfig
        },
        // 获取奖品列表
        getPrizeConfig(state) {
            return state.prizeConfig.prizeList
        },
        // 根据id获取配置
        getPrizeConfigById(state) {
            return (id: number | string) => {
                return state.prizeConfig.prizeList.find(item => item.id === id)
            }
        },
        // 获取当前奖项
        getCurrentPrize(state) {
            return state.prizeConfig.currentPrize
        },
        // 获取临时的奖项
        getTemporaryPrize(state) {
            return state.prizeConfig.temporaryPrize
        },

    },
    actions: {
        // 获取数据加载Promise，用于等待数据加载完成
        async getDataLoadPromise() {
            // 每次都重新加载数据，确保从服务端获取最新状态
            return await this.fetchAllPrizes()
        },
        // 从数据库加载所有奖项
        async fetchAllPrizes() {
            if (this._isFetchingPrizes) {
                return this.prizeConfig.prizeList
            }
            this._isFetchingPrizes = true
            try {
                const prizes = await prizeApi.api_getAllPrizes()
                if (prizes.length === 0) {
                    console.log('No prizes found in backend')
                    this.prizeConfig.prizeList = []
                    return []
                }
                this.prizeConfig.prizeList = prizes
                // 只有当当前奖项未设置时，才自动设置当前奖项
                // 这样避免在抽奖过程中自动切换到下一个奖项
                if (prizes.length > 0 && !this.prizeConfig.currentPrize.id) {
                    const firstUnused = prizes.find(p => !p.isUsed && p.isUsedCount < p.count)
                    if (firstUnused) {
                        const result = await prizeApi.api_setCurrentPrize(firstUnused.id as number)
                        this.prizeConfig.currentPrize = result.prize
                        console.log(`已设置当前奖项: ${result.prize.name}`)
                    }
                    else {
                        // 所有奖项都已使用，设置第一个奖项为当前奖项
                        const result = await prizeApi.api_setCurrentPrize(prizes[0].id as number)
                        this.prizeConfig.currentPrize = result.prize
                        console.log(`所有奖项已完成，设置当前奖项为: ${result.prize.name}`)
                    }
                }
                else if (prizes.length > 0 && this.prizeConfig.currentPrize.id) {
                    // 如果当前奖项已设置，同步更新奖项列表中的对应奖项
                    const currentIndex = prizes.findIndex(p => p.id === this.prizeConfig.currentPrize.id)
                    if (currentIndex !== -1) {
                        this.prizeConfig.currentPrize = prizes[currentIndex]
                    }
                }
                return prizes
            }
            catch (error) {
                console.error('Failed to fetch prizes:', error)
                console.log('Failed to fetch prizes from backend, returning empty list')
                this.prizeConfig.prizeList = []
                return []
            }
            finally {
                this._isFetchingPrizes = false
            }
        },
        // 插入默认奖项到数据库
        async insertDefaultPrizes() {
            try {
                console.log('Inserting default prizes to database')
                const createdPrizes = await prizeApi.api_createPrizesBatch(defaultPrizeList)
                this.prizeConfig.prizeList = createdPrizes
                // 设置第一个未使用的奖项为当前奖项（同时检查 isUsed 和 isUsedCount）
                const firstUnused = createdPrizes.find(p => !p.isUsed && p.isUsedCount < p.count)
                if (firstUnused) {
                    // 调用后端API设置当前奖项
                    const result = await prizeApi.api_setCurrentPrize(firstUnused.id as number)
                    this.prizeConfig.currentPrize = result.prize
                    console.log(`已设置当前奖项: ${result.prize.name}`)
                }
                else {
                    // 如果所有奖项都已使用，设置第一个奖项为当前奖项
                    const result = await prizeApi.api_setCurrentPrize(createdPrizes[0].id as number)
                    this.prizeConfig.currentPrize = result.prize
                    console.log(`已设置当前奖项: ${result.prize.name}`)
                }
                return createdPrizes
            }
            catch (error) {
                console.error('Failed to insert default prizes:', error)
                throw error
            }
        },
        // 从数据库加载当前奖项
        async fetchCurrentPrize() {
            try {
                const prize = await prizeApi.api_getCurrentPrize()
                this.prizeConfig.currentPrize = prize
                return prize
            }
            catch (error) {
                console.error('Failed to fetch current prize:', error)
                console.log('Failed to fetch current prize from backend, returning null')
                return null
            }
        },
        // 设置奖项
        setPrizeConfig(prizeList: IPrizeConfig[]) {
            this.prizeConfig.prizeList = prizeList
        },
        // 添加奖项
        async addPrizeConfig(prizeConfigItem: IPrizeConfig) {
            try {
                const newPrize = await prizeApi.api_createPrize(prizeConfigItem)
                this.prizeConfig.prizeList.push(newPrize)
                return newPrize
            }
            catch (error) {
                console.error('Failed to create prize:', error)
                throw error
            }
        },
        // 删除奖项
        async deletePrizeConfig(prizeConfigItemId: number | string) {
            try {
                await prizeApi.api_deletePrize(prizeConfigItemId as number)
                this.prizeConfig.prizeList = this.prizeConfig.prizeList.filter(item => item.id !== prizeConfigItemId)
            }
            catch (error) {
                console.error('Failed to delete prize:', error)
                throw error
            }
        },
        // 更新奖项数据
        async updatePrizeConfig(prizeConfigItem: IPrizeConfig) {
            try {
                const updatedPrize = await prizeApi.api_updatePrize(prizeConfigItem.id as number, prizeConfigItem)
                const index = this.prizeConfig.prizeList.findIndex(item => item.id === prizeConfigItem.id)
                if (index !== -1) {
                    this.prizeConfig.prizeList[index] = updatedPrize
                }
                // 如果更新的奖品是当前奖品，同步更新 currentPrize
                if (this.prizeConfig.currentPrize.id === prizeConfigItem.id) {
                    this.prizeConfig.currentPrize = updatedPrize
                }

                // 不再自动切换到下一个奖项，由用户手动选择
                this.resetTemporaryPrize()
            }
            catch (error) {
                console.error('Failed to update prize:', error)
                throw error
            }
        },
        // 删除全部奖项
        async deleteAllPrizeConfig() {
            try {
                await prizeApi.api_deleteAllPrizes()
                this.prizeConfig.prizeList = [] as IPrizeConfig[]
            }
            catch (error) {
                console.error('Failed to delete all prizes:', error)
                throw error
            }
        },
        // 设置当前奖项
        async setCurrentPrize(prizeConfigItem: IPrizeConfig) {
            try {
                const result = await prizeApi.api_setCurrentPrize(prizeConfigItem.id as number)
                // 使用后端返回的最新数据更新 currentPrize
                this.prizeConfig.currentPrize = result.prize
                // 同步更新 prizeList 中对应的奖项
                const index = this.prizeConfig.prizeList.findIndex(item => item.id === result.prize.id)
                if (index !== -1) {
                    this.prizeConfig.prizeList[index] = result.prize
                }
            }
            catch (error) {
                console.error('Failed to set current prize:', error)
                throw error
            }
        },
        // 设置临时奖项
        setTemporaryPrize(prizeItem: IPrizeConfig) {
            if (prizeItem.isShow === false) {
                for (let i = 0; i < this.prizeConfig.prizeList.length; i++) {
                    // 检查是否真正未完成（同时检查 isUsed 和 isUsedCount）
                    if (this.prizeConfig.prizeList[i].isUsed === false && this.prizeConfig.prizeList[i].isUsedCount < this.prizeConfig.prizeList[i].count) {
                        this.setCurrentPrize(this.prizeConfig.prizeList[i])

                        break
                    }
                }
                this.resetTemporaryPrize()

                return
            }

            this.prizeConfig.temporaryPrize = prizeItem
        },
        // 重置临时奖项
        resetTemporaryPrize() {
            this.prizeConfig.temporaryPrize = {
                id: '',
                name: '',
                sort: 0,
                isAll: false,
                count: 1,
                isUsedCount: 0,
                picture: {
                    id: '-1',
                    name: '',
                    url: '',
                },
                separateCount: {
                    enable: true,
                    countList: [],
                },
                desc: '',
                isShow: false,
                isUsed: false,
                frequency: 1,
            } as IPrizeConfig
        },
        // 重置所有奖项
        async resetPrizes() {
            try {
                await prizeApi.api_resetPrizes()
                await this.fetchAllPrizes()
            }
            catch (error) {
                console.error('Failed to reset prizes:', error)
                throw error
            }
        },
        // 重新加载所有奖项数据（用于修复数据不一致问题）
        async reloadPrizes() {
            try {
                this._isFetchingPrizes = false
                const prizes = await this.fetchAllPrizes()
                console.log('重新加载奖品数据完成:', prizes)
                return prizes
            }
            catch (error) {
                console.error('Failed to reload prizes:', error)
                throw error
            }
        },
        // 重置所有配置
        resetDefault() {
            this.prizeConfig = {
                prizeList: defaultPrizeList,
                currentPrize: defaultCurrentPrize,
                temporaryPrize: {
                    id: '',
                    name: '',
                    sort: 0,
                    isAll: false,
                    count: 1,
                    isUsedCount: 0,
                    picture: {
                        id: '-1',
                        name: '',
                        url: '',
                    },
                    separateCount: {
                        enable: true,
                        countList: [],
                    },
                    desc: '',
                    isShow: false,
                    isUsed: false,
                    frequency: 1,
                } as IPrizeConfig,
            }
        },
    },
})
