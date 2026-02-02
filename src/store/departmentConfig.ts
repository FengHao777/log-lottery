import type { IDepartment } from '@/types/storeType'
import { defineStore } from 'pinia'
import * as departmentApi from '@/api/departments'

let dataLoadPromise: Promise<IDepartment[]> | null = null

export const useDepartmentConfig = defineStore('department', {
    state() {
        return {
            departmentList: [] as IDepartment[],
            _isFetching: false,
        }
    },
    getters: {
        getDepartmentList(state) {
            return state.departmentList
        },
        getDepartmentById(state) {
            return (id: number) => {
                return state.departmentList.find(item => item.id === id)
            }
        },
    },
    actions: {
        getDataLoadPromise() {
            if (!dataLoadPromise) {
                dataLoadPromise = this.fetchAllDepartments()
            }
            return dataLoadPromise
        },
        async fetchAllDepartments() {
            if (this._isFetching) {
                return this.departmentList
            }
            this._isFetching = true
            try {
                const departments = await departmentApi.api_getAllDepartments()
                this.departmentList = departments.sort((a, b) => a.sort - b.sort)
                return departments
            }
            catch (error) {
                console.error('Failed to fetch departments:', error)
                return []
            }
            finally {
                this._isFetching = false
            }
        },
        setDepartmentList(departmentList: IDepartment[]) {
            this.departmentList = departmentList
        },
        async addDepartment(department: IDepartment) {
            try {
                const newDepartment = await departmentApi.api_createDepartment(department)
                this.departmentList.push(newDepartment)
                this.departmentList.sort((a, b) => a.sort - b.sort)
                return newDepartment
            }
            catch (error) {
                console.error('Failed to create department:', error)
                throw error
            }
        },
        async updateDepartment(department: IDepartment) {
            try {
                const updatedDepartment = await departmentApi.api_updateDepartment(department.id, department)
                const index = this.departmentList.findIndex(item => item.id === department.id)
                if (index !== -1) {
                    this.departmentList[index] = updatedDepartment
                    this.departmentList.sort((a, b) => a.sort - b.sort)
                }
                return updatedDepartment
            }
            catch (error) {
                console.error('Failed to update department:', error)
                throw error
            }
        },
        async deleteDepartment(id: number) {
            try {
                await departmentApi.api_deleteDepartment(id)
                this.departmentList = this.departmentList.filter(item => item.id !== id)
            }
            catch (error) {
                console.error('Failed to delete department:', error)
                throw error
            }
        },
        async deleteAllDepartments() {
            try {
                await departmentApi.api_deleteAllDepartments()
                this.departmentList = [] as IDepartment[]
            }
            catch (error) {
                console.error('Failed to delete all departments:', error)
                throw error
            }
        },
    },
})
