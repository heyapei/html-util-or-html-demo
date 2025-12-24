# Requirements Document

## Introduction

本功能实现基于预签名 URL（Presigned URL）的前端文件上传方案。预签名 URL 是一种安全的文件上传方式，后端生成带有临时授权的 URL，前端直接使用该 URL 将文件上传到对象存储服务（如 S3、MinIO、阿里云 OSS 等），无需暴露存储服务的访问凭证。

## Glossary

- **Presigned URL（预签名URL）**: 由后端生成的带有临时授权签名的 URL，允许在有限时间内执行特定操作（如上传文件）
- **Object Storage（对象存储）**: 云存储服务，如 AWS S3、MinIO、阿里云 OSS 等
- **Upload Component（上传组件）**: 前端用于选择和上传文件的 UI 组件
- **X-File-Storage**: 一个 Java 文件存储库，支持多种存储平台的预签名 URL 生成

## Requirements

### Requirement 1

**User Story:** As a user, I want to select files from my device, so that I can upload them to the server.

#### Acceptance Criteria

1. WHEN a user clicks the upload button THEN the Upload Component SHALL open a file selection dialog
2. WHEN a user selects one or more files THEN the Upload Component SHALL display the selected file names and sizes
3. WHEN a user selects a file exceeding the maximum size limit THEN the Upload Component SHALL display an error message and prevent the upload
4. WHERE drag-and-drop is supported THEN the Upload Component SHALL accept files dropped into the upload area

### Requirement 2

**User Story:** As a user, I want to upload files using presigned URLs, so that my files are securely transferred to cloud storage.

#### Acceptance Criteria

1. WHEN a user initiates an upload THEN the Upload Component SHALL request a presigned URL from the backend API
2. WHEN the presigned URL is received THEN the Upload Component SHALL use HTTP PUT method to upload the file directly to the storage service
3. WHEN uploading a file THEN the Upload Component SHALL set the correct Content-Type header based on the file type
4. IF the presigned URL request fails THEN the Upload Component SHALL display an appropriate error message to the user
5. IF the file upload to storage fails THEN the Upload Component SHALL retry the upload up to 3 times before showing an error

### Requirement 3

**User Story:** As a user, I want to see the upload progress, so that I know how much of my file has been uploaded.

#### Acceptance Criteria

1. WHILE a file is uploading THEN the Upload Component SHALL display a progress bar showing the percentage completed
2. WHEN the upload completes successfully THEN the Upload Component SHALL display a success indicator
3. WHEN the upload fails THEN the Upload Component SHALL display an error indicator with a retry option
4. WHILE uploading THEN the Upload Component SHALL display the current upload speed

### Requirement 4

**User Story:** As a user, I want to cancel an ongoing upload, so that I can stop uploads I no longer need.

#### Acceptance Criteria

1. WHILE a file is uploading THEN the Upload Component SHALL display a cancel button
2. WHEN a user clicks the cancel button THEN the Upload Component SHALL abort the upload request immediately
3. WHEN an upload is cancelled THEN the Upload Component SHALL update the file status to "cancelled"

### Requirement 5

**User Story:** As a developer, I want the upload component to be configurable, so that I can customize it for different use cases.

#### Acceptance Criteria

1. WHEN initializing the Upload Component THEN the component SHALL accept configuration options for: API endpoint, maximum file size, allowed file types, and maximum concurrent uploads
2. WHEN a file type is not in the allowed list THEN the Upload Component SHALL reject the file and display an error message
3. WHERE multiple files are selected THEN the Upload Component SHALL limit concurrent uploads to the configured maximum

### Requirement 6

**User Story:** As a developer, I want to handle the upload completion callback, so that I can update the application state after successful uploads.

#### Acceptance Criteria

1. WHEN an upload completes successfully THEN the Upload Component SHALL invoke the onSuccess callback with the file information and storage URL
2. WHEN an upload fails THEN the Upload Component SHALL invoke the onError callback with the error details
3. WHEN all uploads in a batch complete THEN the Upload Component SHALL invoke the onAllComplete callback

