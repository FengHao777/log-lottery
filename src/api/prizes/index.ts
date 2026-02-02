import type { IPrizeConfig } from '@/types/storeType'
import request from '../request'

// 后端数据结构（snake_case）
interface BackendPrize {
    id: number
    name: string
    sort: number
    is_all: boolean
    count: number
    is_used_count: number
    picture_id: string
    picture_name: string
    picture_url: string
    separate_count_enable: boolean
    separate_count_list: Array<{ id: string, count: number, is_used_count: number }>
    desc: string
    is_show: boolean
    is_used: boolean
    frequency: number
}

// 将后端数据转换为前端数据（snake_case -> camelCase）
function backendToFrontend(prize: BackendPrize): IPrizeConfig {
    return {
        id: prize.id,
        name: prize.name,
        sort: prize.sort,
        isAll: prize.is_all,
        count: prize.count,
        isUsedCount: prize.is_used_count,
        picture: {
            id: prize.picture_id,
            name: prize.picture_name,
            url: prize.picture_url,
        },
        separateCount: {
            enable: prize.separate_count_enable,
            countList: prize.separate_count_list
                ? prize.separate_count_list.map(item => ({
                    id: item.id,
                    count: item.count,
                    isUsedCount: item.is_used_count,
                }))
                : [],
        },
        desc: prize.desc,
        isShow: prize.is_show,
        isUsed: prize.is_used,
        frequency: prize.frequency,
    }
}

// 将前端数据转换为后端数据（camelCase -> snake_case）
function frontendToBackend(prize: IPrizeConfig): BackendPrize {
    return {
        id: prize.id as number,
        name: prize.name,
        sort: prize.sort,
        is_all: prize.isAll,
        count: prize.count,
        is_used_count: prize.isUsedCount,
        picture_id: prize.picture.id,
        picture_name: prize.picture.name,
        picture_url: typeof prize.picture.url === 'string' ? prize.picture.url : '',
        separate_count_enable: prize.separateCount.enable,
        separate_count_list: prize.separateCount.countList.map(item => ({
            id: item.id,
            count: item.count,
            is_used_count: item.isUsedCount,
        })),
        desc: prize.desc,
        is_show: prize.isShow,
        is_used: prize.isUsed,
        frequency: prize.frequency,
    }
}

/**
 * 获取所有奖项
 */
export function api_getAllPrizes() {
    return request<BackendPrize[]>({
        url: '/prizes/',
        method: 'GET',
    }, true).then(data => data.map(backendToFrontend))
}

/**
 * 根据ID获取奖项
 */
export function api_getPrizeById(id: number) {
    return request<BackendPrize>({
        url: `/prizes/${id}`,
        method: 'GET',
    }, true).then(backendToFrontend)
}

/**
 * 获取当前奖项
 */
export function api_getCurrentPrize() {
    return request<BackendPrize>({
        url: '/prizes/current',
        method: 'GET',
    }, true).then(backendToFrontend)
}

/**
 * 创建奖项
 */
export function api_createPrize(prize: IPrizeConfig) {
    return request<BackendPrize>({
        url: '/prizes/',
        method: 'POST',
        data: frontendToBackend(prize),
    }).then(backendToFrontend)
}

/**
 * 批量创建奖项
 */
export function api_createPrizesBatch(prizes: IPrizeConfig[]) {
    return request<BackendPrize[]>({
        url: '/prizes/batch',
        method: 'POST',
        data: prizes.map(frontendToBackend),
    }).then(data => data.map(backendToFrontend))
}

/**
 * 更新奖项
 */
export function api_updatePrize(id: number, prize: Partial<IPrizeConfig>) {
    const backendPrize: Partial<BackendPrize> = {}
    if (prize.name !== undefined)
        backendPrize.name = prize.name
    if (prize.sort !== undefined)
        backendPrize.sort = prize.sort
    if (prize.isAll !== undefined)
        backendPrize.is_all = prize.isAll
    if (prize.count !== undefined)
        backendPrize.count = prize.count
    if (prize.isUsedCount !== undefined)
        backendPrize.is_used_count = prize.isUsedCount
    if (prize.picture !== undefined) {
        backendPrize.picture_id = prize.picture.id
        backendPrize.picture_name = prize.picture.name
        backendPrize.picture_url = typeof prize.picture.url === 'string' ? prize.picture.url : ''
    }
    if (prize.separateCount !== undefined) {
        backendPrize.separate_count_enable = prize.separateCount.enable
        backendPrize.separate_count_list = prize.separateCount.countList.map(item => ({
            id: item.id,
            count: item.count,
            is_used_count: item.isUsedCount,
        }))
    }
    if (prize.desc !== undefined)
        backendPrize.desc = prize.desc
    if (prize.isShow !== undefined)
        backendPrize.is_show = prize.isShow
    if (prize.isUsed !== undefined)
        backendPrize.is_used = prize.isUsed
    if (prize.frequency !== undefined)
        backendPrize.frequency = prize.frequency

    return request<BackendPrize>({
        url: `/prizes/${id}`,
        method: 'PUT',
        data: backendPrize,
    }).then(backendToFrontend)
}

/**
 * 删除奖项
 */
export function api_deletePrize(id: number) {
    return request<{ status: string, message: string }>({
        url: `/prizes/${id}`,
        method: 'DELETE',
    })
}

/**
 * 删除所有奖项
 */
export function api_deleteAllPrizes() {
    return request<{ status: string, message: string }>({
        url: '/prizes/',
        method: 'DELETE',
    })
}

/**
 * 设置当前奖项
 */
export function api_setCurrentPrize(id: number) {
    return request<{ status: string, message: string, prize: BackendPrize }>({
        url: `/prizes/${id}/set-current`,
        method: 'POST',
    }).then(data => ({
        ...data,
        prize: backendToFrontend(data.prize),
    }))
}

/**
 * 重置所有奖项
 */
export function api_resetPrizes() {
    return request<{ status: string, message: string }>({
        url: '/prizes/reset',
        method: 'POST',
    })
}
