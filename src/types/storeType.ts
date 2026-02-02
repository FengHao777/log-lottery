export interface IPersonConfig {
    id: number
    uid: string
    uuid: string
    name: string
    department: string
    identity: string
    avatar: string
    isWin: boolean
    x: number
    y: number
    createTime: string
    updateTime: string
    prizeName: string[]
    prizeId: string[]
    prizeTime: string[]
}
export interface Separate {
    id: string
    count: number
    isUsedCount: number
}
export interface IPrizeConfig {
    id: number | string
    name: string
    sort: number
    isAll: boolean
    count: number
    isUsedCount: number
    picture: {
        id: string
        name: string
        url: string | Blob | ArrayBuffer
    }
    separateCount: {
        enable: boolean
        countList: Separate[]
    }
    desc: string
    isShow: boolean
    isUsed: boolean
    frequency: number
}
export interface IMusic {
    id: string
    name: string
    url: string | Blob | ArrayBuffer
}

export interface IImage {
    id: string
    name: string
    url: string | Blob | ArrayBuffer
}

export interface WsMsgData { data: string, id: string, dateTime: string }
export interface ServerType {
    id: string
    name: string
    value: string
    host: string
}

export interface IUserUpload {
    id: string
    deviceFingerprint: string
    name: string
    department: string
    position: string
    photo: string | Blob
    createTime: string
    updateTime: string
}

export interface IDepartment {
    id: number
    name: string
    sort: number
    createTime: string
    updateTime: string
}
