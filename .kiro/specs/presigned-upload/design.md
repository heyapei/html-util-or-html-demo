# Design Document - Presigned URL Upload

## Overview

本设计文档描述了基于预签名 URL 的前端文件上传组件的技术实现方案。该组件采用纯 JavaScript 实现，无需依赖任何框架，可以轻松集成到任何前端项目中。

上传流程分为两个阶段：
1. **获取预签名 URL**: 前端向后端 API 请求预签名 URL
2. **直接上传**: 使用获取的预签名 URL，通过 HTTP PUT 请求直接将文件上传到对象存储服务

## Architecture

```
┌─────────────────┐     1. 请求预签名URL      ┌─────────────────┐
│                 │ ─────────────────────────> │                 │
│   前端上传组件   │                            │    后端 API     │
│                 │ <───────────────────────── │                 │
└─────────────────┘     2. 返回预签名URL       └─────────────────┘
        │                                              │
        │ 3. 使用预签名URL直接上传文件                   │ 生成预签名URL
        │                                              │
        v                                              v
┌─────────────────────────────────────────────────────────────────┐
│                        对象存储服务                              │
│              (S3 / MinIO / 阿里云 OSS / 华为云 OBS)              │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. PresignedUploader 类

主要的上传管理类，负责协调整个上传流程。

```javascript
class PresignedUploader {
    constructor(options) {
        // options: { apiEndpoint, maxFileSize, allowedTypes, maxConcurrent, onSuccess, onError, onProgress, onAllComplete }
    }
    
    // 添加文件到上传队列
    addFiles(files) {}
    
    // 开始上传
    startUpload() {}
    
    // 取消指定文件的上传
    cancelUpload(fileId) {}
    
    // 取消所有上传
    cancelAll() {}
    
    // 获取上传状态
    getStatus() {}
}
```

### 2. FileItem 数据结构

```javascript
{
    id: string,           // 唯一标识符
    file: File,           // 原始 File 对象
    name: string,         // 文件名
    size: number,         // 文件大小（字节）
    type: string,         // MIME 类型
    status: string,       // 'pending' | 'uploading' | 'success' | 'error' | 'cancelled'
    progress: number,     // 上传进度 0-100
    speed: number,        // 上传速度（字节/秒）
    presignedUrl: string, // 预签名 URL
    storageUrl: string,   // 上传成功后的存储 URL
    error: string,        // 错误信息
    retryCount: number,   // 重试次数
    xhr: XMLHttpRequest   // 用于取消上传
}
```

### 3. API 接口

#### 获取预签名 URL

**请求:**
```
POST /api/presigned-url
Content-Type: application/json

{
    "filename": "example.jpg",
    "contentType": "image/jpeg",
    "size": 1024000
}
```

**响应:**
```json
{
    "success": true,
    "data": {
        "uploadUrl": "https://storage.example.com/bucket/path/file?signature=xxx&expires=xxx",
        "fileUrl": "https://storage.example.com/bucket/path/file",
        "expireTime": 3600
    }
}
```

### 4. UI 组件结构

```html
<div class="presigned-uploader">
    <!-- 上传区域 -->
    <div class="upload-area" id="dropZone">
        <input type="file" id="fileInput" multiple hidden>
        <div class="upload-placeholder">
            <span class="upload-icon">📁</span>
            <p>点击或拖拽文件到此处上传</p>
            <p class="upload-hint">支持的文件类型: jpg, png, pdf 等</p>
        </div>
    </div>
    
    <!-- 文件列表 -->
    <div class="file-list" id="fileList">
        <!-- 动态生成的文件项 -->
    </div>
    
    <!-- 操作按钮 -->
    <div class="upload-actions">
        <button id="startUpload">开始上传</button>
        <button id="cancelAll">取消全部</button>
    </div>
</div>
```

## Data Models

### UploadConfig

```javascript
{
    apiEndpoint: string,      // 后端 API 地址，默认 '/api/presigned-url'
    maxFileSize: number,      // 最大文件大小（字节），默认 100MB
    allowedTypes: string[],   // 允许的 MIME 类型，默认 ['*']
    maxConcurrent: number,    // 最大并发上传数，默认 3
    retryTimes: number,       // 失败重试次数，默认 3
    timeout: number,          // 上传超时时间（毫秒），默认 0（无超时）
}
```

### UploadState

```javascript
{
    files: FileItem[],        // 文件列表
    uploading: boolean,       // 是否正在上传
    totalSize: number,        // 总大小
    uploadedSize: number,     // 已上传大小
    totalProgress: number,    // 总进度 0-100
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File size validation
*For any* file added to the uploader, if the file size exceeds the configured maxFileSize, the file status should be set to 'error' and the file should not be added to the upload queue.
**Validates: Requirements 1.3**

### Property 2: File type validation
*For any* file added to the uploader, if the file MIME type is not in the configured allowedTypes list (when allowedTypes is not ['*']), the file should be rejected with an error message.
**Validates: Requirements 5.2**

### Property 3: File display after selection
*For any* valid file added to the uploader, the file list should contain an entry displaying the file's name and formatted size.
**Validates: Requirements 1.2**

### Property 4: Presigned URL request before upload
*For any* file upload initiated, the system should first make an API request to obtain a presigned URL before attempting to upload the file to storage.
**Validates: Requirements 2.1**

### Property 5: HTTP PUT method for upload
*For any* file upload to the presigned URL, the HTTP method used should be PUT.
**Validates: Requirements 2.2**

### Property 6: Content-Type header consistency
*For any* file upload, the Content-Type header in the upload request should match the file's MIME type.
**Validates: Requirements 2.3**

### Property 7: Retry mechanism
*For any* failed upload attempt, the system should retry up to the configured retryTimes (default 3) before marking the upload as failed.
**Validates: Requirements 2.5**

### Property 8: Progress value bounds
*For any* upload in progress, the progress value should always be between 0 and 100 inclusive.
**Validates: Requirements 3.1**

### Property 9: Success state transition
*For any* upload that completes successfully, the file status should transition to 'success' and the onSuccess callback should be invoked.
**Validates: Requirements 3.2, 6.1**

### Property 10: Error state transition
*For any* upload that fails after all retries, the file status should transition to 'error' and the onError callback should be invoked.
**Validates: Requirements 3.3, 6.2**

### Property 11: Cancel state transition
*For any* upload that is cancelled, the file status should transition to 'cancelled' and the XHR request should be aborted.
**Validates: Requirements 4.3**

### Property 12: Concurrent upload limit
*For any* batch of files being uploaded, the number of files with status 'uploading' should never exceed the configured maxConcurrent value.
**Validates: Requirements 5.3**

### Property 13: All complete callback
*For any* batch upload, when all files have reached a terminal state (success, error, or cancelled), the onAllComplete callback should be invoked exactly once.
**Validates: Requirements 6.3**

## Error Handling

### 1. 网络错误
- 自动重试机制（最多 3 次）
- 显示友好的错误提示
- 提供手动重试按钮

### 2. API 错误
- 预签名 URL 获取失败时显示具体错误信息
- 支持用户手动重试

### 3. 文件验证错误
- 文件过大：显示 "文件大小超过限制（最大 XXX MB）"
- 文件类型不支持：显示 "不支持的文件类型"

### 4. 上传超时
- 可配置超时时间
- 超时后自动重试或提示用户

## Testing Strategy

### 单元测试

使用 Jest 或类似的测试框架进行单元测试：

1. **文件验证测试**
   - 测试文件大小验证逻辑
   - 测试文件类型验证逻辑

2. **状态管理测试**
   - 测试文件状态转换
   - 测试进度计算

3. **回调测试**
   - 测试 onSuccess 回调
   - 测试 onError 回调
   - 测试 onAllComplete 回调

### 属性测试

使用 fast-check 进行属性测试：

1. **文件大小验证属性测试**
   - 生成随机大小的文件，验证大于 maxFileSize 的文件被拒绝

2. **并发限制属性测试**
   - 生成随机数量的文件，验证同时上传数不超过 maxConcurrent

3. **进度值范围属性测试**
   - 生成随机进度事件，验证进度值始终在 0-100 之间

4. **重试次数属性测试**
   - 模拟失败场景，验证重试次数不超过配置值

### 集成测试

1. **完整上传流程测试**
   - 模拟后端 API 响应
   - 验证从文件选择到上传完成的完整流程

2. **错误处理测试**
   - 模拟各种错误场景
   - 验证错误处理和用户提示

