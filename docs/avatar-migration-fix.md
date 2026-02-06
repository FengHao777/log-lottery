# 头像存储问题排查与修复

## 问题描述

从移动端上传并保存照片后，有些人的头像（avatar）是base64格式，有些人的是缩略图URL，导致数据不一致。

## 问题原因分析

### 1. 数据库字段定义

在 `backend/database.py` 中，Person表定义了两个字段：
- `avatar` (Text): 存储头像，可以是base64或URL
- `thumbnail_avatar` (Text): 存储缩略图，可以是base64或URL

### 2. 移动端上传逻辑问题

在 `src/views/Mobile/useViewModel.ts` 中，原有的上传逻辑存在以下问题：

#### 新用户首次上传照片时：
1. 选择照片后，`photoPreview.value`被设置为base64（通过FileReader读取）
2. 同时生成缩略图并上传到服务器，`thumbnailPreview.value`被设置为缩略图URL
3. **问题**：提交时，`avatar`被设置为base64，`thumbnailAvatar`被设置为缩略图URL
4. **结果**：avatar是base64，thumbnailAvatar是URL

#### 已有用户不更新照片时：
1. `photoPreview.value` 使用已有的avatar
2. `thumbnailPreview.value` 直接使用已有的avatar（第43行）
3. **问题**：提交时，`avatar`和`thumbnailAvatar`都使用已有的avatar
4. **结果**：如果已有的avatar是base64，那么thumbnailAvatar也是base64；如果已有的avatar是URL，那么thumbnailAvatar也是URL

### 3. 显示逻辑

在 `src/views/Home/useViewModel.ts` 和 `src/hooks/useElement/index.ts` 中，显示头像时优先使用缩略图：
```typescript
const avatarUrl = person.thumbnailAvatar || person.avatar
```

这导致：
- 如果`thumbnailAvatar`是base64，会直接使用base64显示
- 如果`thumbnailAvatar`是URL，会使用URL显示
- 如果`thumbnailAvatar`为空，会使用avatar（可能是base64或URL）

## 解决方案

### 1. 修改移动端上传逻辑

**目标**：将avatar和thumbnailAvatar都保存为URL，而不是base64

**修改内容**：

#### a) 添加avatarUrl变量
```typescript
const avatarUrl = ref<string>('') // 存储上传后的头像URL
```

#### b) 修改initDeviceFingerprint函数
正确加载已有用户的头像URL和缩略图URL：
```typescript
avatarUrl.value = existingUser.avatar
photoPreview.value = existingUser.avatar
thumbnailPreview.value = existingUser.thumbnailAvatar || existingUser.avatar
```

#### c) 修改handlePhotoSelect函数
同时上传原始图片和缩略图到服务器：
```typescript
// 上传原始图片
const originalUploadResult = await api_uploadImage(file)
avatarUrl.value = originalUploadResult.url
photoPreview.value = originalUploadResult.url

// 生成并上传缩略图
const thumbnailFile = await generateThumbnail(file, 140, 0.6)
const thumbnailUploadResult = await api_uploadImage(thumbnailFile)
thumbnailPreview.value = thumbnailUploadResult.thumbnail_url || thumbnailUploadResult.url
```

#### d) 修改handleSubmit函数
使用上传后的URL作为头像，而不是base64：
```typescript
let photoData: string
if (userPhoto.value) {
    // 新上传的照片，使用上传后的URL
    photoData = avatarUrl.value
} else {
    // 使用已有的照片URL
    photoData = photoPreview.value
}
```

#### e) 删除不再需要的fileToBase64函数

### 2. 创建数据迁移脚本

**脚本位置**：`backend/migrate_avatar_to_url.py`

**功能**：
1. 读取数据库中所有人员记录
2. 检查avatar字段是否是base64格式（以"data:image"开头）
3. 如果是base64，将其转换为文件并保存到uploads目录
4. 生成缩略图并保存到uploads/thumbnails目录
5. 更新数据库中的avatar和thumbnail_avatar字段为URL

**使用方法**：
```bash
cd backend
python migrate_avatar_to_url.py
```

**注意事项**：
- 执行前建议备份数据库文件 (lottery.db)
- 脚本会提示确认后才执行
- 执行过程中会显示详细的处理日志

## 修改后的流程

### 新用户上传照片：
1. 选择照片 → 生成预览（base64，仅用于显示）
2. 上传原始图片到服务器 → 获取URL
3. 生成缩略图 → 上传缩略图到服务器 → 获取缩略图URL
4. 提交表单 → avatar = URL, thumbnailAvatar = 缩略图URL

### 已有用户更新照片：
1. 选择新照片 → 生成预览（base64，仅用于显示）
2. 上传原始图片到服务器 → 获取URL
3. 生成缩略图 → 上传缩略图到服务器 → 获取缩略图URL
4. 提交表单 → avatar = 新URL, thumbnailAvatar = 新缩略图URL

### 已有用户不更新照片：
1. 加载已有数据 → avatar = URL, thumbnailAvatar = 缩略图URL
2. 提交表单 → 保持原有的URL不变

## 优势

1. **数据一致性**：所有头像和缩略图都使用URL格式，避免base64和URL混用
2. **性能优化**：URL格式比base64更节省数据库空间，加载更快
3. **易于维护**：统一的存储格式，便于后续维护和管理
4. **兼容性**：向后兼容，已有的URL格式数据不受影响

## 文件修改清单

1. `src/views/Mobile/useViewModel.ts` - 修改移动端上传逻辑
2. `backend/migrate_avatar_to_url.py` - 新增数据迁移脚本

## 执行步骤

1. 修改代码：已完成
2. 运行迁移脚本：`cd backend && python migrate_avatar_to_url.py`
3. 测试移动端上传功能
4. 验证数据库中的头像格式是否正确
