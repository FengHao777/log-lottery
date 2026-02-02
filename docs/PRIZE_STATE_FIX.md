# 奖品状态不一致问题修复说明

## 问题描述
有时候显示 `0/2` 但点击开始提示"抽完了"。

## 根本原因
前端 Pinia store 中缓存了旧的奖品数据，导致 `isUsed` 状态与 `isUsedCount` 不一致。具体表现为：
- 显示 `isUsedCount=0/count=2`（0/2）
- 但 `isUsed=true`，所以点击开始时会提示"抽完了"

## 修复内容

### 1. 后端修复 (`backend/routers/prizes.py`)

#### `update_prize` 方法
添加了自动状态同步逻辑，确保 `is_used` 始终与 `is_used_count` 和 `count` 保持一致：
```python
# 自动根据 is_used_count 和 count 更新 is_used 状态，确保数据一致性
if db_prize.is_used_count >= db_prize.count:
    db_prize.is_used = True
else:
    db_prize.is_used = False
```

#### `set_current_prize` 方法
移除了错误的逻辑（原代码会重置所有奖项的 `is_used` 状态），现在的实现不会修改任何状态，只返回当前奖项信息。

### 2. 前端修复 (`src/store/prizeConfig.ts`)

#### `updatePrizeConfig` 方法
- 使用后端返回的最新数据更新 `currentPrize`
- 优化了状态更新逻辑，当所有奖项都已使用时，保持当前奖项状态不变

#### `setCurrentPrize` 方法
- 使用后端返回的最新数据，而不是使用传入的 `prizeConfigItem`
- 同步更新 `prizeList` 中对应的奖项

#### `fetchAllPrizes` 方法
- 使用后端返回的最新数据设置 `currentPrize`

#### `insertDefaultPrizes` 方法
- 使用后端返回的最新数据设置 `currentPrize`

#### `reloadPrizes` 方法（新增）
- 重新加载所有奖项数据
- 用于修复数据不一致问题

### 3. 调试工具 (`src/views/Home/useViewModel.ts`)

暴露了两个调试函数到浏览器控制台：
- `window.resetAllPrizes()` - 重置所有奖品状态
- `window.reloadPrizes()` - 重新加载奖品数据（修复数据不一致）

## 使用方法

### 如果遇到"显示 0/2 但点击开始提示抽完了"的问题

**方法1：使用调试函数（推荐）**

在浏览器控制台中执行：
```javascript
window.reloadPrizes()
```

这会重新加载所有奖项数据，确保状态一致。

**方法2：重置所有奖品**

如果方法1无效，可以重置所有奖品状态：
```javascript
window.resetAllPrizes()
```

注意：这会清除所有中奖记录，并将所有奖品重新设置为未完成状态。

### 如果问题依然存在

1. 刷新页面
2. 检查后端日志，确认数据库中的奖品状态是否正确
3. 在浏览器控制台中执行以下命令检查当前奖品状态：
```javascript
// 检查 store 中的奖品数据
const store = useStore()
console.log('prizeList:', store.prizeConfig.getPrizeConfig)
console.log('currentPrize:', store.prizeConfig.getCurrentPrize)
```

## 预防措施

为了防止此类问题再次发生：

1. **每次抽奖完成后**，前端会自动调用 `updatePrizeConfig` 更新奖品状态
2. **后端会自动同步** `is_used` 状态，确保与 `is_used_count` 和 `count` 一致
3. **前端 store 始终使用后端返回的最新数据**，避免使用缓存数据
4. **定期调用 `reloadPrizes`** 可以确保数据一致性

## 技术细节

### 数据流程

1. **抽奖准备**：`enterLottery()` - 不修改奖品状态
2. **抽奖中**：`startLottery()` - 验证奖品状态，但不修改
3. **抽奖完成**：
   - `stopLottery()` - 显示中奖结果
   - `continueLottery()` - 调用 `updatePrizeConfig` 更新奖品状态
   - 后端自动同步 `is_used` 状态
   - 前端使用后端返回的最新数据更新 store
   - 如果奖品已完成，自动切换到下一个未完成的奖项

### 状态同步机制

- **后端**：在 `update_prize` 时自动根据 `is_used_count >= count` 判断是否完成
- **前端**：所有设置 `currentPrize` 的操作都使用后端返回的最新数据
- **一致性**：通过后端作为唯一数据源，确保前后端数据一致

## 常见问题

### Q: 为什么会出现数据不一致？
A: 可能的原因包括：
1. 前端缓存了旧数据
2. 后端在更新时没有自动同步 `is_used` 状态
3. 网络请求失败或中断

### Q: 如何避免数据不一致？
A:
1. 使用 `window.reloadPrizes()` 定期刷新数据
2. 确保后端服务正常运行
3. 避免在抽奖过程中关闭页面

### Q: 如果重置奖品后数据还是不一致怎么办？
A:
1. 检查数据库中的数据是否正确
2. 检查后端日志，确认 API 调用是否成功
3. 清除浏览器缓存和 localStorage
4. 如果问题依然存在，联系开发者

## 版本信息

- 修复日期：2025-01-31
- 影响文件：
  - `backend/routers/prizes.py`
  - `src/store/prizeConfig.ts`
  - `src/views/Home/useViewModel.ts`
