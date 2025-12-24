# PDF 导出测试

使用 dompdf.js 将 HTML 转换为 PDF 的测试页面。

## 文件说明

| 文件 | 说明 |
|------|------|
| `pdf-export-test.html` | PDF导出完整测试用例 - 包含各种HTML元素的导出测试 |
| `dompdf-example.html` | dompdf.js 使用示例 - 演示基本用法 |
| `demo8.html` | 掘金文章样式PDF导出测试 |

## 技术栈

- [dompdf.js](https://github.com/lmn1919/dompdf.js) - HTML转PDF库
- 思源黑体 (Source Han Sans SC) - 中文字体支持

## 使用说明

1. 确保 `res/SourceHanSansSC-Normal-Min-normal.js` 字体文件存在
2. 打开对应的HTML文件
3. 点击"导出PDF"按钮

## 注意事项

- 中文显示需要加载字体文件（约7MB）
- 部分CSS样式可能不被支持
- 复杂样式可使用 `foreignObjectRendering` 属性以图片方式渲染
