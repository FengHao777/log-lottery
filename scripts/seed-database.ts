import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

const API_BASE_URL = 'http://localhost:8000'

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
})

async function clearDatabase() {
    console.log('清空数据库...')

    try {
        await api.delete('/api/persons/')
        console.log('✓ 已清空所有人员')
    }
    catch (error) {
        console.error('✗ 清空人员失败:', error.response?.data || error.message)
    }

    try {
        await api.delete('/api/prizes/')
        console.log('✓ 已清空所有奖项')
    }
    catch (error) {
        console.error('✗ 清空奖项失败:', error.response?.data || error.message)
    }

    try {
        await api.delete('/api/departments/')
        console.log('✓ 已清空所有部门')
    }
    catch (error) {
        console.error('✗ 清空部门失败:', error.response?.data || error.message)
    }
}

function generatePersons(count: number) {
    const persons = []
    const departments = ['技术部', '市场部', '运营部', '财务部', '人事部', '产品部', '设计部', '客服部']
    const identities = ['员工', '主管', '经理', '总监', 'VP']

    for (let i = 1; i <= count; i++) {
        persons.push({
            id: i,
            uid: `UID${String(i).padStart(6, '0')}`,
            uuid: uuidv4(),
            name: `人员${i}`,
            department: departments[Math.floor(Math.random() * departments.length)],
            identity: identities[Math.floor(Math.random() * identities.length)],
            avatar: '',
            is_win: false,
            x: 0,
            y: 0,
            create_time: new Date().toISOString(),
            update_time: new Date().toISOString(),
            prize_name: [],
            prize_id: [],
            prize_time: [],
        })
    }

    return persons
}

function generateDepartments() {
    const departments = [
        { name: '技术部', sort: 1 },
        { name: '市场部', sort: 2 },
        { name: '运营部', sort: 3 },
        { name: '财务部', sort: 4 },
        { name: '人事部', sort: 5 },
        { name: '产品部', sort: 6 },
        { name: '设计部', sort: 7 },
        { name: '客服部', sort: 8 },
    ]

    return departments.map((dept) => ({
        name: dept.name,
        sort: dept.sort,
        create_time: new Date().toISOString(),
        update_time: new Date().toISOString(),
    }))
}

function generatePrizes(count: number) {
    const prizes = []
    const prizeNames = [
        '特等奖',
        '一等奖',
        '二等奖',
        '三等奖',
        '幸运奖',
        '参与奖',
        '创新奖',
        '最佳贡献奖',
        '优秀员工奖',
        '团队协作奖',
        '进步最快奖',
        '最佳新人奖',
    ]

    for (let i = 1; i <= count; i++) {
        const prizeCount = Math.floor(Math.random() * 5) + 1
        prizes.push({
            id: i,
            name: prizeNames[i - 1],
            sort: i,
            is_all: false,
            count: prizeCount,
            is_used_count: 0,
            picture_id: uuidv4(),
            picture_name: `${prizeNames[i - 1]}.png`,
            picture_url: '',
            separate_count_enable: false,
            separate_count_list: [],
            desc: `${prizeNames[i - 1]}描述`,
            is_show: true,
            is_used: false,
            frequency: 1,
        })
    }

    return prizes
}

async function fillDatabase() {
    console.log('\n开始填充数据...')

    const departments = generateDepartments()
    console.log(`✓ 生成 ${departments.length} 个部门`)

    try {
        await api.post('/api/departments/', departments[0])
        await api.post('/api/departments/', departments[1])
        await api.post('/api/departments/', departments[2])
        await api.post('/api/departments/', departments[3])
        await api.post('/api/departments/', departments[4])
        await api.post('/api/departments/', departments[5])
        await api.post('/api/departments/', departments[6])
        await api.post('/api/departments/', departments[7])
        console.log('✓ 已批量添加部门')
    }
    catch (error) {
        console.error('✗ 添加部门失败:', error.response?.data || error.message)
    }

    const persons = generatePersons(500)
    console.log(`✓ 生成 ${persons.length} 个人员`)

    try {
        await api.post('/api/persons/batch', persons)
        console.log('✓ 已批量添加人员')
    }
    catch (error) {
        console.error('✗ 添加人员失败:', error.response?.data || error.message)
        return
    }

    const prizes = generatePrizes(12)
    console.log(`✓ 生成 ${prizes.length} 个奖项 (每个奖项 1-5 人)`)

    try {
        await api.post('/api/prizes/batch', prizes)
        console.log('✓ 已批量添加奖项')
    }
    catch (error) {
        console.error('✗ 添加奖项失败:', error.response?.data || error.message)
    }
}

async function main() {
    console.log('========================================')
    console.log('       数据库测试脚本')
    console.log('========================================\n')

    await clearDatabase()
    await fillDatabase()

    console.log('\n========================================')
    console.log('       数据填充完成！')
    console.log('========================================')
}

main().catch(console.error)
