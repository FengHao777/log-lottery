import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid'
/**
 * @description: 处理表格数据，添加x,y,id等信息
 * @param tableData 表格数据
 * @param localRowCount 每一行有多少个元素
 * @returns 处理后的表格数据
 */
export function filterData(tableData: any[], localRowCount: number) {
    const dataLength = tableData.length
    let j = 0
    for (let i = 0; i < dataLength; i++) {
        if (i % localRowCount === 0) {
            j++
        }
        tableData[i].x = i % localRowCount + 1
        tableData[i].y = j
        tableData[i].id = i
        // 是否中奖
    }

    return tableData
}

export function addOtherInfo(personList: any[]) {
    const len = personList.length
    for (let i = 0; i < len; i++) {
        personList[i].id = uuidv4()
        personList[i].createTime = dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss:ms')
        personList[i].updateTime = dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss:ms')
        personList[i].prizeName = [] as string[]
        personList[i].prizeTime = [] as string[]
        personList[i].prizeId = []
        personList[i].isWin = false
        personList[i].uuid = uuidv4()
    }

    return personList
}

export function selectCard(cardIndexArr: number[], tableLength: number, personId: number): number {
    // 使用加密安全的随机数生成器
    const randomBuffer = new Uint32Array(1)
    crypto.getRandomValues(randomBuffer)
    const cardIndex = randomBuffer[0] % tableLength
    if (cardIndexArr.includes(cardIndex)) {
        return selectCard(cardIndexArr, tableLength, personId)
    }

    return cardIndex
}

export function themeChange(theme: string) {
    // 获取根html
    const html = document.querySelectorAll('html')
    if (html) {
        html[0].setAttribute('data-theme', theme)
    }
}
