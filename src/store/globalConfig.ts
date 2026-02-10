import type { IImage, IMusic } from '@/types/storeType'
import { defineStore } from 'pinia'
import * as configApi from '@/api/config'
import i18n, { browserLanguage } from '@/locales/i18n'

// 默认数据（空）
const defaultImageList: IImage[] = []
const defaultMusicList: IMusic[] = []
const defaultPatternList: number[] = []

// Debounce function to avoid frequent API calls
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: any = null
    return ((...args: any[]) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
            func(...args)
        }, wait)
    }) as T
}

// import { IPrizeConfig } from '@/types/storeType';
export const useGlobalConfig = defineStore('global', {
    state() {
        return {
            _initialized: false,
            globalConfig: {
                rowCount: 15,
                isSHowPrizeList: true,
                isShowAvatar: false,
                topTitle: i18n.global.t('data.defaultTitle'),
                language: browserLanguage,
                definiteTime: null as number | null,
                winMusic: false,
                theme: {
                    name: 'dracula',
                    detail: { primary: '#0f5fd3' },
                    cardColor: '#ff79c6',
                    cardWidth: 180,
                    cardHeight: 260,
                    textColor: '#00000000',
                    luckyCardColor: '#ECB1AC',
                    textSize: 30,
                    patternColor: '#1b66c9',
                    patternList: defaultPatternList as number[],
                    background: {}, // 背景颜色或图片
                    font: '微软雅黑',
                    titleFont: '微软雅黑',
                    titleFontSyncGlobal: true,
                },
                musicList: defaultMusicList as IMusic[],
                imageList: defaultImageList as IImage[],
            },
            currentMusic: {
                item: {
                    id: '',
                    name: '',
                    url: '',
                } as IMusic,
                paused: true,
            },
        }
    },
    getters: {
        // 获取全部配置
        getGlobalConfig(state) {
            return state.globalConfig
        },
        // 获取标题
        getTopTitle(state) {
            return state.globalConfig.topTitle
        },
        // 获取行数
        getRowCount(state) {
            return state.globalConfig.rowCount
        },
        // 获取主题
        getTheme(state) {
            return state.globalConfig.theme
        },
        // 获取卡片颜色
        getCardColor(state) {
            return state.globalConfig.theme.cardColor
        },
        // 获取中奖颜色
        getLuckyColor(state) {
            return state.globalConfig.theme.luckyCardColor
        },
        // 获取文字颜色
        getTextColor(state) {
            return state.globalConfig.theme.textColor
        },
        // 获取卡片宽高
        getCardSize(state) {
            return {
                width: state.globalConfig.theme.cardWidth,
                height: state.globalConfig.theme.cardHeight,
            }
        },
        // 获取文字大小
        getTextSize(state) {
            return state.globalConfig.theme.textSize
        },
        // 获取图案颜色
        getPatterColor(state) {
            return state.globalConfig.theme.patternColor
        },
        // 获取图案列表
        getPatternList(state) {
            return state.globalConfig.theme.patternList
        },
        // 获取音乐列表
        getMusicList(state) {
            return state.globalConfig.musicList
        },
        // 获取当前音乐
        getCurrentMusic(state) {
            return state.currentMusic
        },
        // 获取图片列表
        getImageList(state) {
            return state.globalConfig.imageList
        },
        // 获取是否显示奖品列表
        getIsShowPrizeList(state) {
            return state.globalConfig.isSHowPrizeList
        },
        // 获取当前语言
        getLanguage(state) {
            return state.globalConfig.language
        },
        // 获取背景图片设置
        getBackground(state) {
            return state.globalConfig.theme.background
        },
        // 获取字体
        getFont(state) {
            return state.globalConfig.theme.font
        },
        // 获取标题字体
        getTitleFont(state) {
            return state.globalConfig.theme.titleFont
        },
        // 获取标题字体同步全局
        getTitleFontSyncGlobal(state) {
            return state.globalConfig.theme.titleFontSyncGlobal
        },
        // 获取是否显示头像
        getIsShowAvatar(state) {
            return state.globalConfig.isShowAvatar
        },
        // 获取定时抽取时间
        getDefiniteTime(state) {
            return state.globalConfig.definiteTime
        },
        // 是否播放获奖音乐
        getWinMusic(state) {
            return state.globalConfig.winMusic
        },
    },
    actions: {
        // 确保配置已初始化
        async ensureInitialized() {
            if (!this._initialized) {
                await this.fetchGlobalConfig()
                this._initialized = true
            }
        },
        // 从后端获取全局配置
        async fetchGlobalConfig() {
            try {
                const config = await configApi.api_getGlobalConfig()
                console.log('从后端获取的全局配置:', config)
                
                // 后端返回的数据已经是嵌套结构，直接使用
                this.globalConfig = {
                    rowCount: config.row_count,
                    isSHowPrizeList: config.is_show_prize_list,
                    isShowAvatar: config.is_show_avatar,
                    topTitle: config.top_title,
                    language: config.language,
                    definiteTime: config.definite_time,
                    winMusic: config.win_music,
                    theme: {
                        name: config.theme.name,
                        detail: config.theme.detail,
                        cardColor: config.theme.card_color,
                        cardWidth: config.theme.card_width,
                        cardHeight: config.theme.card_height,
                        textColor: config.theme.text_color,
                        luckyCardColor: config.theme.lucky_card_color,
                        textSize: config.theme.text_size,
                        patternColor: config.theme.pattern_color,
                        patternList: config.theme.pattern_list,
                        background: config.theme.background,
                        font: config.theme.font,
                        titleFont: config.theme.title_font,
                        titleFontSyncGlobal: config.theme.title_font_sync_global,
                    },
                    musicList: this.globalConfig.musicList, // 音乐列表暂时保持不变
                    imageList: this.globalConfig.imageList, // 图片列表暂时保持不变
                }
                this._initialized = true
                console.log('全局配置已加载:', this.globalConfig)
                return config
            }
            catch (error) {
                console.error('Failed to fetch global config:', error)
                // 如果请求失败，使用默认配置
                this._initialized = true
                return this.globalConfig
            }
        },
        // 更新全局配置到后端
        async updateGlobalConfig(config: any) {
            try {
                // 将前端数据转换为后端格式
                const backendConfig = {
                    row_count: config.rowCount,
                    is_show_prize_list: config.isSHowPrizeList,
                    is_show_avatar: config.isShowAvatar,
                    top_title: config.topTitle,
                    language: config.language,
                    definite_time: config.definiteTime,
                    win_music: config.winMusic,
                    theme_name: config.theme.name,
                    theme_detail: config.theme.detail,
                    card_color: config.theme.cardColor,
                    card_width: config.theme.cardWidth,
                    card_height: config.theme.cardHeight,
                    text_color: config.theme.textColor,
                    lucky_card_color: config.theme.luckyCardColor,
                    text_size: config.theme.textSize,
                    pattern_color: config.theme.patternColor,
                    pattern_list: config.theme.patternList,
                    background: config.theme.background,
                    font: config.theme.font,
                    title_font: config.theme.titleFont,
                    title_font_sync_global: config.theme.titleFontSyncGlobal,
                }
                const updatedConfig = await configApi.api_updateGlobalConfig(backendConfig)
                return updatedConfig
            }
            catch (error) {
                console.error('Failed to update global config:', error)
                throw error
            }
        },
        // 保存配置到后端（debounced version）
        saveConfig: debounce(async function (this: any) {
            try {
                const config = this.globalConfig
                const backendConfig = {
                    row_count: config.rowCount,
                    is_show_prize_list: config.isSHowPrizeList,
                    is_show_avatar: config.isShowAvatar,
                    top_title: config.topTitle,
                    language: config.language,
                    definite_time: config.definiteTime,
                    win_music: config.winMusic,
                    theme_name: config.theme.name,
                    theme_detail: config.theme.detail,
                    card_color: config.theme.cardColor,
                    card_width: config.theme.cardWidth,
                    card_height: config.theme.cardHeight,
                    text_color: config.theme.textColor,
                    lucky_card_color: config.theme.luckyCardColor,
                    text_size: config.theme.textSize,
                    pattern_color: config.theme.patternColor,
                    pattern_list: config.theme.patternList,
                    background: config.theme.background,
                    font: config.theme.font,
                    title_font: config.theme.titleFont,
                    title_font_sync_global: config.theme.titleFontSyncGlobal,
                }
                await configApi.api_updateGlobalConfig(backendConfig)
            }
            catch (error) {
                console.error('Failed to save config:', error)
            }
        }, 500),
        // 设置全局配置
        setGlobalConfig(data: any) {
            this.globalConfig = data
        },
        // 设置rowCount
        setRowCount(rowCount: number) {
            this.globalConfig.rowCount = rowCount
            this.saveConfig()
        },
        // 设置标题
        setTopTitle(topTitle: string) {
            this.globalConfig.topTitle = topTitle
            this.saveConfig()
        },
        // 设置主题
        setTheme(theme: any) {
            const { name } = theme
            this.globalConfig.theme.name = name
            this.saveConfig()
        },
        // 设置卡片颜色
        setCardColor(cardColor: string) {
            this.globalConfig.theme.cardColor = cardColor
            this.saveConfig()
        },
        // 设置中奖颜色
        setLuckyCardColor(luckyCardColor: string) {
            this.globalConfig.theme.luckyCardColor = luckyCardColor
            this.saveConfig()
        },
        // 设置文字颜色
        setTextColor(textColor: string) {
            this.globalConfig.theme.textColor = textColor
            this.saveConfig()
        },
        // 设置卡片宽高
        setCardSize(cardSize: { width: number, height: number }) {
            this.globalConfig.theme.cardWidth = cardSize.width
            this.globalConfig.theme.cardHeight = cardSize.height
            this.saveConfig()
        },
        // 设置文字大小
        setTextSize(textSize: number) {
            this.globalConfig.theme.textSize = textSize
            this.saveConfig()
        },
        // 设置图案颜色
        setPatterColor(patterColor: string) {
            this.globalConfig.theme.patternColor = patterColor
            this.saveConfig()
        },
        // 设置图案列表
        setPatternList(patternList: number[]) {
            this.globalConfig.theme.patternList = patternList
            this.saveConfig()
        },
        // 重置图案列表
        resetPatternList() {
            this.globalConfig.theme.patternList = defaultPatternList
        },
        // 添加音乐
        addMusic(music: IMusic) {
            // 验证音乐是否已存在，看name字段
            for (let i = 0; i < this.globalConfig.musicList.length; i++) {
                if (this.globalConfig.musicList[i].name === music.name) {
                    return
                }
            }
            this.globalConfig.musicList.push(music)
        },
        // 删除音乐
        removeMusic(musicId: string) {
            for (let i = 0; i < this.globalConfig.musicList.length; i++) {
                if (this.globalConfig.musicList[i].id === musicId) {
                    this.globalConfig.musicList.splice(i, 1)
                    break
                }
            }
        },
        // 设置当前播放音乐
        setCurrentMusic(musicItem: IMusic, paused: boolean = true) {
            this.currentMusic = {
                item: musicItem,
                paused,
            }
        },
        // 重置音乐列表
        resetMusicList() {
            this.globalConfig.musicList = JSON.parse(JSON.stringify(defaultMusicList)) as IMusic[]
        },
        // 清空音乐列表
        clearMusicList() {
            this.globalConfig.musicList = [] as IMusic[]
        },
        // 添加图片
        addImage(image: IImage) {
            for (let i = 0; i < this.globalConfig.imageList.length; i++) {
                if (this.globalConfig.imageList[i].name === image.name) {
                    return
                }
            }
            this.globalConfig.imageList.push(image)
        },
        // 删除图片
        removeImage(imageId: string) {
            for (let i = 0; i < this.globalConfig.imageList.length; i++) {
                if (this.globalConfig.imageList[i].id === imageId) {
                    this.globalConfig.imageList.splice(i, 1)
                    break
                }
            }
        },
        // 重置图片列表
        resetImageList() {
            this.globalConfig.imageList = defaultImageList as IImage[]
        },
        // 清空图片列表
        clearImageList() {
            this.globalConfig.imageList = [] as IImage[]
        },
        // 设置是否显示奖品列表
        setIsShowPrizeList(isShowPrizeList: boolean) {
            this.globalConfig.isSHowPrizeList = isShowPrizeList
            this.saveConfig()
        },
        // 设置
        setLanguage(language: string) {
            this.globalConfig.language = language
            i18n.global.locale.value = language as 'zhCn' | 'en'
            this.saveConfig()
        },
        // 设置背景图片
        setBackground(background: any) {
            this.globalConfig.theme.background = background
            this.saveConfig()
        },
        // 设置字体
        setFont(font: any) {
            this.globalConfig.theme.font = font
            this.saveConfig()
        },
        // 设置标题字体
        setTitleFont(titleFont: any) {
            this.globalConfig.theme.titleFont = titleFont
            this.saveConfig()
        },
        // 设置同步全局字体
        setTitleFontSyncGlobal(titleFontSyncGlobal: boolean) {
            this.globalConfig.theme.titleFontSyncGlobal = titleFontSyncGlobal
            this.saveConfig()
        },
        // 设置是否显示头像
        setIsShowAvatar(isShowAvatar: boolean) {
            this.globalConfig.isShowAvatar = isShowAvatar
            this.saveConfig()
        },
        // 设置定时抽取时间
        setDefiniteTime(definiteTime: number | null) {
            this.globalConfig.definiteTime = definiteTime
            this.saveConfig()
        },
        // 设置是否播放获奖音乐
        setIsPlayWinMusic(winMusic: boolean) {
            this.globalConfig.winMusic = winMusic
            this.saveConfig()
        },
        // 重置所有配置
        reset() {
            this.globalConfig = {
                rowCount: 15,
                winMusic: false,
                isSHowPrizeList: true,
                isShowAvatar: false,
                topTitle: i18n.global.t('data.defaultTitle'),
                language: browserLanguage,
                definiteTime: null,
                theme: {
                    name: 'dracula',
                    detail: { primary: '#0f5fd3' },
                    cardColor: '#ff79c6',
                    cardWidth: 180,
                    cardHeight: 260,
                    textColor: '#00000000',
                    luckyCardColor: '#ECB1AC',
                    textSize: 30,
                    patternColor: '#1b66c9',
                    patternList: defaultPatternList as number[],
                    background: {}, // 背景颜色或图片
                    font: '微软雅黑',
                    titleFont: '微软雅黑',
                    titleFontSyncGlobal: true,
                },
                musicList: defaultMusicList as IMusic[],
                imageList: defaultImageList as IImage[],
            }
            this.currentMusic = {
                item: {
                    id: '',
                    name: '',
                    url: '',
                } as IMusic,
                paused: true,
            }
        },
    },
})
