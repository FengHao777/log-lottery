# 抽奖随机性改进文档

## 问题分析

用户反馈抽奖感觉"在几个人里面重复"，经过代码分析，发现以下情况：

### 1. 核心抽奖算法是安全的

在 `src/views/Home/utils/random.ts` 中的 `getRandomElements` 函数已经使用了加密安全的随机数生成器：

```typescript
const randomBuffer = new Uint32Array(1)
crypto.getRandomValues(randomBuffer)
const randomIndex = randomBuffer[0] % newArray.length
```

- 使用 `crypto.getRandomValues()` 生成加密安全的随机数
- 每次抽取后从池中移除已选中的元素，避免重复
- 测试文件 `__test__/Random.test.ts` 显示每个元素被抽中的概率基本相等

### 2. 可能导致"重复"感知的原因

#### a) 人员池太小
如果参与抽奖的人数很少，即使完全随机，也会感觉重复。

#### b) 奖项配置问题
在 `src/views/Home/useViewModel.ts` 中：
```typescript
personPool.value = currentPrize.value.isAll ? [...notThisPrizePersonList.value] : [...notPersonList.value]
```

如果某个奖项的 `isAll` 设置为 `true`，一个人可以多次中奖，可能导致某些人频繁出现。

#### c) 动画效果的随机性不足
在多个地方使用了 `Math.random()` 而不是加密安全的随机数生成器，虽然这不影响实际的抽奖结果，但可能影响用户的感知。

#### d) 感知偏差
人类对随机性的感知存在偏差，往往期望看到"更均匀"的分布，而真正的随机性会产生聚集现象。

## 改进措施

### 1. 核心抽奖逻辑保持加密安全的随机数

核心抽奖算法（`src/views/Home/utils/random.ts` 中的 `getRandomElements` 函数）继续使用 `crypto.getRandomValues()`，确保抽奖结果的公平性和不可预测性。

### 2. 动画效果使用 Math.random() 以保证性能

动画效果（包括卡片切换、颜色变化、位置初始化等）使用 `Math.random()`，因为这些只是视觉效果，不影响抽奖的公平性。

#### 修改的文件：

1. **src/views/Home/useViewModel.ts**
   - `randomBallData()` 函数：动画效果使用 `Math.random()`
   - 3D 对象初始化：位置随机生成使用 `Math.random()`
   - 背景颜色随机生成：使用 `Math.random()`

2. **src/utils/index.ts**
   - `selectCard()` 函数：使用 `crypto.getRandomValues()`（这个函数用于确定中奖卡片位置，影响抽奖结果）

3. **src/hooks/useElement/index.ts**
   - 卡片背景颜色随机生成：使用 `Math.random()`（动画效果）

### 3. 改进详情

#### src/views/Home/useViewModel.ts

**randomBallData 函数：**
```typescript
// 动画效果使用 Math.random() 以保证性能
const randomCardIndex = Math.floor(Math.random() * tableDataLength)
const randomPersonIndex = Math.floor(Math.random() * allPersonListLength)
```

**3D 对象位置初始化：**
```typescript
// 初始化位置使用 Math.random() 以保证性能
object.position.x = Math.random() * 4000 - 2000
object.position.y = Math.random() * 4000 - 2000
object.position.z = Math.random() * 4000 - 2000
```

**背景颜色随机生成：**
```typescript
// 动画效果使用 Math.random() 以保证性能
element.style.backgroundColor = rgba(cardColor.value, Math.random() * 0.5 + 0.25)
```

#### src/utils/index.ts

**selectCard 函数：**
```typescript
// 使用加密安全的随机数生成器（影响抽奖结果）
export function selectCard(cardIndexArr: number[], tableLength: number, personId: number): number {
    const randomBuffer = new Uint32Array(1)
    crypto.getRandomValues(randomBuffer)
    const cardIndex = randomBuffer[0] % tableLength
    if (cardIndexArr.includes(cardIndex)) {
        return selectCard(cardIndexArr, tableLength, personId)
    }
    return cardIndex
}
```

#### src/hooks/useElement/index.ts

**卡片背景颜色随机生成：**
```typescript
// 动画效果使用 Math.random() 以保证性能
if (patternList.includes(index + 1) && mod === 'default') {
    element.style.backgroundColor = rgba(patternColor, Math.random() * 0.2 + 0.8)
}
else if (mod === 'sphere' || mod === 'default') {
    element.style.backgroundColor = rgba(cardColor, Math.random() * 0.5 + 0.25)
}
```

## 改进效果

1. **保证抽奖公平性**：核心抽奖逻辑使用加密安全的随机数生成器，确保抽奖结果的公平性和不可预测性
2. **优化性能**：动画效果使用 `Math.random()`，避免在动画循环中频繁调用 `crypto.getRandomValues()` 导致的性能问题
3. **平衡安全性和性能**：只在影响抽奖结果的地方使用加密安全的随机数，视觉效果使用快速但足够随机的 `Math.random()`

## 性能优化说明

### 为什么动画效果使用 Math.random()？

1. **性能考虑**：`crypto.getRandomValues()` 比 `Math.random()` 慢得多，在动画循环中频繁调用会导致明显的卡顿
2. **不影响公平性**：动画效果只是视觉效果，不影响实际的抽奖结果
3. **足够随机**：对于视觉效果来说，`Math.random()` 提供的随机性已经足够

### 哪些地方使用加密安全的随机数？

1. **核心抽奖逻辑**：`getRandomElements()` 函数（`src/views/Home/utils/random.ts`）
2. **中奖卡片位置选择**：`selectCard()` 函数（`src/utils/index.ts`）

这些地方直接影响抽奖结果，必须使用加密安全的随机数。

## 其他建议

如果用户仍然感觉"重复"，可以考虑以下额外改进：

1. **添加抽奖统计功能**：显示每个人被抽中的次数，增加透明度
2. **添加抽奖历史记录**：记录每次抽奖的详细信息
3. **添加可视化统计**：显示抽奖结果的分布情况
4. **检查奖项配置**：确保 `isAll` 设置符合预期
5. **增加人员池**：如果人员池太小，考虑增加参与人数

## 技术说明

### crypto.getRandomValues() vs Math.random()

| 特性 | Math.random() | crypto.getRandomValues() |
|------|---------------|-------------------------|
| 安全性 | 伪随机，可预测 | 加密安全，不可预测 |
| 分布 | 可能不均匀 | 均匀分布 |
| 用途 | 一般用途、动画效果 | 安全敏感场景、抽奖结果 |
| 性能 | 较快 | 稍慢 |

### 使用策略

- **影响抽奖结果的地方**：使用 `crypto.getRandomValues()`，确保公平性
- **视觉效果的地方**：使用 `Math.random()`，保证性能

## 测试建议

建议进行以下测试来验证改进效果：

1. **随机性测试**：运行大量抽奖，验证每个元素被抽中的概率是否接近期望值
2. **用户体验测试**：观察动画效果是否流畅，没有卡顿
3. **性能测试**：确保动画循环不会导致性能问题
4. **公平性测试**：验证抽奖结果的随机性和不可预测性

## 总结

通过区分核心抽奖逻辑和动画效果，我们实现了以下目标：

1. **保证抽奖公平性**：核心抽奖逻辑使用加密安全的随机数生成器
2. **优化性能**：动画效果使用 `Math.random()`，避免性能问题
3. **平衡安全性和性能**：只在影响抽奖结果的地方使用加密安全的随机数

这种策略既保证了抽奖的公平性，又优化了性能，提供了流畅的用户体验。


## 性能优化

### 问题
用户反馈点击"继续"按钮，将中奖卡片放回球体时有明显卡顿。

### 根本原因
`transform()` 函数的 `onComplete` 回调中执行了大量的 DOM 操作，这些操作在动画刚完成时同步执行，阻塞了主线程，导致卡顿。

### 解决方案
在 `src/views/Home/useViewModel.ts` 的 `transform()` 函数中添加了 100ms 延迟：

```typescript
.onComplete(() => {
    // 添加一个小延迟，让浏览器有时间完成动画
    setTimeout(() => {
        // 优化：使用 requestAnimationFrame 批量处理DOM操作，避免卡顿
        requestAnimationFrame(() => {
            // DOM 操作...
        })
    }, 100) // 100ms 延迟，让浏览器有时间完成动画
})
```

### 效果
- 给浏览器足够的时间完成动画渲染
- 避免在动画进行时执行繁重的 DOM 操作
- 卡片返回球体的过程更加流畅
