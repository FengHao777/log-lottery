import type { IPersonConfig } from '@/types/storeType'
import confetti from 'canvas-confetti'
import { Object3D, Vector3 } from 'three'
import { filterData } from '@/utils'
/**
 * @description 初始化表格数据
 * @param0 allPersonList 所有人的列表
 * @param1 rowCount 行数，默认是7行
 * @returns 表格数据
 */
export function initTableData({ allPersonList, rowCount }: { allPersonList: IPersonConfig[], rowCount: number }): IPersonConfig[] {
    let tableData: IPersonConfig[] = []
    if (allPersonList.length <= 0) {
        return []
    }
    const totalCount = rowCount * 7
    const allPersonLength = allPersonList.length
    if (allPersonLength < totalCount) {
        tableData = Array.from({ length: totalCount }, () => JSON.parse(JSON.stringify(allPersonList))).flat()
    }
    else {
        tableData = allPersonList.slice(0, totalCount)
    }
    tableData = filterData(tableData.slice(0, totalCount), rowCount)
    return tableData
}

/**
 * @description 横铺图形：处理数据，把每个卡片在界面的位置写入
 * @param0 tableData 表格数据
 * @param1 rowCount 每行有多少个元素
 * @param2 cardSize 卡片的大小
 * @returns  Object3D[]
 */
export function createTableVertices({ tableData, rowCount, cardSize }: { tableData: IPersonConfig[], rowCount: number, cardSize: { width: number, height: number } }): Object3D[] {
    const tableLen = tableData.length
    const objects: Object3D[] = []
    for (let i = 0; i < tableLen; i++) {
        const object = new Object3D()

        object.position.x = tableData[i].x * (cardSize.width + 40) - rowCount * 90
        object.position.y = -tableData[i].y * (cardSize.height + 20) + 1000
        object.position.z = 0
        objects.push(object)
        // targets.table.push(object)
    }
    return objects
}
/**
 * @description 创建球体
 * @param0 objectsLength 物体的个数
 * @returns Object3D[]
 */
export function createSphereVertices({ objectsLength }: { objectsLength: number }): Object3D[] {
    const resObjects: Object3D[] = []
    const vector = new Vector3()
    const radius = 800

    // 使用等面积分布算法
    // 将球体按纬度划分为等面积的带状区域，然后在每个区域内均匀分布卡片
    const goldenRatio = (1 + Math.sqrt(5)) / 2 // 黄金比例

    for (let i = 0; i < objectsLength; ++i) {
        // 计算纬度（φ）：使用等面积分布
        // i 从 0 到 objectsLength-1
        // z 从 -1 到 1（归一化）
        const z = 1 - (2 * i + 1) / objectsLength
        const phi = Math.acos(z) // 纬度

        // 计算经度（θ）：使用黄金角度，确保在相同纬度上的卡片均匀分布
        const theta = 2 * Math.PI * i / goldenRatio // 经度

        const object = new Object3D()

        // 转换为笛卡尔坐标
        object.position.x = radius * Math.sin(phi) * Math.cos(theta)
        object.position.y = radius * Math.sin(phi) * Math.sin(theta)
        object.position.z = -radius * Math.cos(phi)

        // rotation object
        vector.copy(object.position).multiplyScalar(2)
        object.lookAt(vector)
        resObjects.push(object)
    }
    return resObjects
}

export function confettiFire() {
    const duration = 2 * 1000
    const end = Date.now() + duration
    let lastFireTime = 0
    const fireInterval = 100;

    (function frame() {
        const now = Date.now()

        if (now - lastFireTime >= fireInterval) {
            lastFireTime = now

            confetti({
                particleCount: 1,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
            })

            confetti({
                particleCount: 1,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
            })
        }

        if (Date.now() < end) {
            requestAnimationFrame(frame)
        }
    }())
    centerFire(0.15, {
        spread: 26,
        startVelocity: 55,
    })
    centerFire(0.12, {
        spread: 60,
    })
    centerFire(0.2, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
    })
}
function centerFire(particleRatio: number, opts: any) {
    const count = 200
    confetti({
        origin: { y: 0.7 },
        ...opts,
        particleCount: Math.floor(count * particleRatio),
    })
}
