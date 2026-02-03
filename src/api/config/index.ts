import request from '../request'

/**
 * 主题详情类型定义
 */
export interface IThemeDetail {
    primary: string
}

/**
 * 主题类型定义
 */
export interface ITheme {
    name: string
    detail: IThemeDetail
    card_color: string
    card_width: number
    card_height: number
    text_color: string
    lucky_card_color: string
    text_size: number
    pattern_color: string
    pattern_list: number[]
    background: Record<string, any>
    font: string
    title_font: string
    title_font_sync_global: boolean
}

/**
 * 全局配置类型定义
 */
export interface IGlobalConfig {
    id: number
    row_count: number
    is_show_prize_list: boolean
    is_show_avatar: boolean
    top_title: string
    language: string
    definite_time: number | null
    win_music: boolean
    theme: ITheme
}

/**
 * 获取全局配置
 */
export function api_getGlobalConfig() {
    return request<IGlobalConfig>({
        url: '/config/',
        method: 'GET',
    }, true)
}

/**
 * 更新全局配置
 */
export function api_updateGlobalConfig(config: Partial<IGlobalConfig>) {
    return request<IGlobalConfig>({
        url: '/config/',
        method: 'PUT',
        data: config,
    })
}

/**
 * 更新全局配置（扁平格式，用于保存配置）
 */
export function api_updateGlobalConfigFlat(config: {
    row_count?: number
    is_show_prize_list?: boolean
    is_show_avatar?: boolean
    top_title?: string
    language?: string
    definite_time?: number | null
    win_music?: boolean
    theme?: {
        name: string
        detail: { primary: string }
        card_color: string
        card_width: number
        card_height: number
        text_color: string
        lucky_card_color: string
        text_size: number
        pattern_color: string
        pattern_list: number[]
        background: Record<string, any>
        font: string
        title_font: string
        title_font_sync_global: boolean
    }
}) {
    return request<IGlobalConfig>({
        url: '/config/',
        method: 'PUT',
        data: config,
    })
}

/**
 * 重置全局配置
 */
export function api_resetGlobalConfig() {
    return request<{ status: string, message: string, config: IGlobalConfig }>({
        url: '/config/reset',
        method: 'POST',
    })
}
