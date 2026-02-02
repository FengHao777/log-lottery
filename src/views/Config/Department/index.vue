<script setup lang='ts'>
import type { IDepartment } from '@/types/storeType'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toast-notification'
import PageHeader from '@/components/PageHeader/index.vue'
import { useDepartmentConfig } from '@/store/departmentConfig'

const { t } = useI18n()
const toast = useToast()
const departmentStore = useDepartmentConfig()

const departmentList = ref<IDepartment[]>([])
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const deletingDepartmentId = ref<number | null>(null)

const dialogTitle = ref('')
const dialogDepartment = ref<IDepartment>({
    id: 0,
    name: '',
    sort: 0,
    createTime: '',
    updateTime: '',
})

async function fetchDepartments() {
    await departmentStore.fetchAllDepartments()
    departmentList.value = [...departmentStore.departmentList]
}

function openAddDialog() {
    dialogTitle.value = t('button.add')
    dialogDepartment.value = {
        id: 0,
        name: '',
        sort: departmentList.value.length,
        createTime: '',
        updateTime: '',
    }
    showEditDialog.value = true
}

function openEditDialog(department: IDepartment) {
    dialogTitle.value = t('button.edit')
    dialogDepartment.value = { ...department }
    showEditDialog.value = true
}

function openDeleteDialog(id: number) {
    deletingDepartmentId.value = id
    showDeleteDialog.value = true
}

async function saveDepartment() {
    if (!dialogDepartment.value.name.trim()) {
        toast.open({
            message: '请输入部门名称',
            type: 'warning',
            position: 'top-right',
        })
        return
    }
    try {
        if (dialogDepartment.value.id === 0) {
            await departmentStore.addDepartment(dialogDepartment.value)
        }
        else {
            await departmentStore.updateDepartment(dialogDepartment.value)
        }
        await fetchDepartments()
        showEditDialog.value = false
        toast.open({
            message: '保存成功',
            type: 'success',
            position: 'top-right',
        })
    }
    catch (error: any) {
        toast.open({
            message: error.message || '保存失败',
            type: 'error',
            position: 'top-right',
        })
    }
}

async function confirmDelete() {
    if (deletingDepartmentId.value !== null) {
        try {
            await departmentStore.deleteDepartment(deletingDepartmentId.value)
            await fetchDepartments()
            showDeleteDialog.value = false
            toast.open({
                message: '删除成功',
                type: 'success',
                position: 'top-right',
            })
        }
        catch (error: any) {
            toast.open({
                message: error.message || '删除失败',
                type: 'error',
                position: 'top-right',
            })
        }
    }
}

fetchDepartments()
</script>

<template>
  <div>
    <PageHeader :title="t('table.department')">
      <template #buttons>
        <div class="flex gap-3">
          <button class="btn btn-primary btn-sm" @click="openAddDialog">
            {{ t('button.add') }}
          </button>
          <button class="btn btn-error btn-sm" @click="async () => { await departmentStore.deleteAllDepartments(); await fetchDepartments() }">
            {{ t('button.allDelete') }}
          </button>
        </div>
      </template>
    </PageHeader>

    <div class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>{{ t('table.number') }}</th>
            <th>{{ t('table.department') }}</th>
            <th>{{ t('table.sort') }}</th>
            <th>{{ t('table.createTime') }}</th>
            <th>{{ t('table.updateTime') }}</th>
            <th>{{ t('table.action') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(dept, index) in departmentList" :key="dept.id">
            <td>{{ index + 1 }}</td>
            <td>{{ dept.name }}</td>
            <td>{{ dept.sort }}</td>
            <td>{{ dept.createTime }}</td>
            <td>{{ dept.updateTime }}</td>
            <td>
              <div class="flex gap-2">
                <button class="btn btn-primary btn-xs" @click="openEditDialog(dept)">
                  {{ t('button.edit') }}
                </button>
                <button class="btn btn-error btn-xs" @click="openDeleteDialog(dept.id)">
                  {{ t('button.delete') }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="departmentList.length === 0">
            <td colspan="6" class="text-center text-gray-500">
              {{ t('data.noData') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <dialog v-if="showEditDialog" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">
          {{ dialogTitle }}
        </h3>
        <div class="py-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">{{ t('table.department') }}</span>
            </label>
            <input v-model="dialogDepartment.name" type="text" :placeholder="t('table.department')" class="input input-bordered w-full max-w-xs">
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">{{ t('table.sort') }}</span>
            </label>
            <input v-model.number="dialogDepartment.sort" type="number" placeholder="排序" class="input input-bordered w-full max-w-xs">
          </div>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn" @click="showEditDialog = false">
              {{ t('button.cancel') }}
            </button>
          </form>
          <button class="btn btn-primary" @click="saveDepartment">
            {{ t('button.confirm') }}
          </button>
        </div>
      </div>
    </dialog>

    <dialog v-if="showDeleteDialog" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">
          {{ t('dialog.titleTip') }}
        </h3>
        <p class="py-4">
          {{ t('dialog.dialogDelDepartment') || '确定要删除该部门吗？' }}
        </p>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn" @click="showDeleteDialog = false">
              {{ t('button.cancel') }}
            </button>
          </form>
          <button class="btn btn-error" @click="confirmDelete">
            {{ t('button.confirm') }}
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
</style>
