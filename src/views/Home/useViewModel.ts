import type { Material, Object3D } from 'three'
import type { TargetType } from './type'
import type { IPersonConfig } from '@/types/storeType'
import * as TWEEN from '@tweenjs/tween.js'
import { storeToRefs } from 'pinia'
import { PerspectiveCamera, Scene } from 'three'
import { CSS3DObject, CSS3DRenderer } from 'three-css3d'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useToast } from 'vue-toast-notification'
import dongSound from '@/assets/audio/end.mp3'
import enterAudio from '@/assets/audio/enter.wav'
import worldCupAudio from '@/assets/audio/worldcup.mp3'
import { SINGLE_TIME_MAX_PERSON_COUNT } from '@/constant/config'
import { useElementPosition, useElementStyle } from '@/hooks/useElement'
import i18n from '@/locales/i18n'
import useStore from '@/store'
import { selectCard } from '@/utils'
import { rgba } from '@/utils/color'
import { LotteryStatus } from './type'
import { confettiFire, createSphereVertices, createTableVertices, getRandomElements, initTableData } from './utils'

const maxAudioLimit = 10
export function useViewModel() {
    const toast = useToast()
    // store里面存储的值
    const { personConfig, globalConfig, prizeConfig } = useStore()
    const {
        getAllPersonList: allPersonList,
        getNotPersonList: notPersonList,
        getNotThisPrizePersonList: notThisPrizePersonList,
    } = storeToRefs(personConfig)
    const { getCurrentPrize: currentPrize } = storeToRefs(prizeConfig)
    const {
        getCardColor: cardColor,
        getPatterColor: patternColor,
        getPatternList: patternList,
        getTextColor: textColor,
        getLuckyColor: luckyColor,
        getCardSize: cardSize,
        getTextSize: textSize,
        getRowCount: rowCount,
        getIsShowAvatar: isShowAvatar,
        getTitleFont: titleFont,
        getTitleFontSyncGlobal: titleFontSyncGlobal,
        getDefiniteTime: definiteTime,
        getWinMusic: isPlayWinMusic,
    } = storeToRefs(globalConfig)
    // three初始值
    const ballRotationY = ref(0)
    const containerRef = ref<HTMLElement>()
    const canOperate = ref(true)
    const cameraZ = ref(3000)
    const scene = ref()
    const camera = ref()
    const renderer = ref()
    const controls = ref()
    const objects = ref<any[]>([])
    const targets: TargetType = {
        grid: [],
        helix: [],
        table: [],
        sphere: [],
    }
    // 页面数据初始值
    const currentStatus = ref<LotteryStatus>(LotteryStatus.init) // 0为初始状态， 1为抽奖准备状态，2为抽奖中状态，3为抽奖结束状态
    const tableData = ref<any[]>([])
    const luckyTargets = ref<any[]>([])
    const luckyCardList = ref<number[]>([])
    const luckyCount = ref(10)
    const personPool = ref<IPersonConfig[]>([])
    const intervalTimer = ref<any>(null)
    const isInitialDone = ref<boolean>(false)
    const animationFrameId = ref<any>(null)
    const playingAudios = ref<HTMLAudioElement[]>([])
    let lastRenderTime = 0
    const renderThrottleDelay = 1000 / 60 // 限制为60fps

    // 抽奖音乐相关
    const lotteryMusic = ref<HTMLAudioElement | null>(null)

    function initThreeJs() {
        console.log('initThreeJs 开始...')
        console.log('containerRef.value:', containerRef.value)
        
        if (!containerRef.value) {
            console.error('containerRef.value 为 null，无法初始化3D场景')
            toast.open({
                message: '3D容器未找到，请刷新页面重试',
                type: 'error',
                position: 'top-right',
                duration: 10000,
            })
            return
        }
        
        const felidView = 40
        const width = window.innerWidth
        const height = window.innerHeight
        const aspect = width / height
        const nearPlane = 1
        const farPlane = 10000
        const WebGLoutput = containerRef.value

        console.log('创建 Scene, Camera, Renderer...')
        scene.value = new Scene()
        camera.value = new PerspectiveCamera(felidView, aspect, nearPlane, farPlane)
        camera.value.position.z = cameraZ.value
        renderer.value = new CSS3DRenderer()
        renderer.value.setSize(width, height * 0.9)
        renderer.value.domElement.style.position = 'absolute'
        // 垂直居中
        renderer.value.domElement.style.paddingTop = '50px'
        renderer.value.domElement.style.top = '50%'
        renderer.value.domElement.style.left = '50%'
        renderer.value.domElement.style.transform = 'translate(-50%, -50%)'
        WebGLoutput.appendChild(renderer.value.domElement)
        console.log('Renderer DOM 元素已添加到容器')

        controls.value = new TrackballControls(camera.value, renderer.value.domElement)
        controls.value.rotateSpeed = 1
        controls.value.staticMoving = true
        controls.value.minDistance = 500
        controls.value.maxDistance = 6000
        controls.value.addEventListener('change', render)

        const tableLen = tableData.value.length
        console.log(`开始创建 ${tableLen} 个卡片...`)
        for (let i = 0; i < tableLen; i++) {
            if (i === 0) {
                console.log('第一个卡片数据:', tableData.value[i])
            }
            let element = document.createElement('div')
            element.className = 'element-card'

            // GPU加速属性
            element.style.transformStyle = 'preserve-3d'
            element.style.backfaceVisibility = 'hidden'
            element.style.perspective = '1000px'
            element.style.willChange = 'transform, opacity'
            element.style.contain = 'layout style paint'

            const number = document.createElement('div')
            number.className = 'card-id'
            number.textContent = tableData.value[i].uid
            if (isShowAvatar.value)
                number.style.display = 'none'
            element.appendChild(number)

            const symbol = document.createElement('div')
            symbol.className = 'card-name'
            symbol.textContent = tableData.value[i].name
            if (isShowAvatar.value)
                symbol.className = 'card-name card-avatar-name'
            element.appendChild(symbol)

            const detail = document.createElement('div')
            detail.className = 'card-detail'
            detail.innerHTML = `${tableData.value[i].department}<br/>${tableData.value[i].identity}`
            if (isShowAvatar.value)
                detail.style.display = 'none'
            element.appendChild(detail)

            if (isShowAvatar.value) {
                const avatar = document.createElement('img')
                avatar.className = 'card-avatar'
                // 优先使用缩略图URL，如果没有则使用原始图片（包括base64）
                const avatarUrl = tableData.value[i].thumbnailAvatar || tableData.value[i].avatar
                avatar.src = avatarUrl || ''
                avatar.alt = 'avatar'
                avatar.style.width = '140px'
                avatar.style.height = '140px'
                // 图片GPU加速
                avatar.style.willChange = 'transform'
                avatar.style.transform = 'translateZ(0)'
                element.appendChild(avatar)
            }
            else {
                const avatarEmpty = document.createElement('div')
                avatarEmpty.style.display = 'none'
                element.appendChild(avatarEmpty)
            }

            element = useElementStyle({
                element,
                person: tableData.value[i],
                index: i,
                patternList: patternList.value,
                patternColor: patternColor.value,
                cardColor: cardColor.value,
                cardSize: cardSize.value,
                scale: 1,
                textSize: textSize.value,
                mod: 'default',
                usePhotoBackground: true, // 使用照片作为背景
            },
            )
            const object = new CSS3DObject(element)
            // 初始化位置使用 Math.random() 以保证性能
            object.position.x = Math.random() * 4000 - 2000
            object.position.y = Math.random() * 4000 - 2000
            object.position.z = Math.random() * 4000 - 2000
            scene.value.add(object)

            objects.value.push(object)
        }
        // 创建横铺的界面
        const tableVertices = createTableVertices({ tableData: tableData.value, rowCount: rowCount.value, cardSize: cardSize.value })
        targets.table = tableVertices
        // 创建球体
        const sphereVertices = createSphereVertices({ objectsLength: objects.value.length })
        targets.sphere = sphereVertices
        window.addEventListener('resize', onWindowResize, false)
        transform(targets.table, 1000)
        render()
    }
    function render() {
        const now = performance.now()
        if (now - lastRenderTime >= renderThrottleDelay) {
            if (renderer.value) {
                renderer.value.render(scene.value, camera.value)
            }
            lastRenderTime = now
        }
    }
    /**
     * @description: 位置变换
     * @param targets 目标位置
     * @param duration 持续时间
     */
    function transform(targets: any[], duration: number) {
        TWEEN.removeAll()
        if (intervalTimer.value) {
            clearInterval(intervalTimer.value)
            intervalTimer.value = null
            randomBallData('sphere')
        }

        return new Promise((resolve) => {
            const objLength = objects.value.length
            // 优化：分批次执行动画，减少同时运行的动画数量
            const BATCH_SIZE = 10 // 每批次处理10个卡片
            const BATCH_DELAY = 50 // 批次间隔50ms

            // 创建所有Tween对象但不立即启动
            const positionTweens: any[] = []
            const rotationTweens: any[] = []

            for (let i = 0; i < objLength; ++i) {
                const object = objects.value[i]
                const target = targets[i]

                const positionTween = new TWEEN.Tween(object.position)
                    .to({ x: target.position.x, y: target.position.y, z: target.position.z }, duration)
                    .easing(TWEEN.Easing.Exponential.InOut)

                const rotationTween = new TWEEN.Tween(object.rotation)
                    .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, duration)
                    .easing(TWEEN.Easing.Exponential.InOut)

                positionTweens.push(positionTween)
                rotationTweens.push(rotationTween)
            }

            // 分批次启动动画
            let batchIndex = 0
            function startNextBatch() {
                const start = batchIndex * BATCH_SIZE
                const end = Math.min(start + BATCH_SIZE, objLength)

                for (let i = start; i < end; i++) {
                    positionTweens[i].start()
                    rotationTweens[i].start()
                }

                batchIndex++
                if (batchIndex * BATCH_SIZE < objLength) {
                    setTimeout(startNextBatch, BATCH_DELAY)
                }
            }

            // 启动第一批次
            startNextBatch()

            // 这个补间用来在位置与旋转补间同步执行，通过onUpdate在每次更新数据后渲染scene和camera
            new TWEEN.Tween({})
                .to({}, duration * 2)
                .onUpdate(render)
                .start()
                .onComplete(() => {
                    // 添加一个小延迟，让浏览器有时间完成动画
                    setTimeout(() => {
                        // 优化：使用 requestAnimationFrame 批量处理DOM操作，避免卡顿
                        requestAnimationFrame(() => {
                        // 优化：只在所有动画完成后执行一次DOM操作
                            if (luckyCardList.value.length) {
                            // 优化：预计算样式值，避免重复计算
                                const currentPatternList = patternList.value
                                const currentPatternColor = patternColor.value
                                const currentCardColor = cardColor.value
                                const currentCardSize = cardSize.value
                                const currentTextSize = textSize.value

                                luckyCardList.value.forEach((cardIndex: any) => {
                                    const item = objects.value[cardIndex]
                                    // 优化：只在需要时调用useElementStyle，避免不必要的样式更新
                                    if (!item.element.dataset.sphereStyleApplied) {
                                        useElementStyle({
                                            element: item.element,
                                            person: {} as any,
                                            index: cardIndex,
                                            patternList: currentPatternList,
                                            patternColor: currentPatternColor,
                                            cardColor: currentCardColor,
                                            cardSize: currentCardSize,
                                            scale: 1,
                                            textSize: currentTextSize,
                                            mod: 'sphere',
                                            usePhotoBackground: true, // 使用照片作为背景
                                        })
                                        item.element.dataset.sphereStyleApplied = 'true'
                                    }
                                })
                            }
                            luckyTargets.value = []
                            luckyCardList.value = []
                            canOperate.value = true
                            resolve('')
                        })
                    }, 100) // 100ms 延迟，让浏览器有时间完成动画
                })
        })
    }
    /**
     * @description: 窗口大小改变时重新设置渲染器的大小
     */
    function onWindowResize() {
        camera.value.aspect = window.innerWidth / window.innerHeight
        camera.value.updateProjectionMatrix()

        renderer.value.setSize(window.innerWidth, window.innerHeight)
        render()
    }

    /**
     * [animation update all tween && controls]
     */
    function animation() {
        const tweenUpdated = TWEEN.update()
        let controlsUpdated = false
        if (controls.value) {
            controlsUpdated = controls.value.update()
        }

        // 只有当有动画更新时才渲染
        if (tweenUpdated || controlsUpdated) {
            render()
        }

        animationFrameId.value = requestAnimationFrame(animation)
    }
    /**
     * @description: 旋转的动画
     * @param rotateY 绕y轴旋转圈数
     * @param duration 持续时间，单位秒
     */
    function rollBall(rotateY: number, duration: number) {
        TWEEN.removeAll()

        return new Promise((resolve) => {
            scene.value.rotation.y = 0
            ballRotationY.value = Math.PI * rotateY * 1000
            const rotateObj = new TWEEN.Tween(scene.value.rotation)
            rotateObj
                .to(
                    {
                        // x: Math.PI * rotateX * 1000,
                        x: 0,
                        y: ballRotationY.value,
                        // z: Math.PI * rotateZ * 1000
                        z: 0,
                    },
                    duration * 1000,
                )
                .onUpdate(render)
                .start()
                .onStop(() => {
                    resolve('')
                })
                .onComplete(() => {
                    resolve('')
                })
        })
    }
    /**
     * @description: 视野转回正面
     */
    function resetCamera() {
        new TWEEN.Tween(camera.value.position)
            .to(
                {
                    x: 0,
                    y: 0,
                    z: 3000,
                },
                1000,
            )
            .onUpdate(render)
            .start()
            .onComplete(() => {
                new TWEEN.Tween(camera.value.rotation)
                    .to(
                        {
                            x: 0,
                            y: 0,
                            z: 0,
                        },
                        1000,
                    )
                    .onUpdate(render)
                    .start()
                    .onComplete(() => {
                        canOperate.value = true
                        // camera.value.lookAt(scene.value.position)
                        camera.value.position.y = 0
                        camera.value.position.x = 0
                        camera.value.position.z = 3000
                        camera.value.rotation.x = 0
                        camera.value.rotation.y = 0
                        camera.value.rotation.z = -0
                        controls.value.reset()
                    })
            })
    }

    /**
     * @description: 开始抽奖音乐
     */
    function startLotteryMusic() {
        if (!isPlayWinMusic.value) {
            return
        }
        if (lotteryMusic.value) {
            lotteryMusic.value.pause()
            lotteryMusic.value = null
        }

        lotteryMusic.value = new Audio(worldCupAudio)
        lotteryMusic.value.loop = true
        lotteryMusic.value.volume = 0.7

        lotteryMusic.value.play().catch((error) => {
            console.error('播放抽奖音乐失败:', error)
        })
    }

    /**
     * @description: 停止抽奖音乐
     */
    function stopLotteryMusic() {
        if (!isPlayWinMusic.value) {
            return
        }
        if (lotteryMusic.value) {
            lotteryMusic.value.pause()
            lotteryMusic.value = null
        }
    }

    /**
     * @description: 播放结束音效
     */
    function playEndSound() {
        if (!isPlayWinMusic.value) {
            return
        }
        console.log('准备播放结束音效', dongSound)

        // 清理已结束的音频
        playingAudios.value = playingAudios.value.filter(audio => !audio.ended)

        try {
            const endSound = new Audio(dongSound)
            endSound.volume = 1.0

            // 简化播放逻辑
            const playPromise = endSound.play()

            if (playPromise) {
                playPromise
                    .then(() => {
                        console.log('结束音效播放成功')
                        playingAudios.value.push(endSound)
                    })
                    .catch((err) => {
                        console.error('播放失败:', err.name, err.message)
                        if (err.name === 'NotAllowedError') {
                            console.warn('自动播放被阻止，需用户交互后播放')
                        }
                    })
            }

            endSound.onended = () => {
                console.log('结束音效播放完成')
                const index = playingAudios.value.indexOf(endSound)
                if (index > -1)
                    playingAudios.value.splice(index, 1)
            }
        }
        catch (error) {
            console.error('创建音频对象失败:', error)
        }
    }

    /**
     * @description: 重置音频状态
     */
    function resetAudioState() {
        if (!isPlayWinMusic.value) {
            return
        }
        // 停止抽奖音乐
        stopLotteryMusic()

        // 清理所有正在播放的音频
        playingAudios.value.forEach((audio) => {
            if (!audio.ended && !audio.paused) {
                audio.pause()
            }
        })
        playingAudios.value = []
    }

    /**
     * @description: 开始抽奖，由横铺变换为球体（或其他图形）
     * @returns 随机抽取球数据
     */
    /// <IP_ADDRESS>description 进入抽奖准备状态
    async function enterLottery() {
        if (!canOperate.value) {
            return
        }

        // 重置音频状态
        resetAudioState()

        // 预加载音频资源以解决浏览器自动播放策略
        try {
            const audioContext = window.AudioContext || (window as any).webkitAudioContext
            if (audioContext) {
                console.log('音频上下文可用')
            }
        }
        catch (e) {
            console.warn('音频上下文不可用:', e)
        }

        if (!intervalTimer.value) {
            randomBallData()
        }
        // 优化：使用requestAnimationFrame批量处理DOM操作
        if (patternList.value.length) {
            requestAnimationFrame(() => {
                for (let i = 0; i < patternList.value.length; i++) {
                    if (i < rowCount.value * 7) {
                        // 动画效果使用 Math.random() 以保证性能
                        objects.value[patternList.value[i] - 1].element.style.backgroundColor = rgba(cardColor.value, Math.random() * 0.5 + 0.25)
                    }
                }
            })
        }
        canOperate.value = false
        await transform(targets.sphere, 1000)
        currentStatus.value = LotteryStatus.ready
        rollBall(0.1, 2000)
    }
    /**
     * @description 开始抽奖
     */
    async function startLottery() {
        if (!canOperate.value) {
            return
        }
        // 从后端获取最新的奖品列表和当前奖品状态
        try {
            await prizeConfig.fetchAllPrizes()
            console.log('已从后端获取最新奖品数据')
        }
        catch (error) {
            console.error('获取最新奖品状态失败:', error)
            toast.open({
                message: '获取奖品状态失败，请重试',
                type: 'error',
                position: 'top-right',
                duration: 5000,
            })
            return
        }

        // 验证是否已选择当前奖项
        if (!currentPrize.value || !currentPrize.value.id) {
            console.error('当前奖项未设置，请从左侧奖项列表中选择一个奖项')
            toast.open({
                message: '请先从左侧奖项列表中选择一个奖项再开始抽奖',
                type: 'warning',
                position: 'top-right',
                duration: 10000,
            })
            return
        }

        // 验证是否已抽完全部奖项
        console.log('当前奖品状态:', {
            name: currentPrize.value.name,
            id: currentPrize.value.id,
            isUsed: currentPrize.value.isUsed,
            count: currentPrize.value.count,
            isUsedCount: currentPrize.value.isUsedCount,
            separateCount: currentPrize.value.separateCount,
        })

        // 首先检查当前奖项是否已完成
        const isPrizeCompleted = currentPrize.value && (currentPrize.value.isUsed || currentPrize.value.isUsedCount >= currentPrize.value.count)
        if (isPrizeCompleted) {
            console.error('当前奖项已完成 - 奖品:', currentPrize.value.name, 'isUsed:', currentPrize.value.isUsed, 'isUsedCount:', currentPrize.value.isUsedCount, 'count:', currentPrize.value.count)
            // 检查是否所有奖品都已完成（同时检查 isUsed 和 isUsedCount）
            const allPrizes = prizeConfig.getPrizeConfig
            const hasUnfinishedPrizes = allPrizes.some((p: any) => !p.isUsed && p.isUsedCount < p.count)
            console.log('奖品列表状态:', allPrizes.map((p: any) => ({ name: p.name, isUsed: p.isUsed, isUsedCount: p.isUsedCount, count: p.count })))
            console.log('是否存在未完成的奖品:', hasUnfinishedPrizes)
            if (!hasUnfinishedPrizes) {
                toast.open({
                    message: '所有奖品已全部抽取完毕！',
                    type: 'info',
                    position: 'top-right',
                    duration: 10000,
                })
            }
            else {
                const nextPrize = allPrizes.find((p: any) => !p.isUsed && p.isUsedCount < p.count)
                if (nextPrize) {
                    toast.open({
                        message: `当前奖项${currentPrize.value.name}已完成，请点击左侧奖项列表切换到${nextPrize.name}`,
                        type: 'warning',
                        position: 'top-right',
                        duration: 10000,
                    })
                }
                else {
                    toast.open({
                        message: `当前奖项${currentPrize.value.name}已完成，请点击左侧奖项列表切换到其他未完成的奖项`,
                        type: 'warning',
                        position: 'top-right',
                        duration: 10000,
                    })
                }
            }

            return
        }
        if (isPrizeCompleted || !currentPrize.value) {
            console.error('奖品已标记为已完成或不存在 - 奖品:', currentPrize.value.name, 'isUsed:', currentPrize.value.isUsed)
            // 检查是否所有奖品都已完成（同时检查 isUsed 和 isUsedCount）
            const allPrizes = prizeConfig.getPrizeConfig
            const hasUnfinishedPrizes = allPrizes.some((p: any) => !p.isUsed && p.isUsedCount < p.count)
            console.log('奖品列表状态:', allPrizes.map((p: any) => ({ name: p.name, isUsed: p.isUsed, isUsedCount: p.isUsedCount, count: p.count })))
            console.log('是否存在未完成的奖品:', hasUnfinishedPrizes)
            if (!hasUnfinishedPrizes) {
                toast.open({
                    message: '所有奖品已全部抽取完毕！',
                    type: 'info',
                    position: 'top-right',
                    duration: 10000,
                })
            }
            else {
                const nextPrize = allPrizes.find((p: any) => !p.isUsed && p.isUsedCount < p.count)
                if (nextPrize) {
                    toast.open({
                        message: `${currentPrize.value.name}已完成，请点击左侧奖项列表切换到${nextPrize.name}`,
                        type: 'warning',
                        position: 'top-right',
                        duration: 10000,
                    })
                }
                else {
                    toast.open({
                        message: `${currentPrize.value.name}已完成，请点击左侧奖项列表切换到其他未完成的奖项`,
                        type: 'warning',
                        position: 'top-right',
                        duration: 10000,
                    })
                }
            }

            return
        }
        // 验证奖品数量是否有效
        if (!currentPrize.value.count || currentPrize.value.count <= 0) {
            console.error('奖品数量无效 - 奖品:', currentPrize.value.name, '数量:', currentPrize.value.count)
            toast.open({
                message: i18n.global.t('error.prizeCountInvalid'),
                type: 'warning',
                position: 'top-right',
                duration: 10000,
            })

            return
        }
        // personPool.value = currentPrize.value.isAll ? notThisPrizePersonList.value : notPersonList.value
        personPool.value = currentPrize.value.isAll ? [...notThisPrizePersonList.value] : [...notPersonList.value]
        // 验证抽奖人数是否还够
        const needCount = currentPrize.value.count - currentPrize.value.isUsedCount
        console.log('抽奖验证 - 奖品:', currentPrize.value.name, '需要人数:', needCount, '可用人数:', personPool.value.length, 'isAll:', currentPrize.value.isAll)
        if (needCount <= 0) {
            console.error('奖品已全部抽完或配置错误 - 奖品:', currentPrize.value.name, '数量:', currentPrize.value.count, '已抽:', currentPrize.value.isUsedCount)
            // 检查是否所有奖品都已完成（同时检查 isUsed 和 isUsedCount）
            const allPrizes = prizeConfig.getPrizeConfig
            const hasUnfinishedPrizes = allPrizes.some((p: any) => !p.isUsed && p.isUsedCount < p.count)
            console.log('奖品列表状态:', allPrizes.map((p: any) => ({ name: p.name, isUsed: p.isUsed, isUsedCount: p.isUsedCount, count: p.count })))
            console.log('是否存在未完成的奖品:', hasUnfinishedPrizes)
            if (!hasUnfinishedPrizes) {
                toast.open({
                    message: '所有奖品已全部抽取完毕！',
                    type: 'info',
                    position: 'top-right',
                    duration: 10000,
                })
            }
            else {
                // 查找下一个未完成的奖项（同时检查 isUsed 和 isUsedCount）
                const nextPrize = allPrizes.find((p: any) => !p.isUsed && p.isUsedCount < p.count)
                if (nextPrize) {
                    toast.open({
                        message: `${currentPrize.value.name}已完成，点击左侧奖项列表切换到${nextPrize.name}`,
                        type: 'warning',
                        position: 'top-right',
                        duration: 10000,
                    })
                }
                else {
                    toast.open({
                        message: `${currentPrize.value.name}已完成，请点击左侧奖项列表切换到其他未完成的奖项`,
                        type: 'warning',
                        position: 'top-right',
                        duration: 10000,
                    })
                }
            }

            return
        }
        if (personPool.value.length < needCount) {
            console.error('抽奖人数不足 - 奖品:', currentPrize.value.name, '需要:', needCount, '可用:', personPool.value.length)
            toast.open({
                message: i18n.global.t('error.personNotEnough'),
                type: 'warning',
                position: 'top-right',
                duration: 10000,
            })

            return
        }
        // 默认置为单次抽奖最大个数
        luckyCount.value = SINGLE_TIME_MAX_PERSON_COUNT
        // 还剩多少人未抽
        let leftover = currentPrize.value.count - currentPrize.value.isUsedCount
        const customCount = currentPrize.value.separateCount
        console.log('奖品配置详情:', JSON.stringify({
            name: currentPrize.value.name,
            count: currentPrize.value.count,
            isUsedCount: currentPrize.value.isUsedCount,
            separateCount: currentPrize.value.separateCount,
            leftover,
        }))
        if (customCount && customCount.enable && customCount.countList.length > 0) {
            for (let i = 0; i < customCount.countList.length; i++) {
                if (customCount.countList[i].isUsedCount < customCount.countList[i].count) {
                    // 根据自定义人数来抽取
                    leftover = customCount.countList[i].count - customCount.countList[i].isUsedCount
                    console.log(`使用自定义分批抽奖 - 批次${i} count:${customCount.countList[i].count} isUsedCount:${customCount.countList[i].isUsedCount} leftover:${leftover}`)
                    break
                }
            }
        }
        console.log('最终抽取人数 leftover:', leftover, 'luckyCount.value:', luckyCount.value)
        luckyCount.value = leftover < luckyCount.value ? leftover : luckyCount.value
        console.log('抽奖参数设置 - luckyCount.value:', luckyCount.value, 'leftover:', leftover, 'SINGLE_TIME_MAX_PERSON_COUNT:', SINGLE_TIME_MAX_PERSON_COUNT)
        // 重构抽奖函数
        luckyTargets.value = getRandomElements(personPool.value, luckyCount.value)
        luckyTargets.value.forEach((item) => {
            const index = personPool.value.findIndex(person => person.id === item.id)
            if (index > -1) {
                personPool.value.splice(index, 1)
            }
        })

        toast.open({
            // message: `现在抽取${currentPrize.value.name} ${leftover}人`,
            message: i18n.global.t('error.startDraw', { prize: currentPrize.value.name, leftover }),
            type: 'default',
            position: 'top-right',
            duration: 8000,
        })

        // 开始播放抽奖音乐
        startLotteryMusic()

        currentStatus.value = LotteryStatus.running
        rollBall(10, 3000)
        if (definiteTime.value) {
            setTimeout(() => {
                if (currentStatus.value === LotteryStatus.running) {
                    stopLottery()
                }
            }, definiteTime.value * 1000)
        }
    }
    /**
     * @description: 停止抽奖，抽出幸运人
     */
    async function stopLottery() {
        if (!canOperate.value) {
            return
        }
        // 停止抽奖音乐
        stopLotteryMusic()

        // 播放结束音效
        playEndSound()

        //   clearInterval(intervalTimer.value)
        //   intervalTimer.value = null
        canOperate.value = false
        rollBall(0, 1)

        const windowSize = { width: window.innerWidth, height: window.innerHeight }
        luckyTargets.value.forEach((person: IPersonConfig, index: number) => {
            const cardIndex = selectCard(luckyCardList.value, tableData.value.length, person.id)
            luckyCardList.value.push(cardIndex)
            const totalLuckyCount = luckyTargets.value.length
            const item = objects.value[cardIndex]
            const { xTable, yTable, scale } = useElementPosition(
                item,
                rowCount.value,
                totalLuckyCount,
                { width: cardSize.value.width, height: cardSize.value.height },
                windowSize,
                index,
            )
            new TWEEN.Tween(item.position)
                .to({
                    x: xTable,
                    y: yTable,
                    z: 1000,
                }, 1200)
                .easing(TWEEN.Easing.Exponential.InOut)
                .onStart(() => {
                    item.element = useElementStyle({
                        element: item.element,
                        person,
                        index: cardIndex,
                        patternList: patternList.value,
                        patternColor: patternColor.value,
                        cardColor: luckyColor.value,
                        cardSize: { width: cardSize.value.width, height: cardSize.value.height },
                        scale,
                        textSize: textSize.value,
                        mod: 'lucky',
                        usePhotoBackground: true, // 使用照片作为背景
                    })
                })
                .start()
                .onComplete(() => {
                    canOperate.value = true
                    currentStatus.value = LotteryStatus.end
                })
            new TWEEN.Tween(item.rotation)
                .to({
                    x: 0,
                    y: 0,
                    z: 0,
                }, 900)
                .easing(TWEEN.Easing.Exponential.InOut)
                .start()
                .onComplete(() => {
                    playWinMusic()

                    confettiFire()
                    resetCamera()
                })
        })
    }
    // 播放音频，中将卡片越多audio对象越多，声音越大
    function playWinMusic() {
        if (!isPlayWinMusic.value) {
            return
        }
        // 清理已结束的音频
        playingAudios.value = playingAudios.value.filter(audio => !audio.ended && !audio.paused)

        if (playingAudios.value.length > maxAudioLimit) {
            console.log('音频播放数量已达到上限，请勿重复播放')
            return
        }

        const enterNewAudio = new Audio(enterAudio)
        enterNewAudio.volume = 0.8

        playingAudios.value.push(enterNewAudio)
        enterNewAudio.play()
            .then(() => {
                // 当音频播放结束后，从数组中移除
                enterNewAudio.onended = () => {
                    const index = playingAudios.value.indexOf(enterNewAudio)
                    if (index > -1) {
                        playingAudios.value.splice(index, 1)
                    }
                }
            })
            .catch((error) => {
                console.error('播放音频失败:', error)
                // 如果播放失败，也从数组中移除
                const index = playingAudios.value.indexOf(enterNewAudio)
                if (index > -1) {
                    playingAudios.value.splice(index, 1)
                }
            })

        // 播放错误时从数组中移除
        enterNewAudio.onerror = () => {
            const index = playingAudios.value.indexOf(enterNewAudio)
            if (index > -1) {
                playingAudios.value.splice(index, 1)
            }
        }
    }
    /**
     * @description: 继续,意味着这抽奖作数，计入数据库
     */
    async function continueLottery() {
        if (!canOperate.value) {
            return
        }
        console.log('继续抽奖 - 当前奖品:', currentPrize.value.name, '抽取人数:', luckyCount.value)

        // 创建奖品配置的深拷贝，避免直接修改响应式数据
        const prizeToUpdate = { ...currentPrize.value }

        const customCount = prizeToUpdate.separateCount
        if (customCount && customCount.enable && customCount.countList.length > 0) {
            for (let i = 0; i < customCount.countList.length; i++) {
                if (customCount.countList[i].isUsedCount < customCount.countList[i].count) {
                    customCount.countList[i].isUsedCount += luckyCount.value
                    console.log(`更新分批抽奖 - 批次${i} 新isUsedCount:`, customCount.countList[i].isUsedCount)
                    break
                }
            }
        }
        prizeToUpdate.isUsedCount += luckyCount.value
        luckyCount.value = 0
        console.log('更新后 isUsedCount:', prizeToUpdate.isUsedCount, '总数:', prizeToUpdate.count)

        // 检查奖品是否已完成
        const isPrizeCompleted = prizeToUpdate.isUsedCount >= prizeToUpdate.count

        if (isPrizeCompleted) {
            prizeToUpdate.isUsed = true
            prizeToUpdate.isUsedCount = prizeToUpdate.count
            console.log('奖品已完成:', prizeToUpdate.name)
        }

        // 添加中奖人员记录
        personConfig.addAlreadyPersonList(luckyTargets.value, currentPrize.value)

        // 更新奖品配置到数据库（后端会自动根据 isUsedCount 和 count 更新 isUsed 状态）
        await prizeConfig.updatePrizeConfig(prizeToUpdate)

        // 如果奖品已完成，自动切换到下一个未完成的奖项
        if (isPrizeCompleted) {
            const allPrizes = prizeConfig.getPrizeConfig
            console.log('当前奖项列表状态:', allPrizes.map((p: any) => ({
                name: p.name,
                id: p.id,
                isUsed: p.isUsed,
                isUsedCount: p.isUsedCount,
                count: p.count,
            })))
            const nextPrize = allPrizes.find((p: any) => !p.isUsed && p.isUsedCount < p.count)

            if (nextPrize) {
                console.log('找到下一个未完成的奖项:', nextPrize.name, 'ID:', nextPrize.id)
                toast.open({
                    message: `${prizeToUpdate.name}已全部抽取完毕！自动切换到${nextPrize.name}`,
                    type: 'success',
                    position: 'top-right',
                    duration: 8000,
                })
                await prizeConfig.setCurrentPrize(nextPrize)
                console.log('已自动切换到下一个奖项:', nextPrize.name)
            }
            else {
                console.log('没有找到下一个未完成的奖项，所有奖项已完成')
                toast.open({
                    message: '所有奖项已全部抽取完毕！',
                    type: 'info',
                    position: 'top-right',
                    duration: 10000,
                })
            }
        }

        // 等待奖品更新完成后再进入抽奖准备状态
        console.log('奖品更新完成，准备进入下一轮抽奖')
        await enterLottery()
    }
    /**
     * @description: 放弃本次抽奖，回到初始状态
     */
    function quitLottery() {
        // 停止抽奖音乐
        stopLotteryMusic()

        enterLottery()
        currentStatus.value = LotteryStatus.init
    }

    /**
     * @description: 随机替换卡片中的数据（不改变原有的值，只是显示）
     * @param {string} mod 模式
     */
    function randomBallData(mod: 'default' | 'lucky' | 'sphere' = 'default') {
        // 优化：降低更新频率，从200ms改为500ms，减少DOM操作
        // 优化：在抽奖运行时进一步降低更新频率到800ms，减少性能负担
        const updateInterval = currentStatus.value === LotteryStatus.running ? 800 : 500

        intervalTimer.value = setInterval(() => {
            // 优化：在抽奖运行时减少更新数量，从2个减少到1个
            const indexLength = currentStatus.value === LotteryStatus.running ? 1 : 2
            const cardRandomIndexArr: number[] = []
            const personRandomIndexArr: number[] = []

            // 优化：预计算长度，避免在循环中重复计算
            const tableDataLength = tableData.value.length
            const allPersonListLength = allPersonList.value.length

            for (let i = 0; i < indexLength; i++) {
                // 动画效果使用 Math.random() 以保证性能
                // 注意：这只是视觉效果，不影响抽奖的公平性
                const randomCardIndex = Math.floor(Math.random() * tableDataLength)
                const randomPersonIndex = Math.floor(Math.random() * allPersonListLength)
                if (luckyCardList.value.includes(randomCardIndex)) {
                    continue
                }
                cardRandomIndexArr.push(randomCardIndex)
                personRandomIndexArr.push(randomPersonIndex)
            }

            // 优化：使用 requestAnimationFrame 批量更新 DOM
            requestAnimationFrame(() => {
                // 预计算样式值，避免重复计算
                const cardColorRgba = rgba(cardColor.value, 0.25)
                const boxShadowRgba = rgba(cardColor.value, 0.5)
                const textShadowRgba = rgba(cardColor.value, 0.8)
                const textSizePx = `${textSize.value}px`
                const textSizeLineHeight = `${textSize.value * 3}px`
                const textSizeHalfPx = `${textSize.value * 0.5}px`

                for (let i = 0; i < cardRandomIndexArr.length; i++) {
                    if (!objects.value[cardRandomIndexArr[i]]) {
                        continue
                    }
                    const element = objects.value[cardRandomIndexArr[i]].element
                    const person = allPersonList.value[personRandomIndexArr[i]]

                    // 优化：只更新必要的样式，避免重复设置不变的属性
                    // 优先使用缩略图URL，如果没有则使用原始图片
                    const avatarUrl = person.thumbnailAvatar || person.avatar
                    if (avatarUrl) {
                        // 只在需要时更新背景图片
                        if (element.style.backgroundImage !== `url(${avatarUrl})`) {
                            element.style.backgroundImage = `url(${avatarUrl})`
                            element.style.backgroundSize = 'cover'
                            element.style.backgroundPosition = 'center'
                            element.style.backgroundRepeat = 'no-repeat'
                            element.style.backgroundColor = 'transparent'
                        }
                    }
                    else {
                        // 动画效果使用 Math.random() 以保证性能
                        element.style.backgroundColor = rgba(cardColor.value, Math.random() * 0.5 + 0.25)
                        element.style.backgroundImage = 'none'
                    }

                    // 优化：只在首次设置时配置GPU加速属性，避免重复设置
                    if (!element.dataset.gpuOptimized) {
                        element.style.willChange = 'transform, opacity'
                        element.style.backfaceVisibility = 'hidden'
                        element.style.perspective = '1000px'
                        element.style.border = `1px solid ${cardColorRgba}`
                        element.style.boxShadow = `0 0 12px ${boxShadowRgba}`
                        element.dataset.gpuOptimized = 'true'
                    }

                    // 更新文字内容
                    if (element.children[1]) {
                        const nameEl = element.children[1]
                        nameEl.textContent = person.name || ''
                        // 优化：只在首次设置时配置文字样式
                        if (!nameEl.dataset.styleOptimized) {
                            nameEl.style.fontSize = textSizePx
                            nameEl.style.lineHeight = textSizeLineHeight
                            nameEl.style.color = '#ffffff'
                            nameEl.dataset.styleOptimized = 'true'
                        }
                        // 每次只更新阴影，因为颜色可能变化
                        nameEl.style.textShadow = `0 0 12px ${textShadowRgba}, 2px 2px 4px rgba(0, 0, 0, 0.8)`
                    }
                    if (element.children[2]) {
                        const detailEl = element.children[2]
                        detailEl.innerHTML = `${person.department || ''}<br/>${person.identity || ''}`
                        // 优化：只在首次设置时配置文字样式
                        if (!detailEl.dataset.styleOptimized) {
                            detailEl.style.fontSize = textSizeHalfPx
                            detailEl.dataset.styleOptimized = 'true'
                        }
                    }
                }
            })
        }, updateInterval)
    }
    /**
     * @description: 键盘监听，快捷键操作
     */
    function listenKeyboard(e: any) {
        if ((e.keyCode !== 32 || e.keyCode !== 27) && !canOperate.value) {
            return
        }
        if (e.keyCode === 27 && currentStatus.value === LotteryStatus.running) {
            quitLottery()
        }
        if (e.keyCode !== 32) {
            return
        }
        switch (currentStatus.value) {
            case LotteryStatus.init:
                enterLottery()
                break
            case LotteryStatus.ready:
                startLottery()
                break
            case LotteryStatus.running:
                stopLottery()
                break
            case LotteryStatus.end:
                continueLottery()
                break
            default:
                break
        }
    }
    /**
     * @description: 清理资源，避免内存溢出
     */
    function cleanup() {
        // 停止所有Tween动画
        TWEEN.removeAll()

        // 清理动画循环
        if ((window as any).cancelAnimationFrame) {
            (window as any).cancelAnimationFrame(animationFrameId.value)
        }
        clearInterval(intervalTimer.value)
        intervalTimer.value = null

        // 停止抽奖音乐
        stopLotteryMusic()

        // 清理所有音频资源
        playingAudios.value.forEach((audio) => {
            if (!audio.ended && !audio.paused) {
                audio.pause()
            }
            // 释放音频资源
            audio.src = ''
            audio.load()
        })
        playingAudios.value = []

        if (scene.value) {
            scene.value.traverse((object: Object3D) => {
                if ((object as any).material) {
                    if (Array.isArray((object as any).material)) {
                        (object as any).material.forEach((material: Material) => {
                            material.dispose()
                        })
                    }
                    else {
                        (object as any).material.dispose()
                    }
                }
                if ((object as any).geometry) {
                    (object as any).geometry.dispose()
                }
                if ((object as any).texture) {
                    (object as any).texture.dispose()
                }
            })
            scene.value.clear()
        }

        if (objects.value) {
            objects.value.forEach((object) => {
                if (object.element) {
                    object.element.remove()
                }
            })
            objects.value = []
        }

        if (controls.value) {
            controls.value.removeEventListener('change')
            controls.value.dispose()
        }
        //   移除所有事件监听
        window.removeEventListener('resize', onWindowResize)
        scene.value = null
        camera.value = null
        renderer.value = null
        controls.value = null
    }
    /**
     * @description: 设置默认人员列表
     */
    function setDefaultPersonList() {
        personConfig.setDefaultPersonList()
        // 刷新页面
        window.location.reload()
    }
    /**
     * @description: 重置所有奖品状态（调试用）
     */
    async function resetAllPrizes() {
        const confirmed = confirm('确定要重置所有奖品状态吗？这将清除所有中奖记录，并将所有奖品重新设置为未完成状态。')
        if (!confirmed)
            return
        try {
            await prizeConfig.resetPrizes()
            toast.open({
                message: '奖品状态已重置',
                type: 'success',
                position: 'top-right',
                duration: 5000,
            })
        }
        catch (error) {
            console.error('重置奖品失败:', error)
            toast.open({
                message: '重置奖品失败',
                type: 'error',
                position: 'top-right',
                duration: 5000,
            })
        }
    }
    const init = async () => {
        console.log('开始初始化，等待数据加载...')

        try {
            console.log('开始加载人员、奖品和全局配置数据...')
            const [personsResult, prizesResult] = await Promise.all([
                personConfig.getDataLoadPromise(),
                prizeConfig.getDataLoadPromise(),
            ])
            // 单独加载全局配置，因为 ensureInitialized 返回 void
            await globalConfig.ensureInitialized()
            console.log(`数据加载完成 - 人员: ${Array.isArray(personsResult) ? personsResult.length : 'unknown'} 个, 奖品: ${Array.isArray(prizesResult) ? prizesResult.length : 'unknown'} 个, 全局配置: 已加载`)
            
            console.log(`allPersonList.value.length: ${allPersonList.value.length}`)
            console.log(`allPersonList.value:`, allPersonList.value)
            
            if (allPersonList.value.length === 0) {
                console.error('allPersonList 为空，无法初始化3D场景')
                toast.open({
                    message: '人员数据为空，请先添加人员',
                    type: 'error',
                    position: 'top-right',
                    duration: 10000,
                })
                return
            }
            
            console.log('开始初始化3D场景')

            // 从 allPersonList 中筛选出有 device_fingerprint 的用户
            const userUploadList = allPersonList.value.filter(p => p.deviceFingerprint && p.deviceFingerprint !== '')
            if (userUploadList.length > 0) {
                console.log(`已添加 ${userUploadList.length} 位用户上传的数据到抽奖名单`)
            }

            tableData.value = initTableData({ allPersonList: allPersonList.value, rowCount: rowCount.value })
            console.log(`tableData.value.length: ${tableData.value.length}`)
            
            if (tableData.value.length === 0) {
                console.error('tableData 为空，无法初始化3D场景')
                toast.open({
                    message: '表格数据为空，无法初始化3D场景',
                    type: 'error',
                    position: 'top-right',
                    duration: 10000,
                })
                return
            }
            
            initThreeJs()
            animation()
            containerRef.value!.style.color = `${textColor}`
            randomBallData()
            window.addEventListener('keydown', listenKeyboard)
            isInitialDone.value = true
            console.log('初始化完成')

            // 暴露调试函数到全局
            ;(window as any).resetAllPrizes = resetAllPrizes
            ;(window as any).reloadPrizes = () => {
                console.log('正在重新加载奖品数据...')
                prizeConfig.reloadPrizes().then(() => {
                    toast.open({
                        message: '奖品数据已重新加载',
                        type: 'success',
                        position: 'top-right',
                        duration: 5000,
                    })
                }).catch((error) => {
                    console.error('重新加载奖品数据失败:', error)
                    toast.open({
                        message: '重新加载奖品数据失败',
                        type: 'error',
                        position: 'top-right',
                        duration: 5000,
                    })
                })
            }
            console.log('调试函数已加载:')
            console.log('  window.resetAllPrizes() - 重置所有奖品状态')
            console.log('  window.reloadPrizes() - 重新加载奖品数据（修复数据不一致）')
        }
        catch (error) {
            console.error('初始化失败:', error)
            toast.open({
                message: '数据加载失败，请检查后端服务',
                type: 'error',
                position: 'top-right',
                duration: 10000,
            })
            isInitialDone.value = false
        }
    }
    onMounted(() => {
        init()
    })
    onUnmounted(() => {
        nextTick(() => {
            cleanup()
        })
        clearInterval(intervalTimer.value)
        intervalTimer.value = null
        window.removeEventListener('keydown', listenKeyboard)
    })

    return {
        setDefaultPersonList,
        resetAllPrizes,
        startLottery,
        continueLottery,
        quitLottery,
        containerRef,
        stopLottery,
        enterLottery,
        tableData,
        currentStatus,
        isInitialDone,
        titleFont,
        titleFontSyncGlobal,
    }
}
