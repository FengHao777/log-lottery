import type { IDepartment } from '@/types/storeType'
import request from '../request'

// 后端数据结构（snake_case）
interface BackendDepartment {
    id: number
    name: string
    sort: number
    create_time: string
    update_time: string
}

// 将后端数据转换为前端数据（snake_case -> camelCase）
function backendToFrontend(department: BackendDepartment): IDepartment {
    return {
        id: department.id,
        name: department.name,
        sort: department.sort,
        createTime: department.create_time,
        updateTime: department.update_time,
    }
}

// 将前端数据转换为后端数据（camelCase -> snake_case）
function frontendToBackend(department: IDepartment): BackendDepartment {
    return {
        id: department.id,
        name: department.name,
        sort: department.sort,
        create_time: department.createTime,
        update_time: department.updateTime,
    }
}

/**
 * 获取所有部门
 */
export function api_getAllDepartments() {
    return request<BackendDepartment[]>({
        url: '/departments/',
        method: 'GET',
    }, true).then(data => data.map(backendToFrontend))
}

/**
 * 根据ID获取部门
 */
export function api_getDepartmentById(id: number) {
    return request<BackendDepartment>({
        url: `/departments/${id}`,
        method: 'GET',
    }, true).then(backendToFrontend)
}

/**
 * 创建部门
 */
export function api_createDepartment(department: IDepartment) {
    return request<BackendDepartment>({
        url: '/departments/',
        method: 'POST',
        data: frontendToBackend(department),
    }).then(backendToFrontend)
}

/**
 * 更新部门
 */
export function api_updateDepartment(id: number, department: Partial<IDepartment>) {
    const backendDepartment: Partial<BackendDepartment> = {}
    if (department.name !== undefined)
        backendDepartment.name = department.name
    if (department.sort !== undefined)
        backendDepartment.sort = department.sort
    if (department.updateTime !== undefined)
        backendDepartment.update_time = department.updateTime

    return request<BackendDepartment>({
        url: `/departments/${id}`,
        method: 'PUT',
        data: backendDepartment,
    }).then(backendToFrontend)
}

/**
 * 删除部门
 */
export function api_deleteDepartment(id: number) {
    return request<{ status: string, message: string }>({
        url: `/departments/${id}`,
        method: 'DELETE',
    })
}

/**
 * 删除所有部门
 */
export function api_deleteAllDepartments() {
    return request<{ status: string, message: string }>({
        url: '/departments/',
        method: 'DELETE',
    })
}
