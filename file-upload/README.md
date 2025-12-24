# 文件上传测试

测试文件上传功能的工具页面。

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 预签名URL上传 - 通过后端获取预签名URL，前端直接上传到OSS |
| `normal-upload.html` | 普通文件上传 - 标准的 multipart/form-data 上传方式 |

## 预签名上传流程

1. 选择文件后，前端向后端请求预签名URL
2. 后端返回预签名URL和必要的headers
3. 前端使用PUT请求直接上传文件到OSS
4. 上传完成后查询文件信息

## API 接口

### 获取预签名URL
- 地址: `POST /test/notoken/generate/preSigned/url`
- 参数: `suffix`(文件后缀), `contentType`(文件类型)
- 返回: `uploadUrl`, `headers`, `fileName`, `datePath`

### 获取文件信息
- 地址: `POST /test/notoken/get/preSigned/file`
- 参数: `datePath`, `fileName`, `originalFileName`

### 普通上传
- 地址: `POST /test/notoken/upload`
- 参数: `file` (multipart/form-data)
