# 前端工具集

一组实用的前端测试工具和页面。

## 功能模块

| 目录 | 说明 |
|------|------|
| `file-upload/` | 文件上传测试 - 预签名上传、普通上传 |
| `image-fill/` | 图片批量填充工具 - 读取Excel数据批量生成带文字的图片 |
| `gallery/` | 图片作品集展示页 - 高端大气的瀑布流画廊 |
| `pdf-export/` | PDF导出测试 - HTML转PDF功能测试 |

## 快速开始

直接用浏览器打开对应目录下的 HTML 文件即可使用，部分功能需要配合后端接口。

## 目录结构

```
├── README.md
├── file-upload/             # 文件上传测试
│   ├── index.html           # 预签名URL上传
│   ├── normal-upload.html   # 普通文件上传
│   └── README.md
├── image-fill/              # 图片批量填充工具
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── README.md
├── gallery/                 # 图片画廊
│   ├── index.html
│   └── README.md
├── pdf-export/              # PDF导出测试
│   ├── pdf-export-test.html
│   ├── dompdf-example.html
│   ├── demo8.html
│   └── README.md
├── res/                     # 公共资源文件
│   ├── photo.png
│   └── SourceHanSansSC-Normal-Min-normal.js
└── .kiro/                   # Kiro配置
```
