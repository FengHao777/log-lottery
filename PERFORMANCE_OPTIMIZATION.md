# 首页性能优化总结

## 优化日期
2026-01-30

## 问题描述
首页掉帧比较严重，特别是在抽奖准备和抽奖过程中。

## 性能瓶颈分析

### 1. Three.js渲染性能问题
- **CSS3DRenderer性能问题**：基于DOM的渲染器，性能比WebGLRenderer差很多
- **频繁的渲染调用**：每次requestAnimationFrame都调用render()，即使没有动画更新
- **大量的Tween动画**：每个卡片都有位置和旋转的动画

### 2. DOM操作频繁
- **randomBallData定时器**：每200ms更新4个卡片的DOM样式
- **useElementStyle函数**：每次调用都修改大量的DOM样式
- **transform函数中的onComplete回调**：每个卡片动画完成时都调用useElementStyle，导致重复的DOM操作

### 3. StarsBackground组件性能问题
- **星星数量过多**：200个星星在闪烁和旋转
- **resize事件频繁触发**：没有节流，导致频繁创建sparticles实例

## 优化方案

### 1. 优化Three.js渲染性能

#### 文件：`src/views/Home/useViewModel.ts`

**优化1：添加渲染节流**
```typescript
let lastRenderTime = 0
const renderThrottleDelay = 1000 / 60 // 限制为60fps

function render() {
    const now = performance.now()
    if (now - lastRenderTime >= renderThrottleDelay) {
        if (renderer.value) {
            renderer.value.render(scene.value, camera.value)
        }
        lastRenderTime = now
    }
}
```

**优化2：优化animation函数，只在有动画更新时才渲染**
```typescript
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
```

### 2. 优化DOM操作和动画

#### 文件：`src/views/Home/useViewModel.ts`

**优化3：减少randomBallData的执行频率和更新数量**
```typescript
function randomBallData(mod: 'default' | 'lucky' | 'sphere' = 'default') {
    // 优化：降低更新频率，从200ms改为500ms，减少DOM操作
    intervalTimer.value = setInterval(() => {
        // 产生随机数数组，减少每次更新的数量，从4个减少到2个
        const indexLength = 2
        // ... 其他代码
    }, 500)
}
```

**优化4：移除每个卡片Tween动画完成时的onComplete回调**
```typescript
// 移除了每个卡片的onComplete回调
new TWEEN.Tween(object.rotation)
    .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration)
    .easing(TWEEN.Easing.Exponential.InOut)
    .start()
    // 移除了onComplete回调
```

**优化5：在transform函数的最后onComplete中统一处理DOM操作**
```typescript
new TWEEN.Tween({})
    .to({}, duration * 2)
    .onUpdate(render)
    .start()
    .onComplete(() => {
        // 优化：只在所有动画完成后执行一次DOM操作
        if (luckyCardList.value.length) {
            luckyCardList.value.forEach((cardIndex: any) => {
                const item = objects.value[cardIndex]
                useElementStyle({
                    element: item.element,
                    person: {} as any,
                    index: cardIndex,
                    patternList: patternList.value,
                    patternColor: patternColor.value,
                    cardColor: cardColor.value,
                    cardSize: cardSize.value,
                    scale: 1,
                    textSize: textSize.value,
                    mod: 'sphere',
                    usePhotoBackground: true,
                })
            })
        }
        luckyTargets.value = []
        luckyCardList.value = []
        canOperate.value = true
        resolve('')
    })
```

**优化6：使用requestAnimationFrame批量处理DOM操作**
```typescript
if (patternList.value.length) {
    requestAnimationFrame(() => {
        for (let i = 0; i < patternList.value.length; i++) {
            if (i < rowCount.value * 7) {
                objects.value[patternList.value[i] - 1].element.style.backgroundColor = rgba(cardColor.value, Math.random() * 0.5 + 0.25)
            }
        }
    })
}
```

### 3. 优化定时器和事件处理

#### 文件：`src/views/Home/components/StarsBackground/index.vue`

**优化7：减少星星数量**
```typescript
// 优化：减少星星数量从200减少到100，降低性能开销
const options = ref({ shape: 'star', parallax: 1.2, rotate: true, twinkle: true, speed: 10, count: 100 })
```

**优化8：添加resize事件节流**
```typescript
let resizeTimer: any = null

function listenWindowSize() {
    window.addEventListener('resize', () => {
        // 节流：使用setTimeout避免频繁触发
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
            if (width.value && height.value) {
                addSparticles(starRef.value, width.value, height.value)
            }
        }, 200)
    })
}
```

**优化9：清理sparticles实例**
```typescript
let sparticleInstance: any = null

function addSparticles(node: any, width: number, height: number) {
    // 清理旧的实例
    if (sparticleInstance) {
        sparticleInstance.destroy()
    }
    sparticleInstance = new Sparticles(node, options.value, width, height)
    return sparticleInstance
}

onUnmounted(() => {
    window.removeEventListener('resize', listenWindowSize)
    // 清理sparticles实例
    if (sparticleInstance) {
        sparticleInstance.destroy()
        sparticleInstance = null
    }
    clearTimeout(resizeTimer)
})
```

## 优化效果

### 预期改进
1. **渲染性能**：通过节流和条件渲染，减少不必要的渲染调用，预计提升30-50%的渲染性能
2. **DOM操作**：减少DOM操作频率和数量，预计减少60%的DOM操作
3. **内存占用**：清理sparticles实例，避免内存泄漏
4. **帧率稳定性**：通过减少不必要的更新，提高帧率稳定性

### 测试建议
1. 使用Chrome DevTools的Performance工具测试优化前后的性能差异
2. 使用Lighthouse测试页面性能评分
3. 在不同设备上测试，特别是性能较低的设备

## 后续优化建议

1. **考虑使用WebGLRenderer替代CSS3DRenderer**：
   - WebGLRenderer性能更好，但需要重新实现部分功能
   - 可以考虑混合使用，在需要3D效果时使用WebGLRenderer，其他情况使用CSS3DRenderer

2. **实现虚拟列表**：
   - 如果卡片数量很大，可以考虑实现虚拟列表，只渲染可见区域的卡片
   - 这可以大幅减少DOM元素的数量

3. **使用Web Worker**：
   - 将复杂的计算逻辑放到Web Worker中执行
   - 避免阻塞主线程

4. **图片懒加载**：
   - 对于头像图片，可以实现懒加载
   - 只在卡片进入可视区域时才加载图片

5. **使用CSS transform替代直接修改样式**：
   - CSS transform使用GPU加速，性能更好
   - 可以将位置、旋转等动画使用CSS transform实现

## 总结

本次优化主要针对首页掉帧问题，通过减少渲染调用、优化DOM操作、添加节流等方式，预计可以显著提升页面性能。建议在优化后进行性能测试，验证优化效果。
