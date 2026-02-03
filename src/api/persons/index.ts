import type { IPersonConfig } from '@/types/storeType'
import request from '../request'

// 后端数据结构（snake_case）
interface BackendPerson {
    id: number
    uid: string
    uuid: string
    name: string
    department: string
    identity: string
    avatar: string
    thumbnail_avatar?: string
    position: string
    device_fingerprint: string
    is_win: boolean
    x: number
    y: number
    create_time: string
    update_time: string
    prize_name: string[]
    prize_id: string[]
    prize_time: string[]
}

// 将后端数据转换为前端数据（snake_case -> camelCase）
function backendToFrontend(person: BackendPerson): IPersonConfig {
    return {
        id: person.id,
        uid: person.uid,
        uuid: person.uuid,
        name: person.name,
        department: person.department,
        identity: person.identity,
        position: person.position,
        deviceFingerprint: person.device_fingerprint,
        avatar: person.avatar,
        thumbnailAvatar: person.thumbnail_avatar,
        isWin: person.is_win,
        x: person.x,
        y: person.y,
        createTime: person.create_time,
        updateTime: person.update_time,
        prizeName: person.prize_name,
        prizeId: person.prize_id,
        prizeTime: person.prize_time,
    }
}

// 将前端数据转换为后端数据（camelCase -> snake_case）
function frontendToBackend(person: IPersonConfig): BackendPerson {
    return {
        id: person.id,
        uid: person.uid,
        uuid: person.uuid,
        name: person.name,
        department: person.department,
        identity: person.identity,
        position: person.position,
        device_fingerprint: person.deviceFingerprint,
        avatar: person.avatar,
        thumbnail_avatar: person.thumbnailAvatar,
        is_win: person.isWin,
        x: person.x,
        y: person.y,
        create_time: person.createTime,
        update_time: person.updateTime,
        prize_name: person.prizeName,
        prize_id: person.prizeId,
        prize_time: person.prizeTime,
    }
}

/**
 * 获取所有人员
 */
export function api_getAllPersons() {
    return request<BackendPerson[]>({
        url: '/persons/',
        method: 'GET',
    }, true).then(data => data.map(backendToFrontend))
}

/**
 * 根据ID获取人员
 */
export function api_getPersonById(id: number) {
    return request<BackendPerson>({
        url: `/persons/${id}`,
        method: 'GET',
    }, true).then(backendToFrontend)
}

/**
 * 根据UUID获取人员
 */
export function api_getPersonByUuid(uuid: string) {
    return request<BackendPerson>({
        url: `/persons/uuid/${uuid}`,
        method: 'GET',
    }, true).then(backendToFrontend)
}

/**
 * 创建人员
 */
export function api_createPerson(person: IPersonConfig) {
    return request<BackendPerson>({
        url: '/persons/',
        method: 'POST',
        data: frontendToBackend(person),
    }).then(backendToFrontend)
}

/**
 * 批量创建人员
 */
export function api_createPersonsBatch(persons: IPersonConfig[]) {
    return request<BackendPerson[]>({
        url: '/persons/batch',
        method: 'POST',
        data: persons.map(frontendToBackend),
    }).then(data => data.map(backendToFrontend))
}

/**
 * 更新人员
 */
export function api_updatePerson(id: number, person: Partial<IPersonConfig>) {
    const backendPerson: Partial<BackendPerson> = {}
    if (person.uid !== undefined)
        backendPerson.uid = person.uid
    if (person.uuid !== undefined)
        backendPerson.uuid = person.uuid
    if (person.name !== undefined)
        backendPerson.name = person.name
    if (person.department !== undefined)
        backendPerson.department = person.department
    if (person.identity !== undefined)
        backendPerson.identity = person.identity
    if (person.avatar !== undefined)
        backendPerson.avatar = person.avatar
    if (person.thumbnailAvatar !== undefined)
        backendPerson.thumbnail_avatar = person.thumbnailAvatar
    if (person.isWin !== undefined)
        backendPerson.is_win = person.isWin
    if (person.x !== undefined)
        backendPerson.x = person.x
    if (person.y !== undefined)
        backendPerson.y = person.y
    if (person.createTime !== undefined)
        backendPerson.create_time = person.createTime
    if (person.updateTime !== undefined)
        backendPerson.update_time = person.updateTime
    if (person.prizeName !== undefined)
        backendPerson.prize_name = person.prizeName
    if (person.prizeId !== undefined)
        backendPerson.prize_id = person.prizeId
    if (person.prizeTime !== undefined)
        backendPerson.prize_time = person.prizeTime
    if (person.position !== undefined)
        backendPerson.position = person.position
    if (person.deviceFingerprint !== undefined)
        backendPerson.device_fingerprint = person.deviceFingerprint

    return request<BackendPerson>({
        url: `/persons/${id}`,
        method: 'PUT',
        data: backendPerson,
    }).then(backendToFrontend)
}

/**
 * 删除人员
 */
export function api_deletePerson(id: number) {
    return request<{ status: string, message: string }>({
        url: `/persons/${id}`,
        method: 'DELETE',
    })
}

/**
 * 删除所有人员
 */
export function api_deleteAllPersons() {
    return request<{ status: string, message: string }>({
        url: '/persons/',
        method: 'DELETE',
    })
}

/**
 * 获取已中奖人员列表
 */
export function api_getAlreadyWonPersons() {
    return request<BackendPerson[]>({
        url: '/persons/already/list',
        method: 'GET',
    }).then(data => data.map(backendToFrontend))
}

/**
 * 获取未中奖人员列表
 */
export function api_getNotWonPersons() {
    return request<BackendPerson[]>({
        url: '/persons/not/list',
        method: 'GET',
    }).then(data => data.map(backendToFrontend))
}

/**
 * 获取未中此奖的人员列表
 */
export function api_getNotWonThisPrizePersons(prizeId: string) {
    return request<BackendPerson[]>({
        url: `/persons/not/prize/${prizeId}`,
        method: 'GET',
    }).then(data => data.map(backendToFrontend))
}

/**
 * 重置中奖状态
 */
export function api_resetWonStatus() {
    return request<{ status: string, message: string }>({
        url: '/persons/reset/won',
        method: 'POST',
    })
}

/**
 * 根据设备指纹获取人员
 */
export function api_getPersonByDeviceFingerprint(deviceFingerprint: string) {
    return request<BackendPerson>({
        url: `/persons/device`,
        method: 'GET',
        params: { device_fingerprint: deviceFingerprint },
    }, false, false).then(backendToFrontend)
}

/**
 * 根据设备指纹删除人员
 */
export function api_deletePersonByDeviceFingerprint(deviceFingerprint: string) {
    return request<{ status: string, message: string }>({
        url: `/persons/device`,
        method: 'DELETE',
        params: { device_fingerprint: deviceFingerprint },
    })
}
